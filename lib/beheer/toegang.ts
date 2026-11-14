import "server-only";
import { redirect } from "next/navigation";
import { isTaal, talen as alleTalen, type Taal } from "@/lib/site";
import { maakSessieClient } from "./supabase-sessie";

export type Rol = "lid" | "redacteur" | "moderator" | "beheerder";

export type Redacteur = {
  id: string;
  email: string;
  naam: string;
  rol: Rol;
  // Talen waarin deze persoon mag schrijven (beheerder: alle).
  talen: Taal[];
};

// Controleert bij elke beheerpagina en elke actie of de bezoeker
// (1) is ingelogd, (2) de tweede stap (2FA) heeft gedaan en
// (3) de rol redacteur of beheerder heeft. Zo niet: door naar de juiste stap.
// De database controleert dit zelf ook nog eens (supabase/003_beheer.sql).
export async function vereisRedacteur() {
  const supabase = await maakSessieClient();

  const { data: gebruikerData } = await supabase.auth.getUser();
  const gebruiker = gebruikerData.user;
  if (!gebruiker) redirect("/beheer/inloggen");

  const { data: niveau } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (niveau?.currentLevel !== "aal2") redirect("/beheer/2fa");

  const { data: profiel } = await supabase
    .from("profielen")
    .select("naam, rol, talen")
    .eq("id", gebruiker.id)
    .maybeSingle();

  const rol = (profiel?.rol ?? "lid") as Rol;
  if (rol !== "redacteur" && rol !== "beheerder") {
    redirect("/beheer/geen-toegang");
  }

  const talen: Taal[] =
    rol === "beheerder"
      ? [...alleTalen]
      : ((profiel?.talen ?? []) as string[]).filter(isTaal);

  const redacteur: Redacteur = {
    id: gebruiker.id,
    email: gebruiker.email ?? "",
    naam: profiel?.naam || gebruiker.email || "",
    rol,
    talen,
  };
  return { supabase, redacteur };
}

// Alleen de beheerder (W-ANA-50): bezoekersstatistieken.
export async function vereisBeheerder() {
  const resultaat = await vereisRedacteur();
  if (resultaat.redacteur.rol !== "beheerder") redirect("/beheer/geen-toegang");
  return resultaat;
}
