// Centrale instellingen van de site.
// De naam is een werknaam: pas hem hier aan en hij verandert overal.

export const siteNaam = "Slimhuis Gids";

// Vast adres van de live site (voor hreflang en canonieke adressen).
export const siteAdres = "https://www.winstonyip.com";

// Zolang de site in opbouw is, blijven zoekmachines buiten. Zet dit op
// true bij livegang; elke pagina krijgt nu de aanwijzing "noindex".
export const zoekmachinesToelaten = false;

export const talen = ["nl", "en", "zh", "fr", "de", "es"] as const;
export type Taal = (typeof talen)[number];
export const standaardTaal: Taal = "nl";

// Naam van elke taal in die taal zelf (voor de taalkiezer).
export const taalNamen: Record<Taal, string> = {
  nl: "Nederlands",
  en: "English",
  zh: "中文",
  fr: "Français",
  de: "Deutsch",
  es: "Español",
};

// Korte naam in de taalkiezer.
export const taalKort: Record<Taal, string> = {
  nl: "NL",
  en: "EN",
  zh: "中文",
  fr: "FR",
  de: "DE",
  es: "ES",
};

// Taalcode voor zoekmachines en de browser (hreflang, lang-attribuut).
export const taalCode: Record<Taal, string> = {
  nl: "nl",
  en: "en",
  zh: "zh-Hans",
  fr: "fr",
  de: "de",
  es: "es",
};

export function isTaal(waarde: unknown): waarde is Taal {
  return (talen as readonly unknown[]).includes(waarde);
}

// Cookie waarin de gekozen taal wordt onthouden (W-TAAL-05). Dit is een
// functionele cookie: hij onthoudt alleen een voorkeur van de bezoeker.
export const taalCookie = "taal";

// De categoriebalk (requirement W-LAY-02). De categorieën staan sinds
// versie 3 in de database (tabel categorieen, supabase/007_…sql) en worden
// in het beheerpaneel gewijzigd (W-ADM-07). Deze lijst is de terugval
// zolang die tabel er niet is. "voorpagina" heeft geen eigen slug: die
// verwijst naar de openingspagina van de taal.
export type CategorieSoort = "voorpagina" | "laatste-nieuws" | "gewoon" | "overig" | "forum";

export type Categorie = {
  id: string;
  soort: CategorieSoort;
  slug: Record<Taal, string>;
  naam: Record<Taal, string>;
  // Eerdere webadressen; die sturen door naar het huidige adres.
  vorigeSlugs: Partial<Record<Taal, string[]>>;
  volgorde: number;
  verwijderd: boolean;
};

type Basis = Pick<Categorie, "id" | "slug" | "naam"> & { soort?: CategorieSoort };

