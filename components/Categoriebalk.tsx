"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categoriePad, teksten, type Categorie, type Taal } from "@/lib/site";

// De categorieën komen uit de database (beheerpaneel, W-ADM-07), in de
// volgorde die daar is ingesteld; Overig en Forum staan altijd achteraan.
export default function Categoriebalk({
  taal,
  categorieen,
}: {
  taal: Taal;
  categorieen: Categorie[];
}) {
  const pad = usePathname();

  return (
    <nav className="categoriebalk" aria-label={teksten[taal].categorieen}>
      <ul className="inhoud">
        {categorieen.map((categorie) => {
          const href = categoriePad(categorie, taal);
          const actief = pad === href;
          return (
            <li key={categorie.id}>
              <Link href={href} aria-current={actief ? "page" : undefined}>
                {categorie.naam[taal]}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
