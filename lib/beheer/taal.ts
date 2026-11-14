import "server-only";
import { cookies, headers } from "next/headers";
import { isTaal, standaardTaal, taalCookie, talen, type Taal } from "@/lib/site";
import { beheerTaalCookie, beheerTeksten } from "./teksten";

// Taal van het beheerpaneel: de taal waarmee de beheerder binnenkwam
// (cookie "beheertaal", gezet via ?taal=…), anders de gekozen taal van de
// website, anders de taal van de browser, anders Nederlands (W-ADM-20).
export async function beheerTaal(): Promise<Taal> {
  const opslag = await cookies();
  const gekozen = opslag.get(beheerTaalCookie)?.value;
  if (isTaal(gekozen)) return gekozen;
  const site = opslag.get(taalCookie)?.value;
  if (isTaal(site)) return site;
  const voorkeur = (await headers()).get("accept-language") ?? "";
  for (const deel of voorkeur.split(",")) {
    const basis = deel.trim().split(";")[0].split("-")[0].toLowerCase();
    if ((talen as readonly string[]).includes(basis)) return basis as Taal;
  }
  return standaardTaal;
}

export async function beheerT() {
  const taal = await beheerTaal();
  return { taal, t: beheerTeksten[taal] };
}
