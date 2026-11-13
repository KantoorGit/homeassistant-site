import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import { NieuwWachtwoordFormulier } from "@/components/Accountformulieren";
import { accountPad } from "@/lib/paden";
import { vereisVolledigIngelogd } from "@/lib/sessie";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/account/new-password">;

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud {...props} />
    </Suspense>
  );
}

// Ook na de link uit "wachtwoord vergeten": eerst de code uit de app.
async function Inhoud({ params }: Props) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  await vereisVolledigIngelogd(lang, accountPad(lang, "nieuwWachtwoord"));
  return (
    <Accountkader titel={ledenTeksten[lang].nieuwWachtwoordTitel}>
      <NieuwWachtwoordFormulier taal={lang} />
    </Accountkader>
  );
}
