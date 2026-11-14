"use server";

import { after } from "next/server";
import { telDoel } from "@/lib/meting/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { gebruikHerstelcode, maakHerstelcodes } from "@/lib/herstelcodes";
import { accountPad, veiligPad } from "@/lib/paden";
import { huidigeSessie } from "@/lib/sessie";
import { isTaal, siteNaam, type Taal } from "@/lib/site";
import { maakServerClient } from "@/lib/supabase-server";
import { ledenTeksten } from "@/lib/teksten-leden";

// Uitkomst van een formulier, getoond door het formulier zelf.
export type Formulierstaat = {
  fout?: string;
  melding?: string;
  // Velden die na een fout weer ingevuld worden (nooit wachtwoorden).
  waarden?: Record<string, string>;
  // Alleen bij 2FA instellen en nieuwe herstelcodes.
  qr?: string;
  geheim?: string;
  factorId?: string;
  codes?: string[];
  codesNietBeschikbaar?: boolean;
  poging?: number;
};

const gebruikersnaamVorm = /^[A-Za-z0-9_.-]{3,30}$/;
const emailVorm = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function tekst(formData: FormData, veld: string): string {
  const waarde = formData.get(veld);
  return typeof waarde === "string" ? waarde.trim() : "";
}

function controleerTaal(taal: string): Taal {
  if (!isTaal(taal)) throw new Error("Onbekende taal");
  return taal;
}

// Het adres van deze site, voor de links in de e-mails van Supabase.
async function siteAdres(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin && /^https?:\/\/[^/]+$/.test(origin)) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "www.winstonyip.com";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

// Zet een foutmelding van Supabase Auth om in een tekst voor de bezoeker.
function authFout(taal: Taal, fout: { code?: string; message?: string; status?: number }) {
  const f = ledenTeksten[taal].fouten;
  const code = fout.code ?? "";
  if (code === "captcha_failed") return f.botcontrole;
  if (code === "weak_password") return f.wachtwoordZwak;
  if (code === "same_password") return f.wachtwoordZelfde;
  if (code === "email_not_confirmed") return f.nietBevestigd;
  if (code === "invalid_credentials") return f.inloggen;
  if (code === "email_address_invalid") return f.email;
  if (code === "reauthentication_needed" || code === "insufficient_aal") return f.opnieuwInloggen;
  if (code === "mfa_verification_failed" || code === "mfa_challenge_expired") return f.code;
  if (code.includes("rate_limit") || fout.status === 429) return f.teVaak;
  console.error("Supabase Auth:", code, fout.message);
  return f.algemeen;
}

// ---------------------------------------------------------------------------
// Registreren (W-ACC-01, W-JUR-03)
// ---------------------------------------------------------------------------

export async function registreer(
  taalWaarde: string,
  vorige: Formulierstaat,
  formData: FormData,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];
  const poging = (vorige.poging ?? 0) + 1;

  const gebruikersnaam = tekst(formData, "gebruikersnaam");
  const email = tekst(formData, "email").toLowerCase();
  const wachtwoord = String(formData.get("wachtwoord") ?? "");
  const herhaling = String(formData.get("wachtwoord2") ?? "");
  const waarden = { gebruikersnaam, email };
  const terug = (fout: string) => ({ fout, waarden, poging });

  // Verborgen veld dat alleen robots invullen.
  if (tekst(formData, "website")) return { melding: t.controleerEmail };

  if (!gebruikersnaamVorm.test(gebruikersnaam)) return terug(t.fouten.gebruikersnaam);
  if (!emailVorm.test(email) || email.length > 254) return terug(t.fouten.email);
  if (wachtwoord.length < 10 || wachtwoord.length > 72) return terug(t.fouten.wachtwoordKort);
  if (wachtwoord !== herhaling) return terug(t.fouten.wachtwoordVerschil);
  if (formData.get("akkoord") !== "ja") return terug(t.fouten.akkoord);

  const supabase = await maakServerClient();
  if (!supabase) return terug(t.fouten.algemeen);

  const { data: vrij, error: vrijFout } = await supabase.rpc("gebruikersnaam_vrij", {
    p_naam: gebruikersnaam,
  });
  if (vrijFout) {
    console.error("gebruikersnaam_vrij:", vrijFout.message);
    return terug(t.fouten.geenDatabase);
  }
  if (!vrij) return terug(t.fouten.gebruikersnaamBezet);

  const adres = await siteAdres();
  const volgende = accountPad(taal, "tweeFactorInstellen");
  const { error } = await supabase.auth.signUp({
    email,
    password: wachtwoord,
    options: {
      emailRedirectTo: `${adres}/auth/bevestigen?volgende=${encodeURIComponent(volgende)}`,
      data: { gebruikersnaam, taal },
      captchaToken: tekst(formData, "cf-turnstile-response") || undefined,
    },
  });
  if (error) return terug(authFout(taal, error));

  // Ook als het adres al een account heeft, geeft Supabase geen fout; zo
  // kan niemand uitzoeken welke adressen een account hebben.
  after(() => telDoel("registratie_voltooid"));
  return { melding: t.controleerEmail };
}

