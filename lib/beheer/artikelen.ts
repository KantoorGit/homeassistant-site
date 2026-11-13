import "server-only";
import { categorieen, type Taal } from "@/lib/site";
import type { maakSessieClient } from "./supabase-sessie";

type SessieClient = Awaited<ReturnType<typeof maakSessieClient>>;

// Categorieën waaronder je een artikel kunt plaatsen. "Voorpagina" en
// "Laatste nieuws" vullen zich vanzelf; het forum krijgt eigen berichten.
export const kiesbareCategorieen = categorieen.filter(
  (c) => !["voorpagina", "laatste-nieuws", "forum"].includes(c.id),
);

export type BeheerVertaling = {
  taal: Taal;
  slug: string;
  kop: string;
  intro: string;
  tekst: string;
  automatisch_vertaald: boolean;
  handmatig_gecorrigeerd: boolean;
};

export type BeheerArtikel = {
  id: string;
  categorie_id: string;
  originele_taal: Taal;
  auteur: string;
  afbeelding_url: string | null;
  video_url: string | null;
  status: "concept" | "gepubliceerd";
  gepubliceerd_op: string | null;
  uitgelicht: boolean;
  is_voorbeeld: boolean;
  bijgewerkt: string;
  artikel_vertalingen: BeheerVertaling[];
};

const kolommen =
  "id, categorie_id, originele_taal, auteur, afbeelding_url, video_url, status, " +
  "gepubliceerd_op, uitgelicht, is_voorbeeld, bijgewerkt, " +
  "artikel_vertalingen(taal, slug, kop, intro, tekst, automatisch_vertaald, handmatig_gecorrigeerd)";

export async function alleArtikelen(supabase: SessieClient) {
  const { data, error } = await supabase
    .from("artikelen")
    .select(kolommen)
    .order("bijgewerkt", { ascending: false })
    .limit(500)
    .overrideTypes<BeheerArtikel[], { merge: false }>();
  return { artikelen: data ?? [], fout: error?.message ?? null };
}

export async function eenArtikel(supabase: SessieClient, id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data } = await supabase
    .from("artikelen")
    .select(kolommen)
    .eq("id", id)
    .maybeSingle()
    .overrideTypes<BeheerArtikel, { merge: false }>();
  return data ?? null;
}

export function kopVan(artikel: BeheerArtikel): string {
  const v =
    artikel.artikel_vertalingen.find((v) => v.taal === artikel.originele_taal) ??
    artikel.artikel_vertalingen[0];
  return v?.kop || "(zonder kop)";
}
