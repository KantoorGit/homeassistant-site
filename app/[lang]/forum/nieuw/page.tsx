import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import { NieuweDraadFormulier } from "@/components/Forumformulieren";
import { vereisVolledigIngelogd } from "@/lib/sessie";
import { isTaal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/forum/nieuw">;

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud {...props} />
    </Suspense>
  );
}

// Nieuwe vraag stellen: alleen voor leden die met 2FA zijn ingelogd (W-FOR-04).
async function Inhoud({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const { onderwerp } = await searchParams;
  await vereisVolledigIngelogd(lang, `/${lang}/forum/nieuw`);

  return (
    <Accountkader titel={ledenTeksten[lang].forum.nieuwTitel}>
      <NieuweDraadFormulier
        taal={lang}
        onderwerp={typeof onderwerp === "string" ? onderwerp : undefined}
      />
    </Accountkader>
  );
}
