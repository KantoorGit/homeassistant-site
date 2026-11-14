import type { BeheerTeksten } from "@/lib/beheer/teksten";
import type { Kolom } from "./onderdelen";

// Welke tabellen op welk tabblad staan, met kolommen, in de taal van het
// beheerpaneel (W-ADM-20). Dezelfde lijst wordt gebruikt voor de CSV-download.

export type Sectie = {
  titel: string;
  kolommen: Kolom[];
  uitleg?: string;
  alleenToestemming?: boolean;
};

export function maakSecties(t: BeheerTeksten): Record<string, Sectie> {
  const k = t.kol;
  const n = t.sectie;
  const getal = (sleutel: string, label: string): Kolom => ({ sleutel, label, soort: "getal" });
  const tekst = (sleutel: string, label: string): Kolom => ({ sleutel, label });
  const sessies = getal("sessies", k.sessies);
  const naamMet = (label: string) => [tekst("naam", label), sessies];

  return {
    per_dag: {
      titel: n.per_dag,
      kolommen: [tekst("dag", k.dag), getal("bezoekers", k.bezoekers), sessies, getal("paginaweergaven", k.paginaweergaven)],
    },
    kanalen: {
      titel: n.kanalen,
      kolommen: [tekst("naam", k.kanaal), sessies, getal("bezoekers", k.bezoekers), getal("paginaweergaven", k.paginaweergaven)],
    },
    verwijzers: { titel: n.verwijzers, kolommen: naamMet(k.site) },
    zoekmachines: { titel: n.zoekmachines, kolommen: naamMet(k.zoekmachine), uitleg: n.zoekmachinesUitleg },
    campagnes: {
      titel: n.campagnes,
      kolommen: [tekst("campagne", k.campagne), tekst("bron", k.bron), tekst("medium", k.medium), sessies],
    },
    landen: { titel: n.landen, kolommen: naamMet(k.land) },
    regios: { titel: n.regios, kolommen: naamMet(k.regio) },
    steden: { titel: n.steden, kolommen: naamMet(k.stad), alleenToestemming: true },
    sitetalen: { titel: n.sitetalen, kolommen: naamMet(k.taal) },
    browsertalen: { titel: n.browsertalen, kolommen: naamMet(k.taal) },
    apparaten: { titel: n.apparaten, kolommen: naamMet(k.apparaat) },
    browsers: { titel: n.browsers, kolommen: naamMet(k.browser) },
    besturingssystemen: { titel: n.besturingssystemen, kolommen: naamMet(k.besturingssysteem) },
    schermen: { titel: n.schermen, kolommen: naamMet(k.scherm) },
    nieuw_terugkerend: {
      titel: n.nieuw_terugkerend,
      kolommen: [tekst("naam", k.soort), getal("bezoekers", k.bezoekers), sessies],
      alleenToestemming: true,
    },
    bezoekfrequentie: {
      titel: n.bezoekfrequentie,
      kolommen: [tekst("bezoeken", k.bezoekenPeriode), getal("bezoekers", k.bezoekers)],
      alleenToestemming: true,
    },
    paginas: {
      titel: n.paginas,
      kolommen: [
        tekst("naam", k.pagina),
        getal("weergaven", k.weergaven),
        sessies,
        { sleutel: "gem_ms", label: k.gemTijd, soort: "ms" },
      ],
    },
    artikelen: {
      titel: n.artikelen,
      kolommen: [tekst("kop", k.artikel), getal("weergaven", k.weergaven), sessies],
    },
    categorieen: {
      titel: n.categorieen,
      kolommen: [tekst("naam", k.categorie), getal("weergaven", k.weergaven)],
    },
    instap: {
      titel: n.instap,
      kolommen: [tekst("naam", k.pagina), sessies, { sleutel: "een_pagina_pct", label: k.alleenDeze, soort: "pct" }],
    },
    uitstap: { titel: n.uitstap, kolommen: naamMet(k.pagina) },
    paden: {
      titel: n.paden,
      kolommen: [tekst("van", k.van), tekst("naar", k.naar), getal("aantal", k.aantal)],
    },
    klikken: {
      titel: n.klikken,
      kolommen: [tekst("plek", k.plek), tekst("naam", k.klikDoel), getal("aantal", k.aantal)],
    },
    scroll: {
      titel: n.scroll,
      kolommen: [
        tekst("pad", k.artikel),
        getal("p25", k.p25),
        getal("p50", k.p50),
        getal("p75", k.p75),
        getal("p100", k.uitgelezen),
      ],
    },
    video: {
      titel: n.video,
      kolommen: [
        tekst("video", k.video),
        getal("gestart", k.gestart),
        getal("p25", k.p25),
        getal("p50", k.p50),
        getal("p75", k.p75),
        getal("uitgekeken", k.uitgekeken),
      ],
    },
    trainingen: {
      titel: n.trainingen,
      kolommen: [tekst("pad", k.training), tekst("stap", k.stap), sessies],
      uitleg: n.trainingenUitleg,
    },
    zoeken: {
      titel: n.zoeken,
      kolommen: [tekst("zoekterm", k.zoekterm), getal("aantal", k.aantal), getal("gem_resultaten", k.gemResultaten)],
      uitleg: n.zoekenUitleg,
    },
    fouten404: {
      titel: n.fouten404,
      kolommen: [tekst("pad", k.adres), tekst("verwijzer", k.verwezenDoor), getal("aantal", k.aantal)],
    },
    snelheid: {
      titel: n.snelheid,
      kolommen: [
        tekst("meting", k.meting),
        tekst("apparaat", k.apparaat),
        getal("aantal", k.metingen),
        { sleutel: "p75", label: k.waarde, soort: "seconden" },
      ],
      uitleg: n.snelheidUitleg,
    },
    doelen: {
      titel: n.doelen,
      kolommen: [tekst("naam", k.doel), getal("aantal", k.aantal), sessies],
    },
    taalwissels: {
      titel: n.taalwissels,
      kolommen: [tekst("naam", k.vanNaar), getal("aantal", k.aantal)],
    },
  };
}

// Waarden uit de database die op het scherm vertaald worden (apparaat,
// kanaal, nieuw/terugkerend). Onbekende waarden blijven zoals ze zijn.
export function vertaalWaarde<W>(t: BeheerTeksten, waarde: W): W | string {
  if (typeof waarde !== "string") return waarde;
  return (t.waarde as Record<string, string>)[waarde] ?? waarde;
}
