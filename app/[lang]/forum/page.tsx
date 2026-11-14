import { zelfdePadAlternatieven } from "@/lib/hreflang";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Draadlijst from "@/components/Draadlijst";
import { onderwerpen, onderwerpPad } from "@/lib/forum";
import { haalDraden } from "@/lib/forum-gegevens";
import { isTaal, talen } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export async function generateStaticParams() {
  return talen.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/forum">): Promise<Metadata> {
  const { lang } = await params;
  if (!isTaal(lang)) return {};
  const t = ledenTeksten[lang].forum;
  return {
    title: t.titel,
    description: t.intro,
    alternates: zelfdePadAlternatieven(lang, "/forum"),
  };
}

// Voorpagina van het forum: onderwerpen en de recentste discussies.
export default async function Forumpagina({ params }: PageProps<"/[lang]/forum">) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const t = ledenTeksten[lang].forum;
  const { draden, beschikbaar } = await haalDraden(null);

  return (
    <div className="forum">
      <div className="forum-kop">
        <div>
          <h1>{t.titel}</h1>
          <p className="intro">{t.intro}</p>
        </div>
        <Link href={`/${lang}/forum/nieuw`} className="knop knop-hoofd">
          {t.nieuweVraag}
        </Link>
      </div>

      {!beschikbaar && <p className="formulier-melding">{t.nogNietBeschikbaar}</p>}

      <div className="forum-indeling">
        <section aria-labelledby="recent">
          <h2 id="recent">{t.recent}</h2>
          <Draadlijst taal={lang} draden={draden.slice(0, 20)} toonOnderwerp />
        </section>
        <aside className="zijkolom" aria-labelledby="onderwerpen">
          <h2 id="onderwerpen">{t.onderwerpen}</h2>
          <ul className="onderwerplijst">
            {onderwerpen.map((o) => (
              <li key={o.id}>
                <Link href={onderwerpPad(o, lang)}>{o.naam[lang]}</Link>
                <span>{o.uitleg[lang]}</span>
              </li>
            ))}
          </ul>
          <p>
            <Link href={`/${lang}/forum/regels`}>{t.regelsLink}</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
