// Centrale instellingen van de site.
// De naam is een werknaam: pas hem hier aan en hij verandert overal.

export const siteNaam = "Slimhuis Gids";

// Zolang de site in opbouw is, blijven zoekmachines buiten. Zet dit op
// true bij livegang; elke pagina krijgt nu de aanwijzing "noindex".
export const zoekmachinesToelaten = false;

export const talen = ["nl", "en"] as const;
export type Taal = (typeof talen)[number];
export const standaardTaal: Taal = "nl";

export const taalNamen: Record<Taal, string> = {
  nl: "Nederlands",
  en: "English",
};

export function isTaal(waarde: string): waarde is Taal {
  return (talen as readonly string[]).includes(waarde);
}

// De categoriebalk (requirement W-LAY-02). "voorpagina" heeft geen eigen
// slug: die verwijst naar de openingspagina van de taal.
export type Categorie = {
  id: string;
  slug: Record<Taal, string>;
  naam: Record<Taal, string>;
};

export const categorieen: Categorie[] = [
  {
    id: "voorpagina",
    slug: { nl: "", en: "" },
    naam: { nl: "Voorpagina", en: "Home" },
  },
  {
    id: "laatste-nieuws",
    slug: { nl: "laatste-nieuws", en: "latest-news" },
    naam: { nl: "Laatste nieuws", en: "Latest news" },
  },
  {
    id: "videos",
    slug: { nl: "videos", en: "videos" },
    naam: { nl: "Video's", en: "Videos" },
  },
  {
    id: "aan-de-slag",
    slug: { nl: "aan-de-slag", en: "getting-started" },
    naam: { nl: "Aan de slag", en: "Getting started" },
  },
  {
    id: "training",
    slug: { nl: "training", en: "training" },
    naam: { nl: "Training", en: "Training" },
  },
  {
    id: "automatiseringen",
    slug: { nl: "automatiseringen", en: "automations" },
    naam: { nl: "Automatiseringen", en: "Automations" },
  },
  {
    id: "dashboards",
    slug: { nl: "dashboards", en: "dashboards" },
    naam: { nl: "Dashboards", en: "Dashboards" },
  },
  {
    id: "integraties",
    slug: { nl: "integraties", en: "integrations" },
    naam: { nl: "Integraties", en: "Integrations" },
  },
  {
    id: "claude-en-ai",
    slug: { nl: "claude-en-ai", en: "claude-and-ai" },
    naam: { nl: "Claude & AI", en: "Claude & AI" },
  },
  {
    id: "hardware",
    slug: { nl: "hardware", en: "hardware" },
    naam: { nl: "Hardware", en: "Hardware" },
  },
  {
    id: "forum",
    slug: { nl: "forum", en: "forum" },
    naam: { nl: "Forum", en: "Forum" },
  },
];

export function categoriePad(categorie: Categorie, taal: Taal): string {
  const slug = categorie.slug[taal];
  return slug ? `/${taal}/${slug}` : `/${taal}`;
}

export function vindCategorie(taal: Taal, slug: string): Categorie | undefined {
  return categorieen.find((c) => c.slug[taal] !== "" && c.slug[taal] === slug);
}

// Vaste teksten van de interface per taal.
export const teksten: Record<
  Taal,
  {
    ondertitel: string;
    laatsteNieuws: string;
    meerIn: string;
    voorbeeld: string;
    nogLeeg: string;
    onafhankelijk: string;
    taalKiezen: string;
    categorieen: string;
    door: string;
    vertaaldUit: string;
    origineelBekijken: string;
    taalInZin: Record<Taal, string>;
  }
> = {
  nl: {
    ondertitel: "Alles over Home Assistant, in gewone taal",
    laatsteNieuws: "Laatste nieuws",
    meerIn: "Meer in",
    voorbeeld: "Voorbeeldartikel",
    nogLeeg: "In deze categorie staan nog geen artikelen.",
    onafhankelijk:
      "Deze site is onafhankelijk en niet verbonden aan Home Assistant of Nabu Casa.",
    taalKiezen: "Taal kiezen",
    categorieen: "Categorieën",
    door: "Door",
    vertaaldUit: "Automatisch vertaald uit",
    origineelBekijken: "Origineel bekijken",
    taalInZin: { nl: "het Nederlands", en: "het Engels" },
  },
  en: {
    ondertitel: "Everything about Home Assistant, in plain language",
    laatsteNieuws: "Latest news",
    meerIn: "More in",
    voorbeeld: "Sample article",
    nogLeeg: "There are no articles in this category yet.",
    onafhankelijk:
      "This site is independent and not affiliated with Home Assistant or Nabu Casa.",
    taalKiezen: "Choose language",
    categorieen: "Categories",
    door: "By",
    vertaaldUit: "Automatically translated from",
    origineelBekijken: "View original",
    taalInZin: { nl: "Dutch", en: "English" },
  },
};
