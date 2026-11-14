import Link from "next/link";
import { notFound } from "next/navigation";
import Artikelkaart from "@/components/Artikelkaart";
import { artikelPad, getArtikelen, tijdVan, verdeelVoorpagina } from "@/lib/artikelen";
import type { Metadata } from "next";
import { zelfdePadAlternatieven } from "@/lib/hreflang";
import { isTaal, teksten } from "@/lib/site";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isTaal(lang)) return {};
  return { alternates: zelfdePadAlternatieven(lang, "") };
}

// Openingspagina in de opbouw van nos.nl (requirement W-LAY-01):
// groot hoofdartikel, raster van artikelkaarten en een kolom met het laatste nieuws.
export default async function Voorpagina({ params }: PageProps<"/[lang]">) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const t = teksten[lang];
  const artikelen = await getArtikelen(lang);
  // Hoofdartikel en raster volgens de vaste plekken uit het beheerpaneel
  // (W-ADM-17); lege plekken krijgen het nieuwste artikel.
  const { hoofdartikel, raster } = verdeelVoorpagina(artikelen);

  if (!hoofdartikel) return <p className="leeg">{t.nogLeeg}</p>;

  return (
    <div className="voorpagina">
      <div className="hoofdkolom">
        <Artikelkaart artikel={hoofdartikel} groot />
        <div className="raster">
          {raster.map((artikel) => (
            <Artikelkaart key={artikel.id} artikel={artikel} />
          ))}
        </div>
      </div>
      <aside
        className="zijkolom"
        aria-labelledby="laatste-nieuws"
        data-meting-plek="nieuwskolom"
      >
        <h2 id="laatste-nieuws">{t.laatsteNieuws}</h2>
        <ol>
          {artikelen.slice(0, 10).map((artikel) => {
            const pad = artikelPad(artikel, lang);
            return (
              <li key={artikel.id}>
                <time dateTime={artikel.gepubliceerdOp}>{tijdVan(artikel)}</time>
                {pad ? (
                  <Link href={pad}>{artikel.kop}</Link>
                ) : (
                  <span>{artikel.kop}</span>
                )}
              </li>
            );
          })}
        </ol>
      </aside>
    </div>
  );
}
