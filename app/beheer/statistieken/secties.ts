import type { Kolom } from "./onderdelen";

// Welke tabellen op welk tabblad staan, met kolommen. Dezelfde lijst wordt
// gebruikt voor de CSV-download.

export type Sectie = {
  titel: string;
  kolommen: Kolom[];
  uitleg?: string;
  alleenToestemming?: boolean;
};

const sessies: Kolom = { sleutel: "sessies", label: "Sessies", soort: "getal" };

export const secties: Record<string, Sectie> = {
  per_dag: {
    titel: "Per dag",
    kolommen: [
      { sleutel: "dag", label: "Dag" },
      { sleutel: "bezoekers", label: "Bezoekers", soort: "getal" },
      sessies,
      { sleutel: "paginaweergaven", label: "Paginaweergaven", soort: "getal" },
    ],
  },
  kanalen: {
    titel: "Kanalen",
    kolommen: [
      { sleutel: "naam", label: "Kanaal" },
      sessies,
      { sleutel: "bezoekers", label: "Bezoekers", soort: "getal" },
      { sleutel: "paginaweergaven", label: "Paginaweergaven", soort: "getal" },
    ],
  },
  verwijzers: {
    titel: "Verwijzende sites",
    kolommen: [{ sleutel: "naam", label: "Site" }, sessies],
  },
  zoekmachines: {
    titel: "Zoekmachines",
    kolommen: [{ sleutel: "naam", label: "Zoekmachine" }, sessies],
    uitleg:
      "Zoekwoorden geven zoekmachines niet aan de site door. Die komen later via Google Search Console en Bing Webmaster Tools (W-ANA-11).",
  },
  campagnes: {
    titel: "Campagnes (UTM-codes)",
    kolommen: [
      { sleutel: "campagne", label: "Campagne" },
      { sleutel: "bron", label: "Bron" },
      { sleutel: "medium", label: "Medium" },
      sessies,
    ],
  },
  landen: { titel: "Landen", kolommen: [{ sleutel: "naam", label: "Land" }, sessies] },
  regios: { titel: "Regio's", kolommen: [{ sleutel: "naam", label: "Regio" }, sessies] },
  steden: {
    titel: "Steden",
    kolommen: [{ sleutel: "naam", label: "Stad" }, sessies],
    alleenToestemming: true,
  },
  sitetalen: { titel: "Taal van de site", kolommen: [{ sleutel: "naam", label: "Taal" }, sessies] },
  browsertalen: { titel: "Taal van de browser", kolommen: [{ sleutel: "naam", label: "Taal" }, sessies] },
  apparaten: { titel: "Apparaten", kolommen: [{ sleutel: "naam", label: "Apparaat" }, sessies] },
  browsers: { titel: "Browsers", kolommen: [{ sleutel: "naam", label: "Browser" }, sessies] },
  besturingssystemen: {
    titel: "Besturingssystemen",
    kolommen: [{ sleutel: "naam", label: "Besturingssysteem" }, sessies],
  },
  schermen: { titel: "Schermresolutie", kolommen: [{ sleutel: "naam", label: "Scherm" }, sessies] },
  nieuw_terugkerend: {
    titel: "Nieuwe en terugkerende bezoekers",
    kolommen: [
      { sleutel: "naam", label: "Soort" },
      { sleutel: "bezoekers", label: "Bezoekers", soort: "getal" },
      sessies,
    ],
    alleenToestemming: true,
  },
  bezoekfrequentie: {
    titel: "Aantal bezoeken per bezoeker",
    kolommen: [
      { sleutel: "bezoeken", label: "Bezoeken in deze periode" },
      { sleutel: "bezoekers", label: "Bezoekers", soort: "getal" },
    ],
    alleenToestemming: true,
  },
  paginas: {
    titel: "Populairste pagina's",
    kolommen: [
      { sleutel: "naam", label: "Pagina" },
      { sleutel: "weergaven", label: "Weergaven", soort: "getal" },
      sessies,
      { sleutel: "gem_ms", label: "Gem. actieve tijd", soort: "ms" },
    ],
  },
  artikelen: {
    titel: "Artikelen",
    kolommen: [
      { sleutel: "kop", label: "Artikel" },
      { sleutel: "weergaven", label: "Weergaven", soort: "getal" },
      sessies,
    ],
  },
  categorieen: {
    titel: "Categorieën en paginasoorten",
    kolommen: [
      { sleutel: "naam", label: "Categorie" },
      { sleutel: "weergaven", label: "Weergaven", soort: "getal" },
    ],
  },
  instap: {
    titel: "Instappagina's",
    kolommen: [
      { sleutel: "naam", label: "Pagina" },
      sessies,
      { sleutel: "een_pagina_pct", label: "Alleen deze pagina", soort: "pct" },
    ],
  },
  uitstap: { titel: "Uitstappagina's", kolommen: [{ sleutel: "naam", label: "Pagina" }, sessies] },
  paden: {
    titel: "Paden (van pagina naar pagina)",
    kolommen: [
      { sleutel: "van", label: "Van" },
      { sleutel: "naar", label: "Naar" },
      { sleutel: "aantal", label: "Aantal", soort: "getal" },
    ],
  },
  klikken: {
    titel: "Klikken",
    kolommen: [
      { sleutel: "plek", label: "Plek" },
      { sleutel: "naam", label: "Doel van de klik" },
      { sleutel: "aantal", label: "Aantal", soort: "getal" },
    ],
  },
  scroll: {
    titel: "Scrolldiepte per artikel",
    kolommen: [
      { sleutel: "pad", label: "Artikel" },
      { sleutel: "p25", label: "25%", soort: "getal" },
      { sleutel: "p50", label: "50%", soort: "getal" },
      { sleutel: "p75", label: "75%", soort: "getal" },
      { sleutel: "p100", label: "Uitgelezen", soort: "getal" },
    ],
  },
  video: {
    titel: "Video's",
    kolommen: [
      { sleutel: "video", label: "YouTube-video" },
      { sleutel: "gestart", label: "Gestart", soort: "getal" },
      { sleutel: "p25", label: "25%", soort: "getal" },
      { sleutel: "p50", label: "50%", soort: "getal" },
      { sleutel: "p75", label: "75%", soort: "getal" },
      { sleutel: "uitgekeken", label: "Uitgekeken", soort: "getal" },
    ],
  },
  trainingen: {
    titel: "Trainingen",
    kolommen: [
      { sleutel: "pad", label: "Training" },
      { sleutel: "stap", label: "Stap" },
      sessies,
    ],
    uitleg: "Stappen worden geteld zodra trainingen genummerde stappen hebben; \"afgerond\" = tot het eind gelezen.",
  },
  zoeken: {
    titel: "Zoekopdrachten op de site",
    kolommen: [
      { sleutel: "zoekterm", label: "Zoekterm" },
      { sleutel: "aantal", label: "Aantal", soort: "getal" },
      { sleutel: "gem_resultaten", label: "Gem. resultaten", soort: "getal" },
    ],
    uitleg: "Telt zodra de zoekfunctie er is (W-LAY-07).",
  },
  fouten404: {
    titel: "Foutpagina's (404)",
    kolommen: [
      { sleutel: "pad", label: "Adres" },
      { sleutel: "verwijzer", label: "Verwezen door" },
      { sleutel: "aantal", label: "Aantal", soort: "getal" },
    ],
  },
  snelheid: {
    titel: "Laadsnelheid (Core Web Vitals, 75e percentiel)",
    kolommen: [
      { sleutel: "meting", label: "Meting" },
      { sleutel: "apparaat", label: "Apparaat" },
      { sleutel: "aantal", label: "Metingen", soort: "getal" },
      { sleutel: "p75", label: "Waarde (LCP en INP in ms)", soort: "seconden" },
    ],
    uitleg: "Goed is: LCP onder 2500 ms, INP onder 200 ms, CLS onder 0,1.",
  },
  doelen: {
    titel: "Doelen",
    kolommen: [
      { sleutel: "naam", label: "Doel" },
      { sleutel: "aantal", label: "Aantal", soort: "getal" },
      sessies,
    ],
  },
  taalwissels: {
    titel: "Taalwissels",
    kolommen: [
      { sleutel: "naam", label: "Van → naar" },
      { sleutel: "aantal", label: "Aantal", soort: "getal" },
    ],
  },
};

export const doelNamen: Record<string, string> = {
  registratie_voltooid: "Account aangemaakt",
  "2fa_gekoppeld": "Authenticator-app gekoppeld",
  ingelogd: "Ingelogd",
  forum_vraag: "Nieuwe forumvraag",
  forum_reactie: "Reactie op het forum",
  forum_melding: "Melding van een bericht",
};
