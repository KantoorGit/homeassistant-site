import type { Metadata } from "next";
import { standaardTaal, taalCode, talen, type Taal } from "./site";

// Canoniek adres en hreflang-verwijzingen naar dezelfde pagina in de andere
// talen (W-SEO-04). Geef per taal het adres, of null als de pagina in die
// taal niet bestaat.
export function taalAlternatieven(
  huidig: Taal,
  paden: Partial<Record<Taal, string | null>>,
): Metadata["alternates"] {
  const languages: Record<string, string> = {};
  for (const t of talen) {
    const pad = paden[t];
    if (pad) languages[taalCode[t]] = pad;
  }
  const standaard = paden[standaardTaal];
  if (standaard) languages["x-default"] = standaard;
  return { canonical: paden[huidig] ?? undefined, languages };
}

// Voor pagina's die in elke taal hetzelfde adres hebben na de taalcode
// (bijvoorbeeld /nl/forum en /en/forum).
export function zelfdePadAlternatieven(
  huidig: Taal,
  rest: string,
): Metadata["alternates"] {
  return taalAlternatieven(
    huidig,
    Object.fromEntries(talen.map((t) => [t, `/${t}${rest}`])),
  );
}
