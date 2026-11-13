import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { controleerArtikelen } from "@/lib/artikelen";
import { maakSupabaseClient, supabaseInstellingen } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Verbindingstest",
  robots: { index: false, follow: false },
};

type Uitkomst = {
  status: "goed" | "fout" | "let-op";
  titel: string;
  uitleg: string;
  detail?: string;
};

const statusTekst = { goed: "Goed", fout: "Fout", "let-op": "Let op" };

async function controleer(): Promise<Uitkomst[]> {
  const uitkomsten: Uitkomst[] = [];
  const { url, sleutel } = supabaseInstellingen();

  // 1. Staan de variabelen van de koppeling in deze omgeving?
  if (!url || !sleutel) {
    uitkomsten.push({
      status: "fout",
      titel: "Variabelen van Supabase",
      uitleg:
        "De site ziet de Supabase-variabelen niet. Controleer in Vercel of de database aan dit project is gekoppeld en publiceer daarna opnieuw.",
      detail: `URL: ${url ? "aanwezig" : "ontbreekt"}, openbare sleutel: ${sleutel ? "aanwezig" : "ontbreekt"}`,
    });
    return uitkomsten;
  }

  let projectRef = "onbekend";
  try {
    projectRef = new URL(url).hostname.split(".")[0];
  } catch {
    // Een ongeldige URL komt bij stap 2 als fout naar voren.
  }
  uitkomsten.push({
    status: "goed",
    titel: "Variabelen van Supabase",
    uitleg: "De URL en de openbare sleutel zijn aanwezig.",
    detail: `Supabase-project: ${projectRef}`,
  });

  // 2. Bereikt de site Supabase en wordt de sleutel geaccepteerd?
  try {
    const antwoord = await fetch(`${url}/auth/v1/settings`, {
      headers: { apikey: sleutel },
      cache: "no-store",
    });
    if (antwoord.ok) {
      uitkomsten.push({
        status: "goed",
        titel: "Verbinding met Supabase",
        uitleg: "Supabase is bereikbaar en accepteert de sleutel.",
      });
    } else {
      uitkomsten.push({
        status: "fout",
        titel: "Verbinding met Supabase",
        uitleg:
          "Supabase is bereikbaar, maar weigert de sleutel. De variabelen horen mogelijk bij een ander of verwijderd project.",
        detail: `Antwoordcode ${antwoord.status}`,
      });
      return uitkomsten;
    }
  } catch (fout) {
    uitkomsten.push({
      status: "fout",
      titel: "Verbinding met Supabase",
      uitleg: "Supabase is niet bereikbaar op het adres uit de variabelen.",
      detail: fout instanceof Error ? fout.message : String(fout),
    });
    return uitkomsten;
  }

  // 3. Kan de site een rij uit de database lezen?
  const supabase = maakSupabaseClient();
  const { data, error } = await supabase!
    .from("verbindingstest")
    .select("bericht")
    .limit(1);

  if (error) {
    const tabelOntbreekt = error.code === "PGRST205" || error.code === "42P01";
    uitkomsten.push({
      status: tabelOntbreekt ? "let-op" : "fout",
      titel: "Rij lezen uit de database",
      uitleg: tabelOntbreekt
        ? "De testtabel bestaat nog niet. Voer het bestand supabase/001_verbindingstest.sql uit in de SQL Editor van Supabase en laad deze pagina opnieuw."
        : "De database gaf een foutmelding bij het lezen van de testtabel.",
      detail: `${error.code ?? ""} ${error.message}`.trim(),
    });
  } else if (!data || data.length === 0) {
    uitkomsten.push({
      status: "let-op",
      titel: "Rij lezen uit de database",
      uitleg:
        "De testtabel bestaat, maar de site krijgt geen rij terug. De tabel is leeg of de toegangsregel ontbreekt. Voer supabase/001_verbindingstest.sql opnieuw uit.",
    });
  } else {
    uitkomsten.push({
      status: "goed",
      titel: "Rij lezen uit de database",
      uitleg: "De site heeft een rij uit de database gelezen.",
      detail: `Inhoud: ${data[0].bericht}`,
    });
  }

  // 4. Kan de site de artikelen lezen?
  const artikelen = await controleerArtikelen();
  if (artikelen.fout !== null) {
    const tabelOntbreekt =
      artikelen.code === "PGRST205" || artikelen.code === "42P01";
    uitkomsten.push({
      status: tabelOntbreekt ? "let-op" : "fout",
      titel: "Artikelen uit de database",
      uitleg: tabelOntbreekt
        ? "De tabellen voor artikelen bestaan nog niet. Voer supabase/002_artikelen.sql uit in de SQL Editor van Supabase. Tot die tijd toont de site de voorbeeldartikelen uit de code."
        : "De database gaf een foutmelding bij het lezen van de artikelen. De site toont zolang de voorbeeldartikelen uit de code.",
      detail: `${artikelen.code} ${artikelen.fout}`.trim(),
    });
  } else if (artikelen.aantal === 0) {
    uitkomsten.push({
      status: "let-op",
      titel: "Artikelen uit de database",
      uitleg:
        "De tabellen bestaan, maar er staan geen gepubliceerde artikelen in. De site toont zolang de voorbeeldartikelen uit de code.",
    });
  } else {
    uitkomsten.push({
      status: "goed",
      titel: "Artikelen uit de database",
      uitleg: "De site leest de artikelen uit de database.",
      detail: `Aantal gepubliceerde artikelen: ${artikelen.aantal}`,
    });
  }

  // 5. Accounts en forum: tabellen uit 003 en de geheime serversleutel.
  const forum = await supabase!.from("forum_draden").select("id").limit(1);
  if (forum.error) {
    const tabelOntbreekt =
      forum.error.code === "PGRST205" || forum.error.code === "42P01";
    uitkomsten.push({
      status: tabelOntbreekt ? "let-op" : "fout",
      titel: "Accounts en forum",
      uitleg: tabelOntbreekt
        ? "De tabellen voor accounts en forum bestaan nog niet. Voer supabase/004_accounts_en_forum.sql uit in de SQL Editor van Supabase."
        : "De database gaf een foutmelding bij het lezen van het forum.",
      detail: `${forum.error.code ?? ""} ${forum.error.message}`.trim(),
    });
  } else {
    uitkomsten.push({
      status: "goed",
      titel: "Accounts en forum",
      uitleg: "De tabellen voor accounts en forum bestaan.",
    });
  }

  const geheim =
    process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  uitkomsten.push(
    geheim
      ? {
          status: "goed",
          titel: "Geheime serversleutel",
          uitleg:
            "De geheime sleutel is aanwezig (nodig voor herstelcodes van 2FA). De waarde wordt nooit getoond.",
        }
      : {
          status: "let-op",
          titel: "Geheime serversleutel",
          uitleg:
            "SUPABASE_SECRET_KEY of SUPABASE_SERVICE_ROLE_KEY ontbreekt. Zonder deze sleutel werken herstelcodes voor 2FA niet.",
        },
  );

  return uitkomsten;
}

