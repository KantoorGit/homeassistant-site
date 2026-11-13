import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import { RegistreerFormulier } from "@/components/Accountformulieren";
import { accountPad } from "@/lib/paden";
import { huidigeSessie } from "@/lib/sessie";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/account/register">;

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
  if (await huidigeSessie()) redirect(accountPad(lang, "overzicht"));
  return (
    <Accountkader titel={ledenTeksten[lang].registrerenTitel}>
      <RegistreerFormulier taal={lang} />
    </Accountkader>
  );
}