// ---------------------------------------------------------------------------
// Inloggen, stap 1: e-mailadres en wachtwoord
// ---------------------------------------------------------------------------

export async function logIn(
  taalWaarde: string,
  volgendeWaarde: string,
  vorige: Formulierstaat,
  formData: FormData,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];
  const volgende = veiligPad(volgendeWaarde, accountPad(taal, "overzicht"));
  const poging = (vorige.poging ?? 0) + 1;

  const email = tekst(formData, "email").toLowerCase();
  const wachtwoord = String(formData.get("wachtwoord") ?? "");
  if (!email || !wachtwoord) return { fout: t.fouten.inloggen, waarden: { email }, poging };

  const supabase = await maakServerClient();
  if (!supabase) return { fout: t.fouten.algemeen, poging };

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: wachtwoord,
    options: { captchaToken: tekst(formData, "cf-turnstile-response") || undefined },
  });
  if (error || !data.user) {
    return { fout: authFout(taal, error ?? {}), waarden: { email }, poging };
  }

  const heeft2fa = (data.user.factors ?? []).some(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );
  redirect(accountPad(taal, heeft2fa ? "tweeFactor" : "tweeFactorInstellen", volgende));
}

// ---------------------------------------------------------------------------
// Inloggen, stap 2: code uit de authenticator-app (W-ACC-02, -03)
// ---------------------------------------------------------------------------

export async function bevestigTweeFactor(
  taalWaarde: string,
  volgendeWaarde: string,
  vorige: Formulierstaat,
  formData: FormData,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];
  const volgende = veiligPad(volgendeWaarde, accountPad(taal, "overzicht"));
  const poging = (vorige.poging ?? 0) + 1;

  const code = tekst(formData, "code").replace(/\s/g, "");
  if (!/^\d{6}$/.test(code)) return { fout: t.fouten.codeVorm, poging };

  const sessie = await huidigeSessie();
  if (!sessie) redirect(accountPad(taal, "inloggen", volgende));
  if (!sessie.totpFactorId) redirect(accountPad(taal, "tweeFactorInstellen", volgende));

  const supabase = await maakServerClient();
  if (!supabase) return { fout: t.fouten.algemeen, poging };
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: sessie.totpFactorId,
    code,
  });
  if (error) return { fout: authFout(taal, error), poging };

  after(() => telDoel("ingelogd"));
  redirect(volgende);
}

// ---------------------------------------------------------------------------
// 2FA instellen: QR-code tonen, daarna eerste code bevestigen
// ---------------------------------------------------------------------------

export async function start2faInstellen(
  taalWaarde: string,
  vorige: Formulierstaat,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];

  const sessie = await huidigeSessie();
  if (!sessie) redirect(accountPad(taal, "inloggen"));
  if (sessie.heeft2fa) return { fout: t.fouten.algemeen };

  const supabase = await maakServerClient();
  if (!supabase) return { fout: t.fouten.algemeen };

  // Eerder begonnen maar nooit afgemaakte koppelingen opruimen.
  const { data: lijst } = await supabase.auth.mfa.listFactors();
  for (const factor of lijst?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    issuer: siteNaam,
    friendlyName: `Authenticator ${Date.now().toString(36)}`,
  });
  if (error || !data) return { fout: authFout(taal, error ?? {}) };

  return {
    qr: data.totp.qr_code,
    geheim: data.totp.secret,
    factorId: data.id,
    poging: (vorige.poging ?? 0) + 1,
  };
}

export async function bevestig2faInstellen(
  taalWaarde: string,
  vorige: Formulierstaat,
  formData: FormData,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];
  const behoud = { qr: vorige.qr, geheim: vorige.geheim, factorId: vorige.factorId };

  const code = tekst(formData, "code").replace(/\s/g, "");
  const factorId = tekst(formData, "factorId");
  if (!/^\d{6}$/.test(code)) return { ...behoud, fout: t.fouten.codeVorm };

  const sessie = await huidigeSessie();
  if (!sessie) redirect(accountPad(taal, "inloggen"));

  const supabase = await maakServerClient();
  if (!supabase) return { ...behoud, fout: t.fouten.algemeen };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (error) return { ...behoud, fout: authFout(taal, error) };

  after(() => telDoel("2fa_gekoppeld"));
  const codes = await maakHerstelcodes(sessie.id);
  return codes ? { codes } : { codes: [], codesNietBeschikbaar: true };
}

