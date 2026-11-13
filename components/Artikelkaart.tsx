import Link from "next/link";
import { artikelPad, type Artikel } from "@/lib/artikelen";
import { categorieen, teksten } from "@/lib/site";

// Kaart met beeldvlak, categorie-label en kop. Zolang er geen foto's zijn,
// toont het beeldvlak een kleurvlak in de huisstijl.
export default function Artikelkaart({
  artikel,
  groot = false,
}: {
  artikel: Artikel;
  groot?: boolean;
}) {
  const taal = artikel.taal;
  const categorie = categorieen.find((c) => c.id === artikel.categorieId);
  const pad = artikelPad(artikel, taal);
  const Kop = groot ? "h1" : "h2";

  return (
    <article className={groot ? "kaart kaart-groot" : "kaart"}>
      <div className="kaart-beeld" aria-hidden="true">
        {artikel.isVoorbeeld && <span>{teksten[taal].voorbeeld}</span>}
      </div>
      <div className="kaart-tekst">
        {categorie && <p className="label">{categorie.naam[taal]}</p>}
        <Kop>{pad ? <Link href={pad}>{artikel.kop}</Link> : artikel.kop}</Kop>
        {groot && <p className="intro">{artikel.intro}</p>}
      </div>
    </article>
  );
}
