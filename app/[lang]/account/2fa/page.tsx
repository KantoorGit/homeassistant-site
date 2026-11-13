import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import { TweeFactorFormulier } from "@/components/Accountformulieren";
import { accountPad, veiligPad } from "@/lib/paden";
import { huidigeSessie } from "@/lib/sessie";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/account/2fa">;

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud {...props} />
    </Suspense>
  );
}

// Tweede stap van het inloggen: de code uit de authenticator-app.
async function Inhoud({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const volgende = veiligPad((await searchParams).volgende, accountPad(lang, "overzicht"));

  const sessie = await huidigeSessie();
  if (!sessie) redirect(accountPad(lang, "inloggen", volgende));
  if (!sessie.heeft2fa) redirect(accountPad(lang, "tweeFactorInstellen", volgende));
  if (sessie.aal === "aal2") redirect(volgende);

  return (
    <Accountkader titel={ledenTeksten[lang].tweeFactorTitel}>
      <TweeFactorFormulier taal={lang} volgende={volgende} />
    </Accountkader>
  );
}
