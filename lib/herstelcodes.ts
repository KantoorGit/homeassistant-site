import "server-only";
import { createHash, randomInt } from "node:crypto";
import { maakBeheerClient } from "./supabase-server";

// Herstelcodes voor als de telefoon met de authenticator-app kwijt is
// (W-ACC-04). Tien codes van 10 tekens (ongeveer 50 bits toeval per code).
// Alleen een hash wordt opgeslagen; de codes zelf ziet de gebruiker één keer.

const tekens = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // zonder 0/O en 1/I
const aantal = 10;

function maakCode(): string {
  let code = "";
  for (let i = 0; i < 10; i++) code += tekens[randomInt(tekens.length)];
  return `${code.slice(0, 5)}-${code.slice(5)}`;
}

function normaliseer(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function hash(gebruikerId: string, code: string): string {
  return createHash("sha256")
    .update(`${gebruikerId}:${normaliseer(code)}`)
    .digest("hex");
}

// Maakt een nieuwe set codes; oude codes vervallen. Geeft null als de
// geheime serversleutel ontbreekt.
export async function maakHerstelcodes(gebruikerId: string): Promise<string[] | null> {
  const beheer = maakBeheerClient();
  if (!beheer) return null;
  const codes = Array.from({ length: aantal }, maakCode);

  const { error: wisFout } = await beheer
    .from("herstelcodes")
    .delete()
    .eq("gebruiker_id", gebruikerId);
  if (wisFout) {
    console.error("Herstelcodes wissen mislukt:", wisFout.message);
    return null;
  }
  const { error } = await beheer.from("herstelcodes").insert(
    codes.map((c) => ({ gebruiker_id: gebruikerId, code_hash: hash(gebruikerId, c) })),
  );
  if (error) {
    console.error("Herstelcodes opslaan mislukt:", error.message);
    return null;
  }
  return codes;
}

export async function aantalHerstelcodes(gebruikerId: string): Promise<number | null> {
  const beheer = maakBeheerClient();
  if (!beheer) return null;
  const { count, error } = await beheer
    .from("herstelcodes")
    .select("id", { count: "exact", head: true })
    .eq("gebruiker_id", gebruikerId)
    .is("gebruikt_op", null);
  return error ? null : (count ?? 0);
}

export type HerstelUitkomst = "gelukt" | "onjuist" | "te-vaak" | "geen-sleutel";

// Controleert een herstelcode. Bij een juiste code wordt de authenticator-app
// ontkoppeld (de gebruiker koppelt daarna een nieuwe) en vervallen alle codes.
// Maximaal 5 mislukte pogingen per uur.
export async function gebruikHerstelcode(
  gebruikerId: string,
  code: string,
): Promise<HerstelUitkomst> {
  const beheer = maakBeheerClient();
  if (!beheer) return "geen-sleutel";

  const uurGeleden = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: mislukt } = await beheer
    .from("herstel_pogingen")
    .select("id", { count: "exact", head: true })
    .eq("gebruiker_id", gebruikerId)
    .eq("gelukt", false)
    .gte("tijd", uurGeleden);
  if ((mislukt ?? 0) >= 5) return "te-vaak";

  const { data: gevonden } = await beheer
    .from("herstelcodes")
    .select("id")
    .eq("gebruiker_id", gebruikerId)
    .eq("code_hash", hash(gebruikerId, code))
    .is("gebruikt_op", null)
    .maybeSingle<{ id: number }>();

  await beheer
    .from("herstel_pogingen")
    .insert({ gebruiker_id: gebruikerId, gelukt: Boolean(gevonden) });
  if (!gevonden) return "onjuist";

  // Alle factoren van het type TOTP verwijderen. Supabase logt de gebruiker
  // daarbij overal uit.
  const { data: factoren } = await beheer.auth.admin.mfa.listFactors({
    userId: gebruikerId,
  });
  for (const factor of factoren?.factors ?? []) {
    if (factor.factor_type === "totp") {
      await beheer.auth.admin.mfa.deleteFactor({ id: factor.id, userId: gebruikerId });
    }
  }
  await beheer.from("herstelcodes").delete().eq("gebruiker_id", gebruikerId);
  return "gelukt";
}
