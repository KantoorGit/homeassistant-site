import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  artikelPad,
  datumVan,
  getArtikel,
  getArtikelen,
} from "@/lib/artikelen";
import { youtubeId } from "@/lib/beheer/hulp";
import { categorieen, categoriePad, isTaal, talen, teksten } from "@/lib/site";

type Props = PageProps<"/[lang]/[categorie]/[slug]">;

export async function generateStaticParams() {
  const paden = [];
  for (const lang of talen) {
    for (const artikel of await getArtikelen(lang)) {
      const categorie = categorieen.find((c) => c.id === artikel.categorieId);
      if (categorie?.slug[lang]) {
        paden.push({
          lang,
          categorie: categorie.slug[lang],
          slug: artikel.slug,
        });
      }
    }
  }
  return paden;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isTaal(lang)) return {};
  const artikel = await getArtikel(lang, slug);
  return artikel ? { title: artikel.kop, description: artikel.intro } : {};
}

// Artikelpagina met kop, datum, auteur, beeld en tekst (requirement W-LAY-06).
export default async function Artikelpagina({ params }: Props) {
  const { lang, categorie: categorieSlug, slug } = await params;
  if (!isTaal(lang)) notFound();

  const artikel = await getArtikel(lang, slug);
  if (!artikel) notFound();

  // Klopt het adres niet precies (slug uit een andere taal, of een andere
  // categorie), dan door naar het juiste adres.
  const pad = artikelPad(artikel, lang);
  if (!pad) notFound();
  if (pad !== `/${lang}/${categorieSlug}/${slug}`) redirect(pad);

  const t = teksten[lang];
  const video = youtubeId(artikel.videoUrl);
  const categorie = categorieen.find((c) => c.id === artikel.categorieId)!;
  const isVertaling = artikel.origineleTaal !== lang;
  const origineel = isVertaling
    ? artikelPad(artikel, artikel.origineleTaal)
    : null;

  return (
    <article className="artikel">
      <p className="label">
        <Link href={categoriePad(categorie, lang)}>{categorie.naam[lang]}</Link>
      </p>
      <h1>{artikel.kop}</h1>
      <p className="artikel-meta">
        <time dateTime={artikel.gepubliceerdOp}>{datumVan(artikel)}</time>
        {" · "}
        {t.door} {artikel.auteur}
      </p>

      {isVertaling && artikel.automatischVertaald && (
        <p className="vertaalmelding">
          {t.vertaaldUit} {t.taalInZin[artikel.origineleTaal]}.{" "}
          {origineel && (
            <Link href={origineel} hrefLang={artikel.origineleTaal}>
              {t.origineelBekijken}
            </Link>
          )}
        </p>
      )}

      {video ? (
        <div className="video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video}`}
            title={artikel.kop}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        </div>
      ) : artikel.afbeeldingUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={artikel.afbeeldingUrl} alt="" className="artikel-foto" />
      ) : (
        <div className="kaart-beeld artikel-beeld" aria-hidden="true">
          {artikel.isVoorbeeld && <span>{t.voorbeeld}</span>}
        </div>
      )}

      {artikel.intro && <p className="intro">{artikel.intro}</p>}
      <div className="artikel-tekst">
        {artikel.tekst
          .split(/\n{2,}/)
          .filter((alinea) => alinea.trim() !== "")
          .map((alinea, i) => (
            <p key={i}>{alinea}</p>
          ))}
      </div>
    </article>
  );
}
