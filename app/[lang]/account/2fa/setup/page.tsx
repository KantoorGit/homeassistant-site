import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import { Instellen2faFormulier } from "@/components/Accountformulieren";
import { accountPad, veiligPad } from "@/lib/paden";
import { huidigeSessie } from "@/lib/sessie";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/account/2fa/setup">;

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud {...props} />
    </Suspense>
  );
}

// Verplichte koppeling van een authenticator-app (W-ACC-02, -03, -04).
async function Inhoud({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const volgende = veiligPad((await searchParams).volgende, accountPad(lang, "overzicht"));

  const sessie = await huidigeSessie();
  if (!sessie) redirect(accountPad(lang, "inloggen", volgende));
  if (sessie.heeft2fa) {
    redirect(sessie.aal === "aal2" ? volgende : accountPad(lang, "tweeFactor", volgende));
  }

  return (
    <Accountkader titel={ledenTeksten[lang].instellenTitel}>
      <Instellen2faFormulier taal={lang} volgende={volgende} />
    </Accountkader>
  );
}
