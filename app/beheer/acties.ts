"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { kiesbareCategorieen } from "@/lib/beheer/artikelen";
import { amsterdamNaarIso, maakSlug, youtubeId } from "@/lib/beheer/hulp";
import { maakSessieClient } from "@/lib/beheer/supabase-sessie";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { isTaal, talen } from "@/lib/site";

export type Staat = { fout?: string; melding?: string } | undefined;

function tekst(formData: FormData, naam: string): string {
  const waarde = formData.get(naam);
  return typeof waarde === "string" ? waarde.trim() : "";
}

// ---------------------------------------------------------------- Inloggen

export async function inloggen(_: Staat, formData: FormData): Promise<Staat> {
  const email = tekst(formData, "email");
  const wachtwoord = formData.get("wachtwoord");
  if (!email || typeof wachtwoord !== "string" || !wachtwoord) {
    return { fout: "Vul je e-mailadres en wachtwoord in." };
  }
  const supabase = await maakSessieClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: wachtwoord,
  });
  if (error) {
    if (error.status === 429) {
      return { fout: "Te veel pogingen. Wacht even en probeer het opnieuw." };
    }
    return { fout: "E-mailadres of wachtwoord klopt niet." };
  }
  redirect("/beheer/2fa");
}

export async function uitloggen() {
  const supabase = await maakSessieClient();
  await supabase.auth.signOut();
  redirect("/beheer/inloggen");
}

// ------------------------------------------------- Tweefactorauthenticatie

export type Koppeling =
  | { factorId: string; qr: string; geheim: string; fout?: undefined }
  | { fout: string };

// Start het koppelen van een authenticator-app: levert een QR-code op.
export async function start2fa(): Promise<Koppeling> {
  const supabase = await maakSessieClient();
  const { data: gebruikerData } = await supabase.auth.getUser();
  if (!gebruikerData.user) redirect("/beheer/inloggen");

  // Halfafgemaakte koppelingen van eerdere pogingen eerst opruimen.
  const { data: factoren } = await supabase.auth.mfa.listFactors();
  for (const f of factoren?.all ?? []) {
    if (f.factor_type === "totp" && f.status !== "verified") {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
  }
  if ((factoren?.totp ?? []).length > 0) redirect("/beheer/2fa");

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `Beheer ${new Date().toISOString().slice(0, 16)}`,
  });
  if (error || !data) {
    return { fout: `Koppelen lukt niet: ${error?.message ?? "onbekend"}` };
  }
  return { factorId: data.id, qr: data.totp.qr_code, geheim: data.totp.secret };
}

async function verifieer(factorId: string, code: string): Promise<Staat> {
  if (!/^\d{6}$/.test(code)) return { fout: "Vul de 6 cijfers uit de app in." };
  const supabase = await maakSessieClient();
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code,
  });
  if (error) {
    if (error.status === 429) {
      return { fout: "Te veel pogingen. Wacht even en probeer het opnieuw." };
    }
    return { fout: "Deze code klopt niet of is verlopen. Probeer de volgende." };
  }
  redirect("/beheer");
}

// Eerste keer: koppeling afronden met een code uit de app.
export async function bevestig2fa(
  _: Staat,
  formData: FormData,
): Promise<Staat> {
  return verifieer(tekst(formData, "factorId"), tekst(formData, "code"));
}

// Daarna: bij elke keer inloggen een code uit de app.
export async function controleer2fa(
  _: Staat,
  formData: FormData,
): Promise<Staat> {
  const supabase = await maakSessieClient();
  const { data } = await supabase.auth.mfa.listFactors();
  const factor = data?.totp?.[0];
  if (!factor) redirect("/beheer/2fa");
  return verifieer(factor.id, tekst(formData, "code"));
}

// ---------------------------------------------------------------- Artikelen

