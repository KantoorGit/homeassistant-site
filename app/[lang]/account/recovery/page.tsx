import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import { HerstelcodeFormulier } from "@/components/Accountformulieren";
import { accountPad } from "@/lib/paden";
import { huidigeSessie } from "@/lib/sessie";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/account/recovery">;

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud {...props} />
    </Suspense>
  );
}

// Na stap 1 van het inloggen (wachtwoord), als de app niet beschikbaar is.
async function Inhoud({ params }: Props) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const sessie = await huidigeSessie();
  if (!sessie) redirect(accountPad(lang, "inloggen"));
  if (!sessie.heeft2fa) redirect(accountPad(lang, "tweeFactorInstellen"));
  if (sessie.aal === "aal2") redirect(accountPad(lang, "overzicht"));

  return (
    <Accountkader titel={ledenTeksten[lang].herstelcodeTitel}>
      <HerstelcodeFormulier taal={lang} />
    </Accountkader>
  );
}
