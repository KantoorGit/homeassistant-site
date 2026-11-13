import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-slab";
import "../globals.css";
import "./beheer.css";
import { siteNaam } from "@/lib/site";

// Het beheerpaneel leest bij elk verzoek de inlogsessie en kan dus niet
// vooraf worden opgebouwd.
export const instant = false;

export const metadata: Metadata = {
  title: { default: `Beheer | ${siteNaam}`, template: `%s | Beheer` },
  robots: { index: false, follow: false },
};

export default function BeheerLayout({ children }: LayoutProps<"/beheer">) {
  return (
    <html lang="nl">
      <body className="beheer">
        <header className="beheer-kop">
          <div className="inhoud beheer-kop-rij">
            <Link href="/beheer" className="logo">
              {siteNaam} <span>Beheer</span>
            </Link>
            <Link href="/nl" className="beheer-naar-site">
              Naar de website
            </Link>
          </div>
        </header>
        <main className="inhoud beheer-inhoud">
          <Suspense fallback={<p className="beheer-laden">Laden…</p>}>
            {children}
          </Suspense>
        </main>
      </body>
    </html>
  );
}