export async function artikelOpslaan(
  _: Staat,
  formData: FormData,
): Promise<Staat> {
  const { supabase, redacteur } = await vereisRedacteur();

  const id = tekst(formData, "id") || null;
  const categorie = tekst(formData, "categorie");
  const origineleTaal = tekst(formData, "originele_taal");
  const status =
    tekst(formData, "status") === "gepubliceerd" ? "gepubliceerd" : "concept";
  const videoUrl = tekst(formData, "video_url") || null;
  const afbeeldingUrl = tekst(formData, "afbeelding_url") || null;

  if (!kiesbareCategorieen.some((c) => c.id === categorie)) {
    return { fout: "Kies een categorie." };
  }
  if (!isTaal(origineleTaal) || !redacteur.talen.includes(origineleTaal)) {
    return { fout: "Je mag niet schrijven in de gekozen originele taal." };
  }
  if (!tekst(formData, `kop_${origineleTaal}`)) {
    return { fout: "Vul de kop in de originele taal in." };
  }
  if (videoUrl && !youtubeId(videoUrl)) {
    return { fout: "Het video-adres is geen geldig YouTube-adres." };
  }
  if (afbeeldingUrl && !/^https:\/\/\S+$/.test(afbeeldingUrl)) {
    return { fout: "Het adres van de afbeelding moet met https:// beginnen." };
  }

  let gepubliceerdOp = amsterdamNaarIso(tekst(formData, "gepubliceerd_op"));
  if (status === "gepubliceerd" && !gepubliceerdOp) {
    gepubliceerdOp = new Date().toISOString();
  }

  const nu = new Date().toISOString();
  const gegevens = {
    categorie_id: categorie,
    originele_taal: origineleTaal,
    auteur: tekst(formData, "auteur") || "Redactie",
    afbeelding_url: afbeeldingUrl,
    video_url: videoUrl,
    status,
    gepubliceerd_op: gepubliceerdOp,
    uitgelicht: formData.get("uitgelicht") === "aan",
    bijgewerkt: nu,
    bijgewerkt_door: redacteur.id,
  };

  let artikelId = id;
  if (artikelId) {
    const { error } = await supabase
      .from("artikelen")
      .update(gegevens)
      .eq("id", artikelId);
    if (error) return { fout: `Opslaan mislukt: ${error.message}` };
  } else {
    const { data, error } = await supabase
      .from("artikelen")
      .insert(gegevens)
      .select("id")
      .single();
    if (error || !data) {
      return { fout: `Opslaan mislukt: ${error?.message ?? "onbekend"}` };
    }
    artikelId = data.id as string;
  }

  // De tekst per taal. Alleen talen die in het formulier staan en waarin je
  // mag schrijven; ongewijzigde teksten blijven ongemoeid. Een vertaling die
  // je met de hand verandert, telt als handmatig verbeterd (W-TAAL-07) en
  // wordt niet zonder bevestiging overschreven (W-TAAL-15).
  const { data: bestaandData } = id
    ? await supabase
        .from("artikel_vertalingen")
        .select("taal, slug, kop, intro, tekst, automatisch_vertaald, handmatig_gecorrigeerd")
        .eq("artikel_id", artikelId)
    : { data: [] };
  const bestaand = (bestaandData ?? []) as {
    taal: string;
    slug: string;
    kop: string;
    intro: string;
    tekst: string;
    automatisch_vertaald: boolean;
    handmatig_gecorrigeerd: boolean;
  }[];

  for (const taal of talen) {
    if (!redacteur.talen.includes(taal)) continue;
    if (!formData.has(`kop_${taal}`)) continue;
    const isOrigineel = taal === origineleTaal;
    const oud = bestaand.find((v) => v.taal === taal);
    const kop = tekst(formData, `kop_${taal}`);
    if (!kop) {
      if (!isOrigineel && oud) {
        await supabase
          .from("artikel_vertalingen")
          .delete()
          .eq("artikel_id", artikelId)
          .eq("taal", taal);
      }
      continue;
    }
    const intro = tekst(formData, `intro_${taal}`);
    const tekstVeld = tekst(formData, `tekst_${taal}`);
    const slug = maakSlug(tekst(formData, `slug_${taal}`) || kop) || oud?.slug || "";
    if (!slug) return { fout: `Het webadres (${taal}) is leeg.` };
    if (oud && oud.kop === kop && oud.intro === intro && oud.tekst === tekstVeld && oud.slug === slug) {
      continue;
    }
    const { error } = await supabase.from("artikel_vertalingen").upsert({
      artikel_id: artikelId,
      taal,
      slug,
      kop,
      intro,
      tekst: tekstVeld,
      automatisch_vertaald: isOrigineel ? false : (oud?.automatisch_vertaald ?? false),
      handmatig_gecorrigeerd: !isOrigineel,
      bijgewerkt: nu,
      bijgewerkt_door: redacteur.id,
    });
    if (error) {
      // Een nieuw artikel zonder tekst niet laten staan: anders ontstaat
      // bij een tweede poging een dubbel artikel.
      if (!id) await supabase.from("artikelen").delete().eq("id", artikelId);
      updateTag("artikelen");
      if (error.code === "23505") {
        return {
          fout: `Het webadres "${slug}" (${taal}) bestaat al bij een ander artikel. Kies een ander webadres.`,
        };
      }
      return { fout: `Opslaan van de tekst (${taal}) mislukt: ${error.message}` };
    }
  }

  // Nieuw artikel: standaard naar alle andere talen vertalen, behalve de
  // talen die met een schakelaar zijn uitgezet (W-TAAL-11, -12). Bij
  // bewerken niet automatisch (W-TAAL-14).
  let vertaald = 0;
  if (!id) {
    const gekozen = formData.getAll("vertaal").filter(isTaal);
    if (gekozen.length > 0) {
      const { data, error } = await supabase.rpc("vertaal_artikel", {
        p_artikel: artikelId,
        p_talen: gekozen,
        p_overschrijven: false,
      });
      if (error) console.error("Vertaling aanvragen mislukt:", error.message);
      vertaald = typeof data === "number" ? data : 0;
    }
  }

  updateTag("artikelen");
  redirect(`/beheer/artikelen/${artikelId}?opgeslagen=1${vertaald ? `&vertaald=${vertaald}` : ""}`);
}

export async function artikelVerwijderen(formData: FormData) {
  const { supabase, redacteur } = await vereisRedacteur();
  const id = tekst(formData, "id");
  if (redacteur.rol !== "beheerder" || !id) redirect("/beheer");
  await supabase.from("artikelen").delete().eq("id", id);
  updateTag("artikelen");
  redirect("/beheer?verwijderd=1");
}

// "Vertalen naar andere talen" bij een bestaand artikel (W-TAAL-14, -15).
export async function artikelVertalen(_: Staat, formData: FormData): Promise<Staat> {
  const { supabase } = await vereisRedacteur();
  const id = tekst(formData, "id");
  const gekozen = formData.getAll("vertaal").filter(isTaal);
  if (!id || gekozen.length === 0) return { fout: "Kies minstens één taal." };
  const { data, error } = await supabase.rpc("vertaal_artikel", {
    p_artikel: id,
    p_talen: gekozen,
    p_overschrijven: formData.get("overschrijven") === "aan",
  });
  if (error) {
    if (/vertaal_artikel|schema cache|does not exist/i.test(error.message)) {
      return { fout: "Vertalen is nog niet klaar: voer eerst supabase/006_vertalen.sql uit." };
    }
    return { fout: `Vertalen aanvragen mislukt: ${error.message}` };
  }
  const n = typeof data === "number" ? data : 0;
  redirect(`/beheer/artikelen/${id}?vertaald=${n}`);
}
