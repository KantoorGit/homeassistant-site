"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categorieen, categoriePad, teksten, type Taal } from "@/lib/site";

export default function Categoriebalk({ taal }: { taal: Taal }) {
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
