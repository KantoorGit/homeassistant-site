"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  categoriePad,
  taalCode,
  taalCookie,
  taalKort,
  taalNamen,
  talen,
  teksten,
  vindCategorie,
  type Taal,
} from "@/lib/site";
import { onderwerpPad, vindOnderwerp } from "@/lib/forum";

// Zoekt bij de huidige pagina het adres van dezelfde pagina in een andere taal.
function padInTaal(pad: string, van: Taal, naar: Taal): string {
  const delen = pad.split("/").filter(Boolean).slice(1);
  if (delen.length === 0) return `/${naar}`;
  // Forumonderwerpen hebben per taal een eigen adres.
  if (delen[0] === "forum" && delen[1]) {
    const onderwerp = vindOnderwerp(delen[1]);
    if (onderwerp) {
      return [onderwerpPad(onderwerp, naar), ...delen.slice(2)].join("/");
    }
  }
  const categorie = vindCategorie(van, delen[0]);
  if (!categorie) return `/${naar}/${delen.join("/")}`;
  // Bij een artikel blijft het laatste deel staan; de artikelpagina stuurt
  // zelf door naar het adres in de gekozen taal.
  return [categoriePad(categorie, naar), ...delen.slice(1)].join("/");
}

// Onthoudt de keuze een jaar, zodat het kale adres de volgende keer meteen
// de juiste taal opent (W-TAAL-05). Functionele cookie, geen meting.
function onthoud(taal: Taal) {
  document.cookie = `${taalCookie}=${taal}; path=/; max-age=31536000; samesite=lax; secure`;
}

export default function Taalkiezer({
  taal,
  actieveTalen = talen,
}: {
  taal: Taal;
  // Alleen talen die in het beheerpaneel aan staan (W-TAAL-10).
  actieveTalen?: readonly Taal[];
}) {
  const pad = usePathname();

  return (
    <nav className="taalkiezer" aria-label={teksten[taal].taalKiezen}>
      {talen.filter((t) => actieveTalen.includes(t) || t === taal).map((t) => (
        <Link
          key={t}
          href={padInTaal(pad, taal, t)}
          hrefLang={taalCode[t]}
          lang={taalCode[t]}
          title={taalNamen[t]}
          aria-label={taalNamen[t]}
          aria-current={t === taal ? "true" : undefined}
          onClick={() => onthoud(t)}
          data-meting-taal={t}
        >
          {taalKort[t]}
        </Link>
      ))}
    </nav>
  );
}
