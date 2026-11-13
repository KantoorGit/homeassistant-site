import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Accountkader from "@/components/Accountkader";
import { WachtwoordVergetenFormulier } from "@/components/Accountformulieren";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function Pagina({
  params,
}: PageProps<"/[lang]/account/forgot-password">) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  return (
    <Accountkader titel={ledenTeksten[lang].wachtwoordVergetenTitel}>
      <WachtwoordVergetenFormulier taal={lang} />
    </Accountkader>
  );
}
