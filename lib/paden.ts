import { isTaal, standaardTaal, type Taal } from "./site";

// Een adres om na het inloggen naartoe te gaan. Alleen paden binnen deze
// site zijn toegestaan, zodat een link nooit naar een andere site kan
// doorsturen (bescherming tegen "open redirect").
export function veiligPad(waarde: unknown, standaard: string): string {
  if (typeof waarde !== "string") return standaard;
  if (!waarde.startsWith("/") || waarde.startsWith("//")) return standaard;
  if (/[\\\u0000-\u001f]/.test(waarde)) return standaard;
  if (waarde.length > 500) return standaard;
  return waarde;
}

export function taalUitPad(pad: string): Taal {
  const eerste = pad.split("/")[1] ?? "";
  return isTaal(eerste) ? eerste : standaardTaal;
}

export const accountPaden = {
  overzicht: "/account",
  inloggen: "/account/login",
  registreren: "/account/register",
  tweeFactor: "/account/2fa",
  tweeFactorInstellen: "/account/2fa/setup",
  herstelcode: "/account/recovery",
  wachtwoordVergeten: "/account/forgot-password",
  nieuwWachtwoord: "/account/new-password",
} as const;

export function accountPad(
  taal: Taal,
  welk: keyof typeof accountPaden,
  volgende?: string,
): string {
  const pad = `/${taal}${accountPaden[welk]}`;
  return volgende ? `${pad}?volgende=${encodeURIComponent(volgende)}` : pad;
}
