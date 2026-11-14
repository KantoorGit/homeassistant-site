import { cacheLife, cacheTag } from "next/cache";
import voorbeelden from "./voorbeeldartikelen.json";
import { haalAlleCategorieen } from "./categorieen";
import { categorieVanArtikel, isTaal, type Categorie, type Taal } from "./site";
import { maakSupabaseClient } from "./supabase";

// Een artikel zoals de pagina's het gebruiken: in één taal.
export type Artikel = {
  id: string;
  // De categorie die bij het artikel is opgeslagen. Ook na het verwijderen
  // van die categorie blijft dit staan (W-ADM-14).
  categorieId: string;
  // De categorie waaronder het artikel op de site staat: de eigen
  // categorie, of "Overig" als die verwijderd is.
  categorie: Categorie;
  gepubliceerdOp: string;
  origineleTaal: Taal;
  auteur: string;
  afbeeldingUrl: string | null;
  videoUrl: string | null;
  // Staat groot bovenaan de voorpagina (oud; vervangen door positie 1).
  uitgelicht: boolean;
  // Vaste plek op de voorpagina: 1 = groot bovenaan, 2-7 = raster (W-ADM-17).
  positie: number | null;
  isVoorbeeld: boolean;
  taal: Taal;
  slug: string;
  kop: string;
  intro: string;
  tekst: string;
  automatischVertaald: boolean;
  // Er is (nog) geen vertaling in de gevraagde taal: de bezoeker ziet het
  // origineel, met de melding in welke taal het geschreven is (W-FOR-03).
  nietVertaald: boolean;
  // Taal van de tekst die getoond wordt (bij nietVertaald het origineel).
  tekstTaal: Taal;
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
  // Komen uit supabase/003_beheer.sql; ontbreken zolang dat niet is uitgevoerd.
  video_url?: string | null;
  uitgelicht?: boolean;
  // Uit supabase/007_…sql.
  positie?: number | null;
  gepubliceerd_op: string;
  is_voorbeeld: boolean;
  artikel_vertalingen: VertalingRij[];
};

// "*" in plaats van losse kolommen, zodat nieuwe kolommen (zoals
// 'uitgelicht') de site niet breken als de SQL nog niet is uitgevoerd.
const kolommen =
  "*, artikel_vertalingen(taal, slug, kop, intro, tekst, automatisch_vertaald)";

function naarArtikel(rij: ArtikelRij, taal: Taal, categorieen: Categorie[]): Artikel | null {
  const origineleTaal = isTaal(rij.originele_taal) ? rij.originele_taal : taal;
  const eigen = rij.artikel_vertalingen.find((v) => v.taal === taal);
  const vertaling =
    eigen ?? rij.artikel_vertalingen.find((v) => v.taal === origineleTaal);
  if (!vertaling) return null;
  const slugPerTaal: Partial<Record<Taal, string>> = {};
  for (const v of rij.artikel_vertalingen) {
    if (isTaal(v.taal)) slugPerTaal[v.taal] = v.slug;
  }
  return {
    id: rij.id,
    categorieId: rij.categorie_id,
    categorie: categorieVanArtikel(categorieen, rij.categorie_id),
    gepubliceerdOp: rij.gepubliceerd_op,
    origineleTaal,
    auteur: rij.auteur,
    afbeeldingUrl: rij.afbeelding_url,
    videoUrl: rij.video_url ?? null,
    uitgelicht: rij.uitgelicht ?? false,
    positie: rij.positie !== undefined ? rij.positie : rij.uitgelicht ? 1 : null,
    isVoorbeeld: rij.is_voorbeeld,
    taal,
    slug: vertaling.slug,
    kop: vertaling.kop,
    intro: vertaling.intro,
    tekst: vertaling.tekst,
    automatischVertaald: vertaling.automatisch_vertaald,
    nietVertaald: !eigen,
    tekstTaal: eigen ? taal : origineleTaal,
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
  const [rijen, categorieen] = await Promise.all([haalRijen(), haalAlleCategorieen()]);
  return rijen
    .map((rij) => naarArtikel(rij, taal, categorieen))
    .filter((a): a is Artikel => a !== null);
}

// Zoekt een artikel op het laatste deel van het adres. De slug mag ook uit
// een andere taal komen: dan levert dit het artikel in de gevraagde taal,
// en stuurt de pagina door naar het juiste adres.
export async function getArtikel(
  taal: Taal,
  slug: string,
): Promise<Artikel | null> {
  const [rijen, categorieen] = await Promise.all([haalRijen(), haalAlleCategorieen()]);
  const rij =
    rijen.find((r) =>
      r.artikel_vertalingen.some((v) => v.taal === taal && v.slug === slug),
    ) ?? rijen.find((r) => r.artikel_vertalingen.some((v) => v.slug === slug));
  return rij ? naarArtikel(rij, taal, categorieen) : null;
}

// Adres van een artikel in een taal. Is het artikel in die taal nog niet
// vertaald, dan krijgt het adres het webadres van het origineel.
export function artikelPad(
  artikel: Pick<Artikel, "categorie" | "slugPerTaal" | "origineleTaal">,
  taal: Taal,
): string | null {
  const slug =
    artikel.slugPerTaal[taal] ?? artikel.slugPerTaal[artikel.origineleTaal];
  const categorie = artikel.categorie;
  if (!slug || !categorie.slug[taal]) return null;
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

// Verdeelt de artikelen over de voorpagina (W-ADM-17): plek 1 is het grote
// hoofdartikel, plek 2 t/m 7 de zes kaarten eronder (twee rijen van drie).
// Een artikel met een vaste plek staat daar; lege plekken worden gevuld met
// de nieuwste overige artikelen. Daarna volgen nog 'extra' kaarten.
export function verdeelVoorpagina(
  artikelen: Artikel[],
  extra = 3,
): { hoofdartikel: Artikel | undefined; raster: Artikel[] } {
  const plekken: (Artikel | undefined)[] = Array(8).fill(undefined);
  const geplaatst = new Set<string>();
  for (const a of artikelen) {
    if (a.positie && a.positie >= 1 && a.positie <= 7 && !plekken[a.positie]) {
      plekken[a.positie] = a;
      geplaatst.add(a.id);
    }
  }
  const rest = artikelen.filter((a) => !geplaatst.has(a.id));
  for (let p = 1; p <= 7; p++) {
    if (!plekken[p]) plekken[p] = rest.shift();
  }
  const raster = [...plekken.slice(2), ...rest.slice(0, extra)].filter(
    (a): a is Artikel => a !== undefined,
  );
  return { hoofdartikel: plekken[1], raster };
}
