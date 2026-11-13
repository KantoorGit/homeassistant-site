import { cacheLife, cacheTag } from "next/cache";
import voorbeelden from "./voorbeeldartikelen.json";
import { categorieen, isTaal, type Taal } from "./site";
import { maakSupabaseClient } from "./supabase";

// Een artikel zoals de pagina's het gebruiken: in één taal.
export type Artikel = {
  id: string;
  categorieId: string;
  gepubliceerdOp: string;
  origineleTaal: Taal;
  auteur: string;
  afbeeldingUrl: string | null;
  isVoorbeeld: boolean;
  taal: Taal;
  slug: string;
  kop: string;
  intro: string;
  tekst: string;
  automatischVertaald: boolean;
  // Adressen van hetzelfde artikel in de andere talen.
  slugPerTaal: Partial<Record<Taal, string>>;
};

type VertalingRij = {
  taal: string;
  slug: string;
  kop: string;
  intro: string;
  tekst: string;
  automatisch_vertaald: boolean;
};

type ArtikelRij = {
  id: string;
  categorie_id: string;
  originele_taal: string;
  auteur: string;
  afbeelding_url: string | null;
  gepubliceerd_op: string;
  is_voorbeeld: boolean;
  artikel_vertalingen: VertalingRij[];
};

const kolommen =
  "id, categorie_id, originele_taal, auteur, afbeelding_url, gepubliceerd_op, is_voorbeeld, " +
  "artikel_vertalingen(taal, slug, kop, intro, tekst, automatisch_vertaald)";

function naarArtikel(rij: ArtikelRij, taal: Taal): Artikel | null {
  const vertaling = rij.artikel_vertalingen.find((v) => v.taal === taal);
  if (!vertaling) return null;
  const slugPerTaal: Partial<Record<Taal, string>> = {};
  for (const v of rij.artikel_vertalingen) {
    if (isTaal(v.taal)) slugPerTaal[v.taal] = v.slug;
  }
  return {
    id: rij.id,
    categorieId: rij.categorie_id,
    gepubliceerdOp: rij.gepubliceerd_op,
    origineleTaal: isTaal(rij.originele_taal) ? rij.originele_taal : taal,
    auteur: rij.auteur,
    afbeeldingUrl: rij.afbeelding_url,
    isVoorbeeld: rij.is_voorbeeld,
    taal,
    slug: vertaling.slug,
    kop: vertaling.kop,
    intro: vertaling.intro,
    tekst: vertaling.tekst,
    automatischVertaald: vertaling.automatisch_vertaald,
    slugPerTaal,
  };
}

// De voorbeeldartikelen uit de code, in dezelfde vorm als de database-rijen.
// Ze worden getoond zolang de tabellen nog niet bestaan of leeg zijn.
function voorbeeldRijen(): ArtikelRij[] {
  return voorbeelden.map((v) => ({
    id: v.id,
    categorie_id: v.categorieId,
    originele_taal: v.origineleTaal,
    auteur: v.auteur,
    afbeelding_url: null,
    gepubliceerd_op: v.gepubliceerdOp,
    is_voorbeeld: true,
    artikel_vertalingen: Object.entries(v.vertalingen).map(([taal, t]) => ({
      taal,
      slug: t.slug,
      kop: t.kop,
      intro: t.intro,
      tekst: t.tekst,
      automatisch_vertaald: t.automatischVertaald,
    })),
  }));
}

// Haalt de gepubliceerde artikelen op, nieuwste eerst. De uitkomst wordt
// kort bewaard, zodat niet elk bezoek een databasevraag kost; een nieuw
// artikel staat binnen enkele minuten op de site.
async function haalRijen(): Promise<ArtikelRij[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("artikelen");

  const supabase = maakSupabaseClient();
  if (!supabase) return voorbeeldRijen();

  const { data, error } = await supabase
    .from("artikelen")
    .select(kolommen)
    .order("gepubliceerd_op", { ascending: false })
    .limit(200)
    .overrideTypes<ArtikelRij[], { merge: false }>();

  if (error) {
    console.error("Artikelen ophalen mislukt:", error.code, error.message);
    return voorbeeldRijen();
  }
  if (!data || data.length === 0) return voorbeeldRijen();
  return data;
}

export async function getArtikelen(taal: Taal): Promise<Artikel[]> {
  const rijen = await haalRijen();
  return rijen
    .map((rij) => naarArtikel(rij, taal))
    .filter((a): a is Artikel => a !== null);
}

// Zoekt een artikel op het laatste deel van het adres. De slug mag ook uit
// een andere taal komen: dan levert dit het artikel in de gevraagde taal,
// en stuurt de pagina door naar het juiste adres.
export async function getArtikel(
  taal: Taal,
  slug: string,
): Promise<Artikel | null> {
  const rijen = await haalRijen();
  const rij =
    rijen.find((r) =>
      r.artikel_vertalingen.some((v) => v.taal === taal && v.slug === slug),
    ) ?? rijen.find((r) => r.artikel_vertalingen.some((v) => v.slug === slug));
  return rij ? naarArtikel(rij, taal) : null;
}

export function artikelPad(
  artikel: Pick<Artikel, "categorieId" | "slugPerTaal">,
  taal: Taal,
): string | null {
  const slug = artikel.slugPerTaal[taal];
  const categorie = categorieen.find((c) => c.id === artikel.categorieId);
  if (!slug || !categorie || !categorie.slug[taal]) return null;
  return `/${taal}/${categorie.slug[taal]}/${slug}`;
}

const tijdzone = "Europe/Amsterdam";

export function tijdVan(artikel: Artikel): string {
  return new Intl.DateTimeFormat(artikel.taal, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: tijdzone,
  }).format(new Date(artikel.gepubliceerdOp));
}

export function datumVan(artikel: Artikel): string {
  return new Intl.DateTimeFormat(artikel.taal, {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: tijdzone,
  }).format(new Date(artikel.gepubliceerdOp));
}

// Voor de verbindingstest: vraagt de artikelen rechtstreeks op, zonder de
// bewaarde uitkomst en zonder terug te vallen op de voorbeelden.
export async function controleerArtikelen(): Promise<
  { aantal: number; fout: null } | { aantal: 0; fout: string; code: string }
> {
  const supabase = maakSupabaseClient();
  if (!supabase) return { aantal: 0, fout: "Geen verbinding", code: "" };
  const { data, error } = await supabase
    .from("artikelen")
    .select(kolommen)
    .order("gepubliceerd_op", { ascending: false })
    .limit(200)
    .overrideTypes<ArtikelRij[], { merge: false }>();
  if (error) return { aantal: 0, fout: error.message, code: error.code ?? "" };
  return { aantal: data?.length ?? 0, fout: null };
}
