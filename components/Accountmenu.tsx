import Link from "next/link";
import { accountPad } from "@/lib/paden";
import { huidigeSessie } from "@/lib/sessie";
import type { Taal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

// Rechtsboven in de kop: inloggen, of de naam van de ingelogde gebruiker.
export default async function Accountmenu({ taal }: { taal: Taal }) {
  const t = ledenTeksten[taal];
  const sessie = await huidigeSessie();

  if (!sessie) {
    return (
      <nav className="accountmenu" aria-label={t.mijnAccount}>
        <Link href={accountPad(taal, "inloggen")}>{t.inloggen}</Link>
      </nav>
    );
  }
  return (
    <nav className="accountmenu" aria-label={t.mijnAccount}>
      <Link href={accountPad(taal, "overzicht")}>{sessie.gebruikersnaam}</Link>
    </nav>
  );
}
