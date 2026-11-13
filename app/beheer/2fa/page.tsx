import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { maakSessieClient } from "@/lib/beheer/supabase-sessie";
import { uitloggen } from "../acties";
import { Codeformulier, Koppelen } from "./Formulieren";

export const metadata: Metadata = { title: "Tweestapsverificatie" };

export default async function TweeFactorPagina() {
  const supabase = await maakSessieClient();
  const { data: gebruikerData } = await supabase.auth.getUser();
  if (!gebruikerData.user) redirect("/beheer/inloggen");

  const { data: niveau } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (niveau?.currentLevel === "aal2") redirect("/beheer");

  const { data: factoren } = await supabase.auth.mfa.listFactors();
  const heeftApp = (factoren?.totp ?? []).length > 0;

  return (
    <section className="beheer-smal">
      <h1>Tweestapsverificatie</h1>
      {heeftApp ? (
        <>
          <p>Vul de code van 6 cijfers in die je authenticator-app nu toont.</p>
          <Codeformulier />
        </>
      ) : (
        <>
          <p>
            Voor het beheerpaneel is tweestapsverificatie verplicht. Koppel
            eenmalig een authenticator-app, zoals Microsoft Authenticator,
            Google Authenticator of 1Password.
          </p>
          <Koppelen />
        </>
      )}
      <form action={uitloggen}>
        <button type="submit" className="knop-link">
          Uitloggen ({gebruikerData.user.email})
        </button>
      </form>
    </section>
  );
}
