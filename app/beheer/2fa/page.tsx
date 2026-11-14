import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { maakSessieClient } from "@/lib/beheer/supabase-sessie";
import { beheerT } from "@/lib/beheer/taal";
import { vul } from "@/lib/beheer/teksten";
import { uitloggen } from "../acties";
import { Codeformulier, Koppelen } from "./Formulieren";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await beheerT();
  return { title: t.tweefa.titel };
}

export default async function TweeFactorPagina() {
  const { t } = await beheerT();
  const supabase = await maakSessieClient();
  const { data: gebruikerData } = await supabase.auth.getUser();
  if (!gebruikerData.user) redirect("/beheer/inloggen");

  const { data: niveau } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (niveau?.currentLevel === "aal2") redirect("/beheer");

  const { data: factoren } = await supabase.auth.mfa.listFactors();
  const heeftApp = (factoren?.totp ?? []).length > 0;

  return (
    <section className="beheer-smal">
      <h1>{t.tweefa.titel}</h1>
      {heeftApp ? (
        <>
          <p>{t.tweefa.codeInvullen}</p>
          <Codeformulier t={t.tweefa} bezigTekst={t.algemeen.bezig} />
        </>
      ) : (
        <>
          <p>{t.tweefa.verplicht}</p>
          <Koppelen t={t.tweefa} bezigTekst={t.algemeen.bezig} />
        </>
      )}
      <form action={uitloggen}>
        <button type="submit" className="knop-link">
          {vul(t.algemeen.uitloggenMet, { email: gebruikerData.user.email ?? "" })}
        </button>
      </form>
    </section>
  );
}
