import "server-only";
import { plaatsbaar } from "@/lib/categorieen";
import type { Categorie, Taal } from "@/lib/site";
import type { maakSessieClient } from "./supabase-sessie";

type SessieClient = Awaited<ReturnType<typeof maakSessieClient>>;

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
  // Uit supabase/007_…sql; ontbreekt zolang dat niet is uitgevoerd.
  positie?: number | null;
  // Uit supabase/008_…sql (bijsnijden); ontbreken zolang dat niet is uitgevoerd.
  afbeelding_origineel_url?: string | null;
  afbeelding_bron_url?: string | null;
  afbeelding_uitsnede?: unknown;
  is_voorbeeld: boolean;
  bijgewerkt: string;
  artikel_vertalingen: BeheerVertaling[];
};

// "*" zodat nieuwe kolommen (zoals 'positie') niets breken zolang de SQL
// nog niet is uitgevoerd.
const kolommen =
  "*, artikel_vertalingen(taal, slug, kop, intro, tekst, automatisch_vertaald, handmatig_gecorrigeerd)";

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
    .maybeSingle<BeheerArtikel>();
  return data ?? null;
}

// Kop van een artikel, bij voorkeur in de taal van het beheerpaneel.
export function kopVan(artikel: BeheerArtikel, taal?: Taal, zonderKop = "(zonder kop)"): string {
  const v =
    (taal && artikel.artikel_vertalingen.find((v) => v.taal === taal)) ||
    artikel.artikel_vertalingen.find((v) => v.taal === artikel.originele_taal) ||
    artikel.artikel_vertalingen[0];
  return v?.kop || zonderKop;
}

// Plek op de voorpagina (1-7) of null; oude artikelen: 'uitgelicht' = 1.
export function positieVan(artikel: BeheerArtikel): number | null {
  if (artikel.positie !== undefined) return artikel.positie;
  return artikel.uitgelicht ? 1 : null;
}

// Welk artikel staat nu op welke plek (voor de plekkiezer).
export function bezettePlekken(
  artikelen: BeheerArtikel[],
  taal: Taal,
  zonderKop: string,
): Record<number, { id: string; kop: string }> {
  const plekken: Record<number, { id: string; kop: string }> = {};
  for (const a of artikelen) {
    const p = positieVan(a);
    if (p && !plekken[p]) plekken[p] = { id: a.id, kop: kopVan(a, taal, zonderKop) };
  }
  return plekken;
}

// Keuzes voor het categorieveld: de plaatsbare categorieën, plus de
// verwijderde categorie van dit artikel zelf (die blijft bewaard, W-ADM-14).
export function categorieKeuzes(
  alle: Categorie[],
  taal: Taal,
  huidig?: string,
): { id: string; naam: string; verwijderd?: boolean }[] {
  const keuzes: { id: string; naam: string; verwijderd?: boolean }[] = plaatsbaar(alle)
    .filter((c) => !c.verwijderd)
    .map((c) => ({ id: c.id, naam: c.naam[taal] }));
  const eigen = alle.find((c) => c.id === huidig);
  if (eigen?.verwijderd) keuzes.unshift({ id: eigen.id, naam: eigen.naam[taal], verwijderd: true });
  return keuzes;
}

export type Uitsnede = {
  x: number;
  y: number;
  breedte: number;
  hoogte: number;
  verhouding: "16:9" | "vrij";
};

// Het bewaarde kader van een bijgesneden afbeelding (W-ADM-22), in procenten
// van het origineel; null als het ontbreekt of niet klopt.
export function leesUitsnede(waarde: unknown): Uitsnede | null {
  let w = waarde;
  if (typeof w === "string") {
    try {
      w = JSON.parse(w);
    } catch {
      return null;
    }
  }
  if (!w || typeof w !== "object") return null;
  const o = w as Record<string, unknown>;
  const getal = (n: unknown) => (typeof n === "number" && Number.isFinite(n) && n >= 0 && n <= 100 ? n : null);
  const x = getal(o.x);
  const y = getal(o.y);
  const breedte = getal(o.breedte);
  const hoogte = getal(o.hoogte);
  if (x === null || y === null || !breedte || !hoogte) return null;
  if (x + breedte > 100.01 || y + hoogte > 100.01) return null;
  return { x, y, breedte, hoogte, verhouding: o.verhouding === "vrij" ? "vrij" : "16:9" };
}
