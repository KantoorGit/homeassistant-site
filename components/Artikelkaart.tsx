import { categorieen, teksten, type Taal } from "@/lib/site";
import type { Artikel } from "@/lib/voorbeeldartikelen";

// Kaart met beeldvlak, categorie-label en kop. Zolang er geen foto's zijn,
// toont het beeldvlak een kleurvlak in de huisstijl.
export default function Artikelkaart({
  artikel,
  taal,
  groot = false,
}: {
  artikel: Artikel;
  taal: Taal;
  groot?: boolean;
}) {
  const categorie = categorieen.find((c) => c.id === artikel.categorieId);
  const Kop = groot ? "h1" : "h2";

  return (
    <article className={groot ? "kaart kaart-groot" : "kaart"}>
      <div className="kaart-beeld" aria-hidden="true">
        <span>{teksten[taal].voorbeeld}</span>
      </div>
      <div className="kaart-tekst">
        {categorie && <p className="label">{categorie.naam[taal]}</p>}
        <Kop>{artikel.kop[taal]}</Kop>
        {groot && <p className="intro">{artikel.intro[taal]}</p>}
      </div>
    </article>
  );
}
