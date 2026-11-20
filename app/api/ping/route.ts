import { bearerKlopt } from "@/lib/geheim";
import { maakSupabaseClient } from "@/lib/supabase";

// Dagelijkse ping naar de database (Vercel Cron, zie vercel.json: elke dag
// tussen 03:00 en 04:00 UTC). Supabase Free pauzeert een project na 7 dagen
// zonder activiteit; deze ping voorkomt dat, ook als de MacBook uit staat.
// Leest één rij en verandert niets.
//
// Sinds beveiligingsronde 1 (W-SEC-18) is CRON_SECRET verplicht. Vercel stuurt
// die automatisch mee als "Authorization: Bearer <CRON_SECRET>"; andere
// verzoeken worden geweigerd. Zonder CRON_SECRET in Vercel doet de ping niets
// en staat er een foutmelding in de logboeken.

const geenCache = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const geheim = process.env.CRON_SECRET?.trim();
  if (!geheim) {
    console.error("Supabase-ping geweigerd: CRON_SECRET ontbreekt in de instellingen van Vercel.");
    return Response.json({ ok: false, fout: "Niet ingesteld." }, { status: 503, headers: geenCache });
  }
  if (!bearerKlopt(request, geheim)) {
    return Response.json({ ok: false, fout: "Geen toegang." }, { status: 401, headers: geenCache });
  }

  const supabase = maakSupabaseClient();
  if (!supabase) {
    console.error("Supabase-ping mislukt: Supabase-variabelen ontbreken.");
    return Response.json({ ok: false, fout: "Database niet bereikt." }, { status: 503, headers: geenCache });
  }

  const begin = Date.now();
  const { error } = await supabase.from("artikelen").select("id").limit(1);
  const ms = Date.now() - begin;
  if (error) {
    // Details alleen in het logboek, niet in het antwoord (W-SEC-17).
    console.error("Supabase-ping mislukt:", error.code, error.message);
    return Response.json({ ok: false, fout: "Database niet bereikt." }, { status: 500, headers: geenCache });
  }
  console.log(`Supabase-ping gelukt (${ms} ms)`);
  return Response.json(
    { ok: true, database: "bereikt", ms, tijd: new Date().toISOString() },
    { headers: geenCache },
  );
}
