import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-slab";
import "../globals.css";
import Categoriebalk from "@/components/Categoriebalk";
import Taalkiezer from "@/components/Taalkiezer";
import { isTaal, siteNaam, talen, teksten } from "@/lib/site";

export async function generateStaticParams() {
  return talen.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isTaal(lang)) return {};
  return {
    title: { default: siteNaam, template: `%s | ${siteNaam}` },
    description: teksten[lang].ondertitel,
  };
}

export default async function RootLayout({
  children,
  params,
}: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const t = teksten[lang];

  return (
    <html lang={lang}>
      <body>
        <header className="kop">
          <div className="inhoud kop-rij">
            <Link href={`/${lang}`} className="logo">
              {siteNaam}
            </Link>
            <Suspense>
              <Taalkiezer taal={lang} />
            </Suspense>
          </div>
        </header>
        <Suspense>
          <Categoriebalk taal={lang} />
        </Suspense>
        <main className="inhoud">{children}</main>
        <footer className="voet">
          <div className="inhoud">
            <p>{t.onafhankelijk}</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
