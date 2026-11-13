import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import { accountPad } from "./paden";
import type { Taal } from "./site";
import { maakServerClient } from "./supabase-server";

export type Rol = "lid" | "redacteur" | "moderator" | "beheerder";

export type Sessie = {
  id: string;
  email: string;
  gebruikersnaam: string;
  rol: Rol;
  // aal1 = alleen wachtwoord, aal2 = wachtwoord én authenticator-app.
  aal: "aal1" | "aal2";
  heeft2fa: boolean;
  totpFactorId: string | null;
};

// Leest de ingelogde gebruiker. getUser() vraagt de gegevens rechtstreeks
// op bij Supabase (niet uit de cookie), getClaims() controleert het token.
// Binnen één verzoek wordt dit maar één keer gedaan.
export const huidigeSessie = cache(async (): Promise<Sessie | null> => {
  const supabase = await maakServerClient();
  if (!supabase) return null;

  const { data: gebruiker } = await supabase.auth.getUser();
  const user = gebruiker.user;
  if (!user) return null;

  const { data: claimData } = await supabase.auth.getClaims();
  const aal = claimData?.claims?.aal === "aal2" ? "aal2" : "aal1";

  const totp = (user.factors ?? []).find(
    (f) => f.factor_type === "totp" && f.status === "verified",
  );

  const { data: profiel } = await supabase
    .from("profielen")
    .select("gebruikersnaam, rol")
    .eq("id", user.id)
    .maybeSingle<{ gebruikersnaam: string; rol: Rol }>();

  return {
    id: user.id,
    email: user.email ?? "",
    gebruikersnaam: profiel?.gebruikersnaam ?? (user.email ?? "").split("@")[0],
    rol: profiel?.rol ?? "lid",
    aal,
    heeft2fa: Boolean(totp),
    totpFactorId: totp?.id ?? null,
  };
});

// Voor pagina's en acties die een volledig ingelogd lid vereisen:
// ingelogd, 2FA ingesteld én in deze sessie met 2FA bevestigd.
export async function vereisVolledigIngelogd(
  taal: Taal,
  volgende: string,
): Promise<Sessie> {
  const sessie = await huidigeSessie();
  if (!sessie) redirect(accountPad(taal, "inloggen", volgende));
  if (!sessie.heeft2fa) redirect(accountPad(taal, "tweeFactorInstellen", volgende));
  if (sessie.aal !== "aal2") redirect(accountPad(taal, "tweeFactor", volgende));
  return sessie;
}

export function isModerator(sessie: Sessie | null): boolean {
  return sessie?.rol === "moderator" || sessie?.rol === "beheerder";
}
