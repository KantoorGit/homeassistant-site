import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

// Filters en periode van het statistiekendashboard (W-ANA-52).

export const tabs = [
  { id: "overzicht", naam: "Overzicht" },
  { id: "realtime", naam: "Realtime" },
  { id: "acquisitie", naam: "Acquisitie" },
  { id: "doelgroep", naam: "Doelgroep" },
  { id: "gedrag", naam: "Gedrag" },
  { id: "doelen", naam: "Doelen" },
] as const;
export type Tab = (typeof tabs)[number]["id"];

export const perioden = [
  { id: "vandaag", naam: "Vandaag" },
  { id: "7", naam: "Laatste 7 dagen" },
  { id: "28", naam: "Laatste 28 dagen" },
  { id: "90", naam: "Laatste 90 dagen" },
  { id: "365", naam: "Laatste 12 maanden" },
] as const;

export type Filters = {
  tab: Tab;
  periode: string;
  taal: string;
  apparaat: string;
  kanaal: string;
  land: string;
  categorie: string;
  // Ook bezoeken van redactie en preview-adressen meetellen (W-ANA-60).
  alles: boolean;
};

function eerste(waarde: string | string[] | undefined): string {
  return (Array.isArray(waarde) ? waarde[0] : waarde) ?? "";
}

export function leesFilters(zoek: Record<string, string | string[] | undefined>): Filters {
  const tab = eerste(zoek.tab);
  const periode = eerste(zoek.periode);
  const schoon = (w: string) => w.replace(/[^\p{L}\p{N} _.-]/gu, "").slice(0, 40);
  return {
    tab: (tabs.some((t) => t.id === tab) ? tab : "overzicht") as Tab,
    periode: perioden.some((p) => p.id === periode) ? periode : "28",
    taal: schoon(eerste(zoek.taal)),
    apparaat: schoon(eerste(zoek.apparaat)),
    kanaal: schoon(eerste(zoek.kanaal)),
    land: schoon(eerste(zoek.land)).toUpperCase().slice(0, 2),
    categorie: schoon(eerste(zoek.categorie)),
    alles: eerste(zoek.alles) === "1",
  };
}

export function zoekdeel(f: Filters, extra: Record<string, string> = {}): string {
  const p = new URLSearchParams();
  p.set("tab", f.tab);
  p.set("periode", f.periode);
  for (const k of ["taal", "apparaat", "kanaal", "land", "categorie"] as const) {
    if (f[k]) p.set(k, f[k]);
  }
  if (f.alles) p.set("alles", "1");
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  return p.toString();
}

// Begin en eind van de periode. "Vandaag" begint om middernacht in Nederland.
export function periodeVan(periode: string): { van: Date; tot: Date } {
  const tot = new Date();
  if (periode === "vandaag") {
    const dag = tot.toLocaleDateString("sv-SE", { timeZone: "Europe/Amsterdam" });
    // Middernacht Amsterdam: probeer +01:00 en +02:00 (winter/zomer).
    for (const offset of ["+01:00", "+02:00"]) {
      const van = new Date(`${dag}T00:00:00${offset}`);
      const terug = van.toLocaleString("sv-SE", { timeZone: "Europe/Amsterdam" });
      if (terug.startsWith(`${dag} 00:00`)) return { van, tot };
    }
    return { van: new Date(`${dag}T00:00:00+01:00`), tot };
  }
  const dagen = Number(periode) || 28;
  return { van: new Date(tot.getTime() - dagen * 86_400_000), tot };
}

export type Rij = Record<string, string | number | boolean | null>;
export type Rapport = Record<string, Rij[] | Rij> & {
  overzicht?: Rij;
  vorige?: Rij;
  trechter?: Rij;
};

export async function haalRapport(
  supabase: SupabaseClient,
  f: Filters,
): Promise<{ rapport: Rapport | null; fout: string | null }> {
  const { van, tot } = periodeVan(f.periode);
  const { data, error } = await supabase.rpc("meting_rapport", {
    p_van: van.toISOString(),
    p_tot: tot.toISOString(),
    p_filters: {
      taal: f.taal,
      apparaat: f.apparaat,
      kanaal: f.kanaal,
      land: f.land,
      categorie: f.categorie,
    },
    p_alles: f.alles,
  });
  if (error) return { rapport: null, fout: error.message };
  return { rapport: data as Rapport, fout: null };
}

export async function haalRealtime(
  supabase: SupabaseClient,
  alles: boolean,
): Promise<{ rapport: Rapport | null; fout: string | null }> {
  const { data, error } = await supabase.rpc("meting_realtime", { p_alles: alles });
  if (error) return { rapport: null, fout: error.message };
  return { rapport: data as Rapport, fout: null };
}

// CSV met puntkomma's (opent goed in Nederlandse Excel), met BOM voor de tekens.
export function naarCsv(rijen: Rij[]): string {
  if (rijen.length === 0) return "﻿";
  const kolommen = Object.keys(rijen[0]);
  const cel = (w: unknown) => {
    const t = w === null || w === undefined ? "" : String(w);
    return /[";\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  return (
    "﻿" +
    [kolommen.join(";"), ...rijen.map((r) => kolommen.map((k) => cel(r[k])).join(";"))].join("\r\n")
  );
}
