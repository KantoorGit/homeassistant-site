"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  categoriePad,
  taalNamen,
  talen,
  teksten,
  vindCategorie,
  type Taal,
} from "@/lib/site";

// Zoekt bij de huidige pagina het adres van dezelfde pagina in een andere taal.
function padInTaal(pad: string, van: Taal, naar: Taal): string {
  const delen = pad.split("/").filter(Boolean).slice(1);
  if (delen.length === 0) return `/${naar}`;
  const categorie = vindCategorie(van, delen[0]);
  if (categorie) return categoriePad(categorie, naar);
  return `/${naar}/${delen.join("/")}`;
}

export default function Taalkiezer({ taal }: { taal: Taal }) {
  const pad = usePathname();

  return (
    <nav className="taalkiezer" aria-label={teksten[taal].taalKiezen}>
      {talen.map((t) => (
        <Link
          key={t}
          href={padInTaal(pad, taal, t)}
          hrefLang={t}
          lang={t}
          aria-current={t === taal ? "true" : undefined}
        >
          {taalNamen[t]}
        </Link>
      ))}
    </nav>
  );
}
