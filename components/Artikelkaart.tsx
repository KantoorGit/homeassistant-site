import Link from "next/link";
import { artikelPad, type Artikel } from "@/lib/artikelen";
import { taalCode, teksten } from "@/lib/site";
import { videoInfo } from "@/lib/video";

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
  const categorie = artikel.categorie;
  const pad = artikelPad(artikel, taal);
  const Kop = groot ? "h1" : "h2";
  // Eigen afbeelding; anders bij een YouTube-video de stilstaande beelden
  // van YouTube. Bij andere video's een kleurvlak met afspeelknop.
  const video = videoInfo(artikel.videoUrl);
  const beeld = artikel.afbeeldingUrl ?? video?.miniatuur ?? null;

  return (
    <article
      className={groot ? "kaart kaart-groot" : "kaart"}
      data-meting-plek={groot ? "hoofdartikel" : "raster"}
    >
      <div className="kaart-beeld" aria-hidden="true">
        {beeld && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={beeld} alt="" loading="lazy" />
        )}
        {video && <span className="speelknop">▶</span>}
        {artikel.isVoorbeeld && <span>{teksten[taal].voorbeeld}</span>}
      </div>
      <div className="kaart-tekst">
        <p className="label">{categorie.naam[taal]}</p>
        <Kop lang={artikel.nietVertaald ? taalCode[artikel.tekstTaal] : undefined}>
          {pad ? <Link href={pad}>{artikel.kop}</Link> : artikel.kop}
        </Kop>
        {groot && (
          <p
            className="intro"
            lang={artikel.nietVertaald ? taalCode[artikel.tekstTaal] : undefined}
          >
            {artikel.intro}
          </p>
        )}
      </div>
    </article>
  );
}
