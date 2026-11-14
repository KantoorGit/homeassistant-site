import { maakSupabaseClient } from "@/lib/supabase";

// Dagelijkse ping naar de database (Vercel Cron, zie vercel.json: elke dag
// tussen 03:00 en 04:00 UTC). Supabase Free pauzeert een project na 7 dagen
// zonder activiteit; deze ping voorkomt dat, ook als de MacBook uit staat.
// Leest één rij en verandert niets.
//
// Staat CRON_SECRET in Vercel, dan stuurt Vercel die mee als
// "Authorization: Bearer <CRON_SECRET>" en weigert deze route andere
// verzoeken. Zonder CRON_SECRET werkt de ping ook; hij doet niets gevoeligs.

export async function GET(request: Request) {
  const geheim = process.env.CRON_SECRET;
  if (geheim && request.headers.get("authorization") !== `Bearer ${geheim}`) {
    return Response.json({ ok: false, fout: "Geen toegang." }, { status: 401 });
  }

  const supabase = maakSupabaseClient();
  if (!supabase) {
    return Response.json({ ok: false, fout: "Supabase-variabelen ontbreken." }, { status: 503 });
  }

  const begin = Date.now();
  const { error } = await supabase.from("artikelen").select("id").limit(1);
  const ms = Date.now() - begin;
  if (error) {
    console.error("Supabase-ping mislukt:", error.code, error.message);
    return Response.json({ ok: false, fout: error.message }, { status: 500 });
  }
  console.log(`Supabase-ping gelukt (${ms} ms)`);
  return Response.json(
    { ok: true, database: "bereikt", ms, tijd: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