const basis: Basis[] = [
  {
    id: "voorpagina",
    soort: "voorpagina",
    slug: { nl: "", en: "", zh: "", fr: "", de: "", es: "" },
    naam: { nl: "Voorpagina", en: "Home", zh: "首页", fr: "Accueil", de: "Startseite", es: "Inicio" },
  },
  {
    id: "laatste-nieuws",
    soort: "laatste-nieuws",
    slug: { nl: "laatste-nieuws", en: "latest-news", zh: "zuixin", fr: "dernieres-nouvelles", de: "neuigkeiten", es: "ultimas-noticias" },
    naam: { nl: "Laatste nieuws", en: "Latest news", zh: "最新消息", fr: "Dernières nouvelles", de: "Neuigkeiten", es: "Últimas noticias" },
  },
  {
    id: "videos",
    slug: { nl: "videos", en: "videos", zh: "shipin", fr: "videos", de: "videos", es: "videos" },
    naam: { nl: "Video's", en: "Videos", zh: "视频", fr: "Vidéos", de: "Videos", es: "Vídeos" },
  },
  {
    id: "aan-de-slag",
    slug: { nl: "aan-de-slag", en: "getting-started", zh: "rumen", fr: "premiers-pas", de: "erste-schritte", es: "primeros-pasos" },
    naam: { nl: "Aan de slag", en: "Getting started", zh: "入门", fr: "Premiers pas", de: "Erste Schritte", es: "Primeros pasos" },
  },
  {
    id: "training",
    slug: { nl: "training", en: "training", zh: "jiaocheng", fr: "formation", de: "schulung", es: "formacion" },
    naam: { nl: "Training", en: "Training", zh: "教程", fr: "Formation", de: "Schulung", es: "Formación" },
  },
  {
    id: "automatiseringen",
    slug: { nl: "automatiseringen", en: "automations", zh: "zidonghua", fr: "automatisations", de: "automatisierungen", es: "automatizaciones" },
    naam: { nl: "Automatiseringen", en: "Automations", zh: "自动化", fr: "Automatisations", de: "Automatisierungen", es: "Automatizaciones" },
  },
  {
    id: "dashboards",
    slug: { nl: "dashboards", en: "dashboards", zh: "yibiaopan", fr: "tableaux-de-bord", de: "dashboards", es: "paneles" },
    naam: { nl: "Dashboards", en: "Dashboards", zh: "仪表板", fr: "Tableaux de bord", de: "Dashboards", es: "Paneles" },
  },
  {
    id: "integraties",
    slug: { nl: "integraties", en: "integrations", zh: "jicheng", fr: "integrations", de: "integrationen", es: "integraciones" },
    naam: { nl: "Integraties", en: "Integrations", zh: "集成", fr: "Intégrations", de: "Integrationen", es: "Integraciones" },
  },
  {
    id: "claude-en-ai",
    slug: { nl: "claude-en-ai", en: "claude-and-ai", zh: "claude-ai", fr: "claude-et-ia", de: "claude-und-ki", es: "claude-e-ia" },
    naam: { nl: "Claude & AI", en: "Claude & AI", zh: "Claude 与 AI", fr: "Claude & IA", de: "Claude & KI", es: "Claude e IA" },
  },
  {
    id: "hardware",
    slug: { nl: "hardware", en: "hardware", zh: "yingjian", fr: "materiel", de: "hardware", es: "hardware" },
    naam: { nl: "Hardware", en: "Hardware", zh: "硬件", fr: "Matériel", de: "Hardware", es: "Hardware" },
  },
  {
    // Vangt de artikelen op van verwijderde categorieën; staat altijd
    // vlak vóór het forum.
    id: "overig",
    soort: "overig",
    slug: { nl: "overig", en: "other", zh: "qita", fr: "autres", de: "sonstiges", es: "otros" },
    naam: { nl: "Overig", en: "Other", zh: "其他", fr: "Autres", de: "Sonstiges", es: "Otros" },
  },
  {
    // Het forum heeft in elke taal hetzelfde adres (/<taal>/forum): het is
    // een vaste map in de code. Altijd als laatste.
    id: "forum",
    soort: "forum",
    slug: { nl: "forum", en: "forum", zh: "forum", fr: "forum", de: "forum", es: "forum" },
    naam: { nl: "Forum", en: "Forum", zh: "论坛", fr: "Forum", de: "Forum", es: "Foro" },
  },
];

export const standaardCategorieen: Categorie[] = basis.map((c, i) => ({
  soort: "gewoon",
  ...c,
  vorigeSlugs: {},
  volgorde: c.soort === "overig" ? 1000 : c.soort === "forum" ? 1001 : i * 10,
  verwijderd: false,
}));

export function categoriePad(categorie: Pick<Categorie, "slug">, taal: Taal): string {
  const slug = categorie.slug[taal];
  return slug ? `/${taal}/${slug}` : `/${taal}`;
}