// ---------------------------------------------------------------------------
// Nieuwe herstelcodes (vanuit Mijn account)
// ---------------------------------------------------------------------------

export async function vernieuwHerstelcodes(
  taalWaarde: string,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];
  const sessie = await huidigeSessie();
  if (!sessie || sessie.aal !== "aal2") return { fout: t.fouten.nietIngelogd };
  const codes = await maakHerstelcodes(sessie.id);
  return codes ? { codes } : { fout: t.fouten.geenSleutel };
}

// ---------------------------------------------------------------------------
// Inloggen met een herstelcode
// ---------------------------------------------------------------------------

export async function gebruikCode(
  taalWaarde: string,
  vorige: Formulierstaat,
  formData: FormData,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];
  const poging = (vorige.poging ?? 0) + 1;

  const sessie = await huidigeSessie();
  if (!sessie) redirect(accountPad(taal, "inloggen"));

  const code = tekst(formData, "herstelcode");
  if (code.replace(/[^A-Za-z0-9]/g, "").length !== 10) {
    return { fout: t.fouten.herstelcode, poging };
  }

  const uitkomst = await gebruikHerstelcode(sessie.id, code);
  if (uitkomst === "onjuist") return { fout: t.fouten.herstelcode, poging };
  if (uitkomst === "te-vaak") return { fout: t.fouten.teVaak, poging };
  if (uitkomst === "geen-sleutel") return { fout: t.fouten.geenSleutel, poging };

  const supabase = await maakServerClient();
  await supabase?.auth.signOut({ scope: "local" });
  redirect(`/${taal}/account/login?melding=2fa-hersteld`);
}

// ---------------------------------------------------------------------------
// Wachtwoord vergeten en nieuw wachtwoord (W-ACC-05)
// ---------------------------------------------------------------------------

export async function vraagNieuwWachtwoord(
  taalWaarde: string,
  vorige: Formulierstaat,
  formData: FormData,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];
  const poging = (vorige.poging ?? 0) + 1;

  const email = tekst(formData, "email").toLowerCase();
  if (!emailVorm.test(email)) return { fout: t.fouten.email, waarden: { email }, poging };

  const supabase = await maakServerClient();
  if (!supabase) return { fout: t.fouten.algemeen, poging };

  const adres = await siteAdres();
  const volgende = accountPad(taal, "nieuwWachtwoord");
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${adres}/auth/bevestigen?volgende=${encodeURIComponent(volgende)}`,
    captchaToken: tekst(formData, "cf-turnstile-response") || undefined,
  });
  // Bij een botcontrole- of limietfout melden we dat; verder altijd
  // hetzelfde antwoord, zodat niet te zien is of een adres bestaat.
  if (error && (error.code === "captcha_failed" || error.status === 429)) {
    return { fout: authFout(taal, error), waarden: { email }, poging };
  }
  return { melding: t.linkVerstuurd };
}

export async function zetNieuwWachtwoord(
  taalWaarde: string,
  vorige: Formulierstaat,
  formData: FormData,
): Promise<Formulierstaat> {
  const taal = controleerTaal(taalWaarde);
  const t = ledenTeksten[taal];

  const sessie = await huidigeSessie();
  if (!sessie || sessie.aal !== "aal2") return { fout: t.fouten.nietIngelogd };

  const wachtwoord = String(formData.get("wachtwoord") ?? "");
  const herhaling = String(formData.get("wachtwoord2") ?? "");
  if (wachtwoord.length < 10 || wachtwoord.length > 72) return { fout: t.fouten.wachtwoordKort };
  if (wachtwoord !== herhaling) return { fout: t.fouten.wachtwoordVerschil };

  const supabase = await maakServerClient();
  if (!supabase) return { fout: t.fouten.algemeen };
  const { error } = await supabase.auth.updateUser({ password: wachtwoord });
  if (error) return { fout: authFout(taal, error) };
  return { melding: t.wachtwoordGewijzigd };
}

// ---------------------------------------------------------------------------
// Uitloggen
// ---------------------------------------------------------------------------

export async function logUit(taalWaarde: string): Promise<void> {
  const taal = controleerTaal(taalWaarde);
  const supabase = await maakServerClient();
  await supabase?.auth.signOut();
  redirect(`/${taal}/account/login?melding=uitgelogd`);
}
