import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  artikelPad,
  datumVan,
  getArtikel,
  getArtikelen,
} from "@/lib/artikelen";
import { videoInfo } from "@/lib/video";
import {
  categoriePad,
  isTaal,
  nietVertaaldZin,
  taalCode,
  talen,
  teksten,
  vertaaldUitZin,
} from "@/lib/site";
import { taalAlternatieven } from "@/lib/hreflang";

type Props = PageProps<"/[lang]/[categorie]/[slug]">;

export async function generateStaticParams() {
  const paden = [];
  for (const lang of talen) {
    for (const artikel of await getArtikelen(lang)) {
      const categorie = artikel.categorie;
      if (categorie.slug[lang]) {
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
  if (!artikel) return {};
  const paden = Object.fromEntries(
    // Alleen talen met een echte vertaling (geen terugval op het origineel).
    talen.map((t) => [t, artikel.slugPerTaal[t] ? artikelPad(artikel, t) : null]),
  );
  return {
    title: artikel.kop,
    description: artikel.intro,
    alternates: {
      ...taalAlternatieven(lang, paden),
      // Nog niet vertaald: deze pagina toont het origineel, dus dat is het
      // canonieke adres.
      ...(artikel.nietVertaald
        ? { canonical: artikelPad(artikel, artikel.origineleTaal) }
        : {}),
    },
  };
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
  const video = videoInfo(artikel.videoUrl);
  const categorie = artikel.categorie;
  const isVertaling = artikel.origineleTaal !== lang && !artikel.nietVertaald;
  const origineel = isVertaling
    ? artikelPad(artikel, artikel.origineleTaal)
    : null;

  return (
    <article
      data-meting-artikel={artikel.id}
      data-meting-categorie={categorie.id}
      className="artikel"
      lang={artikel.nietVertaald ? taalCode[artikel.tekstTaal] : undefined}
    >
      <p className="label" lang={taalCode[lang]}>
        <Link href={categoriePad(categorie, lang)}>{categorie.naam[lang]}</Link>
      </p>
      <h1>{artikel.kop}</h1>
      <p className="artikel-meta" lang={taalCode[lang]}>
        <time dateTime={artikel.gepubliceerdOp}>{datumVan(artikel)}</time>
        {" · "}
        {t.door} {artikel.auteur}
      </p>

      {isVertaling && artikel.automatischVertaald && (
        <p className="vertaalmelding" lang={taalCode[lang]}>
          {vertaaldUitZin(lang, artikel.origineleTaal)}.{" "}
          {origineel && (
            <Link href={origineel} hrefLang={artikel.origineleTaal}>
              {t.origineelBekijken}
            </Link>
          )}
        </p>
      )}

      {artikel.nietVertaald && (
        <p className="vertaalmelding" lang={taalCode[lang]}>
          {nietVertaaldZin(lang, artikel.origineleTaal)}
        </p>
      )}

      {video?.soort === "bestand" ? (
        <div className="video">
          <video
            src={video.bestand}
            controls
            preload="metadata"
            playsInline
            poster={artikel.afbeeldingUrl ?? undefined}
            data-meting-video={video.id}
          />
        </div>
      ) : video ? (
        <div className="video">
          <iframe
            src={video.insluiten}
            data-meting-video={video.soort === "youtube" ? video.id : undefined}
            title={artikel.kop}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
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