// Zoekt een categorie op het adres. 'oud' = het adres is een eerder webadres
// (de pagina stuurt dan door). Verwijderde categorieën worden niet gevonden.
export function vindCategorie(
  lijst: Categorie[],
  taal: Taal,
  slug: string,
): { categorie: Categorie; oud: boolean } | undefined {
  const actief = lijst.filter((c) => !c.verwijderd);
  const nu = actief.find((c) => c.slug[taal] !== "" && c.slug[taal] === slug);
  if (nu) return { categorie: nu, oud: false };
  const vroeger = actief.find((c) => c.vorigeSlugs[taal]?.includes(slug));
  return vroeger ? { categorie: vroeger, oud: true } : undefined;
}

// De categorie waaronder een artikel op de site staat: de eigen categorie,
// of "Overig" als die verwijderd (of onbekend) is (W-ADM-14).
export function categorieVanArtikel(lijst: Categorie[], categorieId: string): Categorie {
  const eigen = lijst.find((c) => c.id === categorieId);
  if (eigen && !eigen.verwijderd) return eigen;
  return (
    lijst.find((c) => c.soort === "overig") ??
    standaardCategorieen.find((c) => c.soort === "overig")!
  );
}

// Vaste teksten van de interface per taal.
type SiteTeksten = {
  ondertitel: string;
  laatsteNieuws: string;
  meerIn: string;
  voorbeeld: string;
  nogLeeg: string;
  onafhankelijk: string;
  taalKiezen: string;
  categorieen: string;
  door: string;
  // "Automatisch vertaald uit" + taalInZin, bijvoorbeeld
  // "Automatisch vertaald uit het Duits".
  vertaaldUit: string;
  origineelBekijken: string;
  // "Origineel: Duits · nog niet vertaald"
  origineel: string;
  nogNietVertaald: string;
  taalInZin: Record<Taal, string>;
  // Namen van de talen in deze taal ("Duits", "German").
  taalNaam: Record<Taal, string>;
};

