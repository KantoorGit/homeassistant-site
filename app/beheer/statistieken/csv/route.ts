import { alleArtikelen, kopVan } from "@/lib/beheer/artikelen";
import { haalRapport, haalRealtime, leesFilters, naarCsv, type Rij } from "@/lib/beheer/statistieken";
import { beheerT } from "@/lib/beheer/taal";
import { vereisBeheerder } from "@/lib/beheer/toegang";
import { maakSecties, vertaalWaarde } from "../secties";

// Download van één rapport als CSV (W-ANA-52), met dezelfde filters als het
// dashboard. Alleen voor de beheerder met 2FA.
export async function GET(request: Request) {
  const { supabase } = await vereisBeheerder();
  const { taal, t } = await beheerT();
  const secties = maakSecties(t);
  const zoek = Object.fromEntries(new URL(request.url).searchParams);
  const f = leesFilters(zoek);
  const sectie = zoek.sectie ?? "";
  const s = secties[sectie];

  const { rapport, fout } =
    f.tab === "realtime" ? await haalRealtime(supabase, f.alles) : await haalRapport(supabase, f);
  if (fout || !rapport) return new Response(fout ?? t.stat.geenGegevens, { status: 500 });

  let rijen = (rapport[sectie] as Rij[] | undefined) ?? [];
  if (sectie === "artikelen") {
    const { artikelen } = await alleArtikelen(supabase);
    const koppen = new Map(artikelen.map((a) => [a.id, kopVan(a, taal, t.overzicht.zonderKop)]));
    rijen = rijen.map((r) => ({ ...r, kop: koppen.get(String(r.id)) ?? "" }));
  }
  if (["kanalen", "apparaten", "nieuw_terugkerend"].includes(sectie)) {
    rijen = rijen.map((r) => ({ ...r, naam: vertaalWaarde(t, r.naam) }));
  }
  // Kolommen in de volgorde en met de namen van het dashboard.
  if (s) {
    rijen = rijen.map((r) =>
      Object.fromEntries(s.kolommen.map((k) => [k.label, r[k.sleutel] ?? null])),
    );
  }

  const naam = `statistieken-${sectie || "rapport"}-${f.periode}-${new Date().toISOString().slice(0, 10)}.csv`;
  return new Response(naarCsv(rijen), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${naam}"`,
      "Cache-Control": "no-store",
    },
  });
}
