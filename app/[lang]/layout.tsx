import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-slab";
import "../globals.css";
import Accountmenu from "@/components/Accountmenu";
import Categoriebalk from "@/components/Categoriebalk";
import Cookiebanner from "@/components/Cookiebanner";
import CookieInstellingenLink from "@/components/CookieInstellingenLink";
import Meting from "@/components/Meting";
import { haalCategorieen } from "@/lib/categorieen";
import { bannerTeksten } from "@/lib/meting/teksten";
import { haalActieveTalen } from "@/lib/talen-instelling";
import Taalkiezer from "@/components/Taalkiezer";
import {
  isTaal,
  siteAdres,
  siteNaam,
  taalCode,
  talen,
  teksten,
  zoekmachinesToelaten,
} from "@/lib/site";

export async function generateStaticParams() {
  return talen.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isTaal(lang)) return {};
  return {
    metadataBase: new URL(siteAdres),
    title: { default: siteNaam, template: `%s | ${siteNaam}` },
    description: teksten[lang].ondertitel,
    robots: zoekmachinesToelaten ? undefined : { index: false, follow: false },
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const t = teksten[lang];
  const [actieveTalen, categorieen] = await Promise.all([haalActieveTalen(), haalCategorieen()]);

  return (
    <html lang={taalCode[lang]}>
      <body>
        <header className="kop">
          <div className="inhoud kop-rij">
            <Link href={`/${lang}`} className="logo">
              {siteNaam}
            </Link>
            <div className="kop-rechts">
              <Suspense>
                <Taalkiezer taal={lang} actieveTalen={actieveTalen} categorieen={categorieen} />
              </Suspense>
              <Suspense>
                <Accountmenu taal={lang} />
              </Suspense>
            </div>
          </div>
        </header>
        <Suspense>
          <Categoriebalk taal={lang} categorieen={categorieen} />
        </Suspense>
        <main className="inhoud">{children}</main>
        <footer className="voet">
          <div className="inhoud">
            <p>{t.onafhankelijk}</p>
            <p className="voet-links">
              <Link href={`/${lang}/privacy`}>{bannerTeksten[lang].privacy}</Link>
              <CookieInstellingenLink tekst={bannerTeksten[lang].instellingen} />
            </p>
          </div>
        </footer>
        <Cookiebanner taal={lang} />
        <Suspense>
          <Meting taal={lang} categorieen={categorieen} />
        </Suspense>
      </body>
    </html>
  );
}
