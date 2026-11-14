import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import "@fontsource-variable/roboto";
import "@fontsource-variable/roboto-slab";
import "../globals.css";
import "./beheer.css";
import { beheerT } from "@/lib/beheer/taal";
import { siteNaam, taalCode } from "@/lib/site";
import BeheerTaalkiezer from "./BeheerTaalkiezer";

// Het beheerpaneel leest bij elk verzoek de inlogsessie en kan dus niet
// vooraf worden opgebouwd.
export const instant = false;

export const metadata: Metadata = {
  title: { default: `Beheer | ${siteNaam}`, template: `%s | ${siteNaam}` },
  robots: { index: false, follow: false },
};

// Kop en inhoud in de taal van het beheerpaneel (W-ADM-20). De taal komt uit
// een cookie, dus dit deel wordt per verzoek opgebouwd.
async function Paneel({ children }: { children: React.ReactNode }) {
  const { taal, t } = await beheerT();
  return (
    <div lang={taalCode[taal]}>
      <header className="beheer-kop">
        <div className="inhoud beheer-kop-rij">
          <Link href="/beheer" className="logo">
            {siteNaam} <span>{t.algemeen.beheer}</span>
          </Link>
          <div className="beheer-kop-rechts">
            <BeheerTaalkiezer taal={taal} label={t.algemeen.taalPaneel} />
            <Link href={`/${taal}`} className="beheer-naar-site">
              {t.algemeen.naarWebsite}
            </Link>
          </div>
        </div>
      </header>
      <main className="inhoud beheer-inhoud">
        <Suspense fallback={<p className="beheer-laden">{t.algemeen.laden}</p>}>{children}</Suspense>
      </main>
    </div>
  );
}

export default function BeheerLayout({ children }: LayoutProps<"/beheer">) {
  return (
    <html lang="nl">
      <body className="beheer">
        <Suspense fallback={<p className="beheer-laden inhoud">…</p>}>
          <Paneel>{children}</Paneel>
        </Suspense>
      </body>
    </html>
  );
}
