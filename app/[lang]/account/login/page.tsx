import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import { InlogFormulier } from "@/components/Accountformulieren";
import { accountPad, veiligPad } from "@/lib/paden";
import { huidigeSessie } from "@/lib/sessie";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/account/login">;

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud {...props} />
    </Suspense>
  );
}

async function Inhoud({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const t = ledenTeksten[lang];
  const zoek = await searchParams;
  const volgende = veiligPad(zoek.volgende, accountPad(lang, "overzicht"));
  const melding = typeof zoek.melding === "string" ? t.meldingen[zoek.melding] : undefined;

  const sessie = await huidigeSessie();
  if (sessie?.aal === "aal2") redirect(volgende);

  return (
    <Accountkader titel={t.inloggenTitel}>
      {melding && <p className="formulier-melding">{melding}</p>}
      <InlogFormulier taal={lang} volgende={volgende} />
    </Accountkader>
  );
}
