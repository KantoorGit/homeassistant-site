"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { taalCode, taalKort, taalNamen, talen, type Taal } from "@/lib/site";

// Taal van het beheerpaneel wisselen (W-ADM-20). De link gaat naar dezelfde
// pagina met ?taal=…; proxy.ts onthoudt de keuze en haalt ?taal weer weg.
export default function BeheerTaalkiezer({ taal, label }: { taal: Taal; label: string }) {
  const pad = usePathname();
  return (
    <nav className="taalkiezer beheer-taalkiezer" aria-label={label}>
      {talen.map((t) => (
        <Link
          key={t}
          href={`${pad}?taal=${t}`}
          hrefLang={taalCode[t]}
          lang={taalCode[t]}
          title={taalNamen[t]}
          aria-label={taalNamen[t]}
          aria-current={t === taal ? "true" : undefined}
          prefetch={false}
        >
          {taalKort[t]}
        </Link>
      ))}
    </nav>
  );
}
