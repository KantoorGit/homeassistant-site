import { maakBeheerClient } from "@/lib/supabase-server";
import { beschermCode } from "@/lib/vertalen/codes";
import { json, tokenKlopt, vertaalInstructies } from "@/lib/vertalen/server";

// Vertaalwachtrij voor de Claude-app (besluit B-15). Geeft taken die klaar
// staan en zet ze op 'bezig'. Alleen met de geheime code VERTAAL_TOKEN.
//   GET /api/vertalen/wachtrij?max=10
//   Header: Authorization: Bearer <VERTAAL_TOKEN>

type Taak = {
  id: number;
  soort: "artikel" | "forum";
  bron_taal: string;
  doel_taal: string;
  context: string;
  velden: Record<string, string | null>;
};

export async function GET(request: Request) {
  const controle = tokenKlopt(request);
  if (controle === "ontbreekt") return json({ fout: "VERTAAL_TOKEN ontbreekt in Vercel." }, 503);
  if (controle === "fout") return json({ fout: "Geen toegang." }, 401);

  const db = maakBeheerClient();
  if (!db) return json({ fout: "De geheime serversleutel van Supabase ontbreekt." }, 503);

  const max = Number(new URL(request.url).searchParams.get("max")) || 10;
  const { data, error } = await db.rpc("vertaal_ophalen", { p_max: max });
  if (error) return json({ fout: `Wachtrij ophalen mislukt: ${error.message}` }, 500);

  const taken = ((data ?? []) as Taak[]).map((t) => ({
    ...t,
    velden: Object.fromEntries(
      Object.entries(t.velden).map(([k, v]) => [k, beschermCode(v ?? "").tekst]),
    ),
  }));
  return json({ instructies: vertaalInstructies, aantal: taken.length, taken });
}
