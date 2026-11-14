import type { Metadata } from "next";
import { beheerT } from "@/lib/beheer/taal";
import Inlogformulier from "./Inlogformulier";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await beheerT();
  return { title: t.inloggen.titel };
}

export default async function Inlogpagina() {
  const { t } = await beheerT();
  return (
    <section className="beheer-smal">
      <h1>{t.inloggen.titel}</h1>
      <p>{t.inloggen.uitleg}</p>
      <Inlogformulier t={t.inloggen} bezigTekst={t.algemeen.bezig} />
    </section>
  );
}
