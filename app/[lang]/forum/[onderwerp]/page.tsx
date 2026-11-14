import { taalAlternatieven } from "@/lib/hreflang";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import Draadlijst from "@/components/Draadlijst";
import { onderwerpen, onderwerpPad, vindOnderwerp } from "@/lib/forum";
import { haalDraden } from "@/lib/forum-gegevens";
import { isTaal, talen } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

type Props = PageProps<"/[lang]/forum/[onderwerp]">;

export async function generateStaticParams() {
  return talen.flatMap((lang) => onderwerpen.map((o) => ({ lang, onderwerp: o.slug[lang] })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, onderwerp: slug } = await params;
  if (!isTaal(lang)) return {};
  const onderwerp = vindOnderwerp(slug);
  return onderwerp
    ? {
        title: `${onderwerp.naam[lang]} – ${ledenTeksten[lang].forum.titel}`,
        description: onderwerp.uitleg[lang],
        alternates: taalAlternatieven(
          lang,
          Object.fromEntries(talen.map((t) => [t, onderwerpPad(onderwerp, t)])),
        ),
      }
    : {};
}

// Alle discussies binnen één onderwerp.
export default async function Onderwerppagina({ params }: Props) {
  const { lang, onderwerp: slug } = await params;
  if (!isTaal(lang)) notFound();
  const onderwerp = vindOnderwerp(slug);
  if (!onderwerp) notFound();
  // Adres uit een andere taal: door naar het juiste adres.
  if (onderwerp.slug[lang] !== slug) redirect(onderwerpPad(onderwerp, lang));

  const t = ledenTeksten[lang].forum;
  const { draden, beschikbaar } = await haalDraden(onderwerp.id);

  return (
    <div className="forum">
      <nav className="kruimelpad" aria-label="Kruimelpad">
        <Link href={`/${lang}/forum`}>{t.titel}</Link>
      </nav>
      <div className="forum-kop">
        <div>
          <h1>{onderwerp.naam[lang]}</h1>
          <p className="intro">{onderwerp.uitleg[lang]}</p>
        </div>
        <Link href={`/${lang}/forum/nieuw?onderwerp=${onderwerp.id}`} className="knop knop-hoofd">
          {t.nieuweVraag}
        </Link>
      </div>
      {!beschikbaar && <p className="formulier-melding">{t.nogNietBeschikbaar}</p>}
      <Draadlijst taal={lang} draden={draden} toonOnderwerp={false} />
    </div>
  );
}