export const teksten: Record<Taal, SiteTeksten> = {
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
    origineel: "Origineel",
    nogNietVertaald: "nog niet vertaald",
    taalInZin: {
      nl: "het Nederlands",
      en: "het Engels",
      zh: "het Chinees",
      fr: "het Frans",
      de: "het Duits",
      es: "het Spaans",
    },
    taalNaam: {
      nl: "Nederlands",
      en: "Engels",
      zh: "Chinees",
      fr: "Frans",
      de: "Duits",
      es: "Spaans",
    },
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
    origineel: "Original",
    nogNietVertaald: "not translated yet",
    taalInZin: {
      nl: "Dutch",
      en: "English",
      zh: "Chinese",
      fr: "French",
      de: "German",
      es: "Spanish",
    },
    taalNaam: {
      nl: "Dutch",
      en: "English",
      zh: "Chinese",
      fr: "French",
      de: "German",
      es: "Spanish",
    },
  },
  zh: {
    ondertitel: "用通俗易懂的语言介绍 Home Assistant 的一切",
    laatsteNieuws: "最新消息",
    meerIn: "更多",
    voorbeeld: "示例文章",
    nogLeeg: "此类别暂无文章。",
    onafhankelijk: "本网站为独立网站，与 Home Assistant 或 Nabu Casa 无关。",
    taalKiezen: "选择语言",
    categorieen: "类别",
    door: "作者：",
    vertaaldUit: "自动翻译自",
    origineelBekijken: "查看原文",
    origineel: "原文",
    nogNietVertaald: "尚未翻译",
    taalInZin: {
      nl: "荷兰语",
      en: "英语",
      zh: "中文",
      fr: "法语",
      de: "德语",
      es: "西班牙语",
    },
    taalNaam: {
      nl: "荷兰语",
      en: "英语",
      zh: "中文",
      fr: "法语",
      de: "德语",
      es: "西班牙语",
    },
  },
  fr: {
    ondertitel: "Tout sur Home Assistant, en langage clair",
    laatsteNieuws: "Dernières nouvelles",
    meerIn: "Plus dans",
    voorbeeld: "Article d'exemple",
    nogLeeg: "Il n'y a pas encore d'articles dans cette catégorie.",
    onafhankelijk:
      "Ce site est indépendant et n'est pas affilié à Home Assistant ni à Nabu Casa.",
    taalKiezen: "Choisir la langue",
    categorieen: "Catégories",
    door: "Par",
    vertaaldUit: "Traduit automatiquement",
    origineelBekijken: "Voir l'original",
    origineel: "Original",
    nogNietVertaald: "pas encore traduit",
    taalInZin: {
      nl: "du néerlandais",
      en: "de l'anglais",
      zh: "du chinois",
      fr: "du français",
      de: "de l'allemand",
      es: "de l'espagnol",
    },
    taalNaam: {
      nl: "néerlandais",
      en: "anglais",
      zh: "chinois",
      fr: "français",
      de: "allemand",
      es: "espagnol",
    },
  },
  de: {
    ondertitel: "Alles über Home Assistant, verständlich erklärt",
    laatsteNieuws: "Neuigkeiten",
    meerIn: "Mehr in",
    voorbeeld: "Beispielartikel",
    nogLeeg: "In dieser Kategorie gibt es noch keine Artikel.",
    onafhankelijk:
      "Diese Website ist unabhängig und steht in keiner Verbindung zu Home Assistant oder Nabu Casa.",
    taalKiezen: "Sprache wählen",
    categorieen: "Kategorien",
    door: "Von",
    vertaaldUit: "Automatisch übersetzt aus dem",
    origineelBekijken: "Original anzeigen",
    origineel: "Original",
    nogNietVertaald: "noch nicht übersetzt",
    taalInZin: {
      nl: "Niederländischen",
      en: "Englischen",
      zh: "Chinesischen",
      fr: "Französischen",
      de: "Deutschen",
      es: "Spanischen",
    },
    taalNaam: {
      nl: "Niederländisch",
      en: "Englisch",
      zh: "Chinesisch",
      fr: "Französisch",
      de: "Deutsch",
      es: "Spanisch",
    },
  },
  es: {
    ondertitel: "Todo sobre Home Assistant, en lenguaje sencillo",
    laatsteNieuws: "Últimas noticias",
    meerIn: "Más en",
    voorbeeld: "Artículo de ejemplo",
    nogLeeg: "Todavía no hay artículos en esta categoría.",
    onafhankelijk:
      "Este sitio es independiente y no está vinculado a Home Assistant ni a Nabu Casa.",
    taalKiezen: "Elegir idioma",
    categorieen: "Categorías",
    door: "Por",
    vertaaldUit: "Traducido automáticamente",
    origineelBekijken: "Ver el original",
    origineel: "Original",
    nogNietVertaald: "aún sin traducir",
    taalInZin: {
      nl: "del neerlandés",
      en: "del inglés",
      zh: "del chino",
      fr: "del francés",
      de: "del alemán",
      es: "del español",
    },
    taalNaam: {
      nl: "neerlandés",
      en: "inglés",
      zh: "chino",
      fr: "francés",
      de: "alemán",
      es: "español",
    },
  },
};

// "Automatisch vertaald uit het Duits", "自动翻译自德语".
export function vertaaldUitZin(taal: Taal, origineel: Taal): string {
  const t = teksten[taal];
  const scheiding = taal === "zh" ? "" : " ";
  return `${t.vertaaldUit}${scheiding}${t.taalInZin[origineel]}`;
}

// "Origineel: Duits · nog niet vertaald"
export function nietVertaaldZin(taal: Taal, origineel: Taal): string {
  const t = teksten[taal];
  const dubbelepunt = taal === "zh" ? "：" : taal === "fr" ? " : " : ": ";
  return `${t.origineel}${dubbelepunt}${t.taalNaam[origineel]} · ${t.nogNietVertaald}`;
}
