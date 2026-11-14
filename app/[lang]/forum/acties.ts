"use server";

import { after } from "next/server";
import { telDoel } from "@/lib/meting/server";
import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { draadPad, isPostTaal, onderwerpen } from "@/lib/forum";
import { accountPad, veiligPad } from "@/lib/paden";
import { huidigeSessie } from "@/lib/sessie";
import { isTaal, type Taal } from "@/lib/site";
import { maakServerClient } from "@/lib/supabase-server";
import { forumFout, ledenTeksten } from "@/lib/teksten-leden";

// Alle schrijfacties van het forum. De echte controle (2FA, blokkade,
// limieten, rol) gebeurt in de databasefuncties; hier wordt de invoer
// gecontroleerd en de uitkomst vertaald naar de pagina.

export type Forumstaat = {
  fout?: string;
  melding?: string;
  waarden?: Record<string, string>;
  poging?: number;
};

function tekst(formData: FormData, veld: string): string {
  const waarde = formData.get(veld);
  return typeof waarde === "string" ? waarde.trim() : "";
}

function controleerTaal(taal: string): Taal {
  if (!isTaal(taal)) throw new Error("Onbekende taal");
  return taal;
}

// Normaliseert regeleinden en haalt onzichtbare stuurtekens weg.
function schoon(invoer: string): string {
  return invoer
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f‪-‮⁦-⁩]/g, "");
}

async function vereisSessie(taal: Taal, terug: string) {
  const sessie = await huidigeSessie();
  if (!sessie || !sessie.heeft2fa || sessie.aal !== "aal2") {
    redirect(accountPad(taal, sessie ? "tweeFactor" : "inloggen", terug));
  }
  return sessie;
}

// ---------------------------------------------------------------------------

export async function nieuweDraad(
  taalWaarde: string,
  vorige: Forumstaat,
  formData: FormData,
): Promise<Forumstaat> {
  const taal = controleerTaal(taalWaarde);
  const poging = (vorige.poging ?? 0) + 1;
  await vereisSessie(taal, `/${taal}/forum/nieuw`);

  const onderwerp = tekst(formData, "onderwerp");
  const titel = schoon(tekst(formData, "titel")).replace(/\s+/g, " ");
  const bericht = schoon(String(formData.get("tekst") ?? "")).trim();
  const postTaal = tekst(formData, "taal");
  const waarden = { onderwerp, titel, tekst: bericht, taal: postTaal };
  const fout = (code: string) => ({ fout: forumFout(taal, code), waarden, poging });

  if (!onderwerpen.some((o) => o.id === onderwerp)) return fout("ONDERWERP");
  if (titel.length < 5 || titel.length > 150) return fout("TITEL");
  if (bericht.length < 2 || bericht.length > 20000) return fout("TEKST");
  if (!isPostTaal(postTaal)) return fout("TEKST");

  const supabase = await maakServerClient();
  if (!supabase) return fout("");
  const { data: id, error } = await supabase.rpc("forum_nieuwe_draad", {
    p_onderwerp: onderwerp,
    p_titel: titel,
    p_tekst: bericht,
    p_taal: postTaal,
  });
  if (error || typeof id !== "number") return fout(error?.message ?? "");

  updateTag("forum");
  after(() => telDoel("forum_vraag"));
  redirect(draadPad(taal, { id, onderwerp, titel }));
}

export async function reageer(
  taalWaarde: string,
  draadId: number,
  padWaarde: string,
  vorige: Forumstaat,
  formData: FormData,
): Promise<Forumstaat> {
  const taal = controleerTaal(taalWaarde);
  const pad = veiligPad(padWaarde, `/${taal}/forum`);
  const poging = (vorige.poging ?? 0) + 1;
  await vereisSessie(taal, pad);

  const bericht = schoon(String(formData.get("tekst") ?? "")).trim();
  const postTaal = tekst(formData, "taal");
  const waarden = { tekst: bericht, taal: postTaal };
  if (bericht.length < 2 || bericht.length > 20000 || !isPostTaal(postTaal)) {
    return { fout: forumFout(taal, "TEKST"), waarden, poging };
  }

  const supabase = await maakServerClient();
  if (!supabase) return { fout: forumFout(taal, ""), waarden, poging };
  const { data: id, error } = await supabase.rpc("forum_reageer", {
    p_draad: draadId,
    p_tekst: bericht,
    p_taal: postTaal,
  });
  if (error || typeof id !== "number") {
    return { fout: forumFout(taal, error?.message), waarden, poging };
  }

  updateTag("forum");
  refresh();
  after(() => telDoel("forum_reactie"));

  const { data: nieuw } = await supabase
    .from("forum_berichten")
    .select("status")
    .eq("id", id)
    .maybeSingle<{ status: string }>();
  return nieuw?.status === "wacht"
    ? { melding: ledenTeksten[taal].forum.wachtOpGoedkeuring, poging }
    : { poging };
}

