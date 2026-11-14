import type { Taal } from "@/lib/site";
import { de } from "./teksten/de";
import { en } from "./teksten/en";
import { es } from "./teksten/es";
import { fr } from "./teksten/fr";
import { nl, type BeheerTeksten } from "./teksten/nl";
import { zh } from "./teksten/zh";

export type { BeheerTeksten };

// Het beheerpaneel in de taal waarin de beheerder binnenkwam (W-ADM-20).
export const beheerTeksten: Record<Taal, BeheerTeksten> = { nl, en, zh, fr, de, es };

// Cookie met de taal van het beheerpaneel. Wordt gezet door proxy.ts als
// het beheerpaneel geopend wordt met ?taal=… (de link vanaf de website en
// de taalkiezer in het beheerpaneel).
export const beheerTaalCookie = "beheertaal";

// Vult {n}, {naam} enzovoort in.
export function vul(tekst: string, waarden: Record<string, string | number> = {}): string {
  return tekst.replace(/\{(\w+)\}/g, (heel, sleutel: string) =>
    sleutel in waarden ? String(waarden[sleutel]) : heel,
  );
}

// Enkelvoud of meervoud: "1 taal" / "3 talen".
export function telTekst(aantal: number, een: string, meer: string): string {
  return vul(aantal === 1 ? een : meer, { n: aantal });
}

// Opmaak van datums en getallen per taal.
export const landcode: Record<Taal, string> = {
  nl: "nl-NL",
  en: "en-GB",
  zh: "zh-CN",
  fr: "fr-FR",
  de: "de-DE",
  es: "es-ES",
};
