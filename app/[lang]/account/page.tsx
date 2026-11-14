import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import { NieuweHerstelcodesFormulier } from "@/components/Accountformulieren";
import Formulierknop from "@/components/Formulierknop";
import { aantalHerstelcodes } from "@/lib/herstelcodes";
import { accountPad } from "@/lib/paden";
import { isModerator, vereisVolledigIngelogd } from "@/lib/sessie";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";
import { logUit } from "./acties";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/account">;

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud {...props} />
    </Suspense>
  );
}

async function Inhoud({ params }: Props) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const t = ledenTeksten[lang];
  const sessie = await vereisVolledigIngelogd(lang, accountPad(lang, "overzicht"));
  const resterend = await aantalHerstelcodes(sessie.id);

  return (
    <Accountkader titel={t.accountTitel}>
      <dl className="gegevens">
        <dt>{t.gebruikersnaam}</dt>
        <dd>{sessie.gebruikersnaam}</dd>
        <dt>{t.email}</dt>
        <dd>{sessie.email}</dd>
        <dt>{t.rol}</dt>
        <dd>{t.rollen[sessie.rol]}</dd>
        <dt>{t.tweeFactorStatus}</dt>
        <dd>{t.aan}</dd>
        {resterend !== null && (
          <>
            <dt>{t.herstelcodesResterend}</dt>
            <dd>{resterend}</dd>
          </>
        )}
      </dl>

      <NieuweHerstelcodesFormulier taal={lang} />

      <p className="knoppenrij">
        <Link href={`/${lang}/forum`} className="knop knop-hoofd">
          {t.naarForum}
        </Link>
        {isModerator(sessie) && (
          <Link href={`/${lang}/forum/moderatie`} className="knop knop-licht">
            {t.naarModeratie}
          </Link>
        )}
        {(sessie.rol === "redacteur" || sessie.rol === "beheerder") && (
          <Link href={`/beheer?taal=${lang}`} className="knop knop-licht">
            {t.naarBeheer}
          </Link>
        )}
        <Link href={accountPad(lang, "nieuwWachtwoord")} className="knop knop-licht">
          {t.wachtwoordWijzigen}
        </Link>
      </p>

      <form action={logUit.bind(null, lang)}>
        <Formulierknop bezig={t.bezig} soort="licht">
          {t.uitloggen}
        </Formulierknop>
      </form>
    </Accountkader>
  );
}