// ---------------------------------------------------------------------------
// Eenvoudige acties via een knop. Bij een fout gaat de bezoeker terug naar
// de pagina met ?fout=..., zodat de melding daar getoond wordt.
// ---------------------------------------------------------------------------

async function voerUit(
  taal: Taal,
  pad: string,
  functie: string,
  argumenten: Record<string, unknown>,
): Promise<void> {
  await vereisSessie(taal, pad);
  const supabase = await maakServerClient();
  const { error } = supabase
    ? await supabase.rpc(functie, argumenten)
    : { error: { message: "" } };
  if (error) {
    const code =
      Object.keys(ledenTeksten[taal].forumFouten).find((c) => error.message.includes(c)) ??
      "ALGEMEEN";
    redirect(`${pad}?fout=${code}`);
  }
  updateTag("forum");
}

export async function meld(
  taalWaarde: string,
  berichtId: number,
  padWaarde: string,
  formData: FormData,
): Promise<void> {
  const taal = controleerTaal(taalWaarde);
  const pad = veiligPad(padWaarde, `/${taal}/forum`);
  const reden = schoon(tekst(formData, "reden"));
  if (reden.length < 3 || reden.length > 1000) redirect(`${pad}?fout=REDEN`);
  await voerUit(taal, pad, "forum_meld", { p_bericht: berichtId, p_reden: reden });
  after(() => telDoel("forum_melding"));
  redirect(`${pad}?gemeld=1#bericht-${berichtId}`);
}

export async function verwijderEigen(
  taalWaarde: string,
  berichtId: number,
  padWaarde: string,
): Promise<void> {
  const taal = controleerTaal(taalWaarde);
  const pad = veiligPad(padWaarde, `/${taal}/forum`);
  await voerUit(taal, pad, "forum_verwijder_eigen", { p_bericht: berichtId });
  refresh();
}

export async function modereer(
  taalWaarde: string,
  berichtId: number,
  actie: "tonen" | "verbergen" | "verwijderen",
  padWaarde: string,
): Promise<void> {
  const taal = controleerTaal(taalWaarde);
  const pad = veiligPad(padWaarde, `/${taal}/forum/moderatie`);
  await voerUit(taal, pad, "forum_modereer", {
    p_bericht: berichtId,
    p_actie: actie,
    p_reden: "",
  });
  refresh();
}

export async function meldingAfwijzen(
  taalWaarde: string,
  meldingId: number,
  padWaarde: string,
): Promise<void> {
  const taal = controleerTaal(taalWaarde);
  const pad = veiligPad(padWaarde, `/${taal}/forum/moderatie`);
  await voerUit(taal, pad, "forum_melding_afwijzen", { p_melding: meldingId });
  refresh();
}

export async function blokkeer(
  taalWaarde: string,
  gebruikerId: string,
  dagen: number | null,
  padWaarde: string,
): Promise<void> {
  const taal = controleerTaal(taalWaarde);
  const pad = veiligPad(padWaarde, `/${taal}/forum/moderatie`);
  await voerUit(taal, pad, "blokkeer_gebruiker", {
    p_gebruiker: gebruikerId,
    p_dagen: dagen,
    p_reden: "",
  });
  refresh();
}

export async function deblokkeer(
  taalWaarde: string,
  gebruikerId: string,
  padWaarde: string,
): Promise<void> {
  const taal = controleerTaal(taalWaarde);
  const pad = veiligPad(padWaarde, `/${taal}/forum/moderatie`);
  await voerUit(taal, pad, "deblokkeer_gebruiker", { p_gebruiker: gebruikerId });
  refresh();
}

export async function draadSluiten(
  taalWaarde: string,
  draadId: number,
  gesloten: boolean,
  padWaarde: string,
): Promise<void> {
  const taal = controleerTaal(taalWaarde);
  const pad = veiligPad(padWaarde, `/${taal}/forum`);
  await voerUit(taal, pad, "forum_draad_sluiten", {
    p_draad: draadId,
    p_gesloten: gesloten,
  });
  refresh();
}