async function Uitkomsten() {
  // Deze controle draait bij elk bezoek opnieuw, niet tijdens het bouwen.
  await connection();
  const uitkomsten = await controleer();
  const regio = process.env.VERCEL_REGION;
  const omgeving = process.env.VERCEL_ENV;

  return (
    <>
      <ol>
        {uitkomsten.map((u) => (
          <li key={u.titel}>
            <span className={`status status-${u.status}`}>
              {statusTekst[u.status]}
            </span>
            <div>
              <h2>{u.titel}</h2>
              <p>{u.uitleg}</p>
              {u.detail && (
                <p>
                  <code>{u.detail}</code>
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      <p>
        Omgeving: <code>{omgeving ?? "lokaal"}</code>, regio van de
        Vercel-functie: <code>{regio ?? "onbekend"}</code> (verwacht:{" "}
        <code>fra1</code>, Frankfurt).
      </p>
    </>
  );
}

// Testpagina voor de koppeling tussen Vercel en Supabase. Toont nooit
// sleutels, alleen of ze aanwezig zijn. Niet opgenomen in zoekmachines.
export default function Verbindingstest() {
  return (
    <div className="test">
      <h1>Verbindingstest</h1>
      <p>Controleert in zes stappen of de site bij de database kan en of accounts en forum klaarstaan.</p>
      <Suspense fallback={<p>Bezig met controleren…</p>}>
        <Uitkomsten />
      </Suspense>
    </div>
  );
}
