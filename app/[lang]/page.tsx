import { notFound } from "next/navigation";
import Artikelkaart from "@/components/Artikelkaart";
import { isTaal, teksten } from "@/lib/site";
import { artikelen } from "@/lib/voorbeeldartikelen";

// Openingspagina in de opbouw van nos.nl (requirement W-LAY-01):
// groot hoofdartikel, raster van artikelkaarten en een kolom met het laatste nieuws.
export default async function Voorpagina({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const t = teksten[lang];
  const [hoofdartikel, ...overige] = artikelen;

  return (
    <div className="voorpagina">
      <div className="hoofdkolom">
        <Artikelkaart artikel={hoofdartikel} taal={lang} groot />
        <div className="raster">
          {overige.map((artikel) => (
            <Artikelkaart key={artikel.id} artikel={artikel} taal={lang} />
          ))}
        </div>
      </div>
      <aside className="zijkolom" aria-labelledby="laatste-nieuws">
        <h2 id="laatste-nieuws">{t.laatsteNieuws}</h2>
        <ol>
          {artikelen.map((artikel) => (
            <li key={artikel.id}>
              <time>{artikel.tijd}</time>
              <span>{artikel.kop[lang]}</span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
