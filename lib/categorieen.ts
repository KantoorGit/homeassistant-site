import { cacheLife, cacheTag } from "next/cache";
import { isTaal, standaardCategorieen, talen, type Categorie, type CategorieSoort, type Taal } from "./site";
import { maakSupabaseClient } from "./supabase";

type Rij = {
  id: string;
  soort: string;
  naam: Record<string, string>;
  slug: Record<string, string>;
  vorige_slugs: Record<string, string[]> | null;
  volgorde: number;
  verwijderd_op: string | null;
};

const soorten: CategorieSoort[] = ["voorpagina", "laatste-nieuws", "gewoon", "overig", "forum"];

function naarCategorie(rij: Rij): Categorie {
  const perTaal = (bron: Record<string, string> | null, terug: string) =>
    Object.fromEntries(talen.map((t) => [t, bron?.[t] ?? terug])) as Record<Taal, string>;
  const vorigeSlugs: Partial<Record<Taal, string[]>> = {};
  for (const [taal, lijst] of Object.entries(rij.vorige_slugs ?? {})) {
    if (isTaal(taal) && Array.isArray(lijst)) vorigeSlugs[taal] = lijst.map(String);
  }
  const soort = soorten.includes(rij.soort as CategorieSoort) ? (rij.soort as CategorieSoort) : "gewoon";
  return {
    id: rij.id,
    soort,
    naam: perTaal(rij.naam, rij.naam?.nl ?? rij.id),
    slug: perTaal(rij.slug, rij.slug?.nl ?? rij.id),
    vorigeSlugs,
    volgorde: rij.volgorde,
    verwijderd: rij.verwijderd_op !== null,
  };
}

// Vaste volgorde: Voorpagina eerst, Overig en Forum altijd als laatste twee.
function sorteer(lijst: Categorie[]): Categorie[] {
  const gewicht = (c: Categorie) =>
    c.soort === "voorpagina" ? -1 : c.soort === "overig" ? 1e6 : c.soort === "forum" ? 1e6 + 1 : c.volgorde;
  return [...lijst].sort((a, b) => gewicht(a) - gewicht(b) || a.id.localeCompare(b.id));
}

// Alle categorieën, ook de verwijderde (nodig om artikelen onder "Overig" te
// zetten). Uit de tabel categorieen (supabase/007_…sql); zolang die er niet
// is, de vaste lijst uit lib/site.ts. Kort bewaard; het beheerpaneel ververst
// de bewaarde uitkomst direct na een wijziging (tag "categorieen").
export async function haalAlleCategorieen(): Promise<Categorie[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("categorieen");

  const supabase = maakSupabaseClient();
  if (!supabase) return standaardCategorieen;
  const { data, error } = await supabase
    .from("categorieen")
    .select("id, soort, naam, slug, vorige_slugs, volgorde, verwijderd_op")
    .overrideTypes<Rij[], { merge: false }>();
  if (error || !data || data.length === 0) return standaardCategorieen;
  const lijst = data.map(naarCategorie);
  // De vaste onderdelen moeten er altijd zijn.
  for (const vast of standaardCategorieen.filter((c) => c.soort !== "gewoon")) {
    if (!lijst.some((c) => c.soort === vast.soort)) lijst.push(vast);
  }
  return sorteer(lijst);
}

// De categorieën in de categoriebalk: zonder de verwijderde.
export async function haalCategorieen(): Promise<Categorie[]> {
  return (await haalAlleCategorieen()).filter((c) => !c.verwijderd);
}

// Categorieën waaronder je een artikel kunt plaatsen. "Voorpagina" en
// "Laatste nieuws" vullen zich vanzelf; het forum heeft eigen berichten.
export function plaatsbaar(lijst: Categorie[]): Categorie[] {
  return lijst.filter((c) => c.soort === "gewoon" || c.soort === "overig");
}
