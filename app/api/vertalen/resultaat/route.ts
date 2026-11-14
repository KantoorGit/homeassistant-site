import { revalidateTag } from "next/cache";
import { slugVan } from "@/lib/forum";
import { maakBeheerClient } from "@/lib/supabase-server";
import { beschermCode, herstelCode } from "@/lib/vertalen/codes";
import { json, tokenKlopt } from "@/lib/vertalen/server";

// Ontvangt vertalingen van de Claude-app.
//   POST /api/vertalen/resultaat
//   Header: Authorization: Bearer <VERTAAL_TOKEN>
//   Body: { "resultaten": [ { "id": 12, "velden": { … } } | { "id": 13, "fout": "…" } ] }
// Ook één resultaat zonder lijst ({ "id": …, "velden": … }) mag.

type Bron = {
  id: number;
  soort: "artikel" | "forum";
  status: string;
  gewijzigd: boolean;
  velden: Record<string, string | null>;
};

type Resultaat = { id?: unknown; velden?: unknown; fout?: unknown };

async function verwerk(
  db: NonNullable<ReturnType<typeof maakBeheerClient>>,
  r: Resultaat,
): Promise<{ id: unknown; uitkomst: string }> {
  const id = Number(r.id);
  if (!Number.isSafeInteger(id) || id <= 0) return { id: r.id, uitkomst: "ongeldig id" };

  const { data: bronData, error } = await db.rpc("vertaal_bron", { p_taak: id });
  const bron = bronData as Bron | null;
  if (error || !bron?.id) return { id, uitkomst: "onbekende taak" };
  if (bron.status !== "bezig") return { id, uitkomst: `taak staat op ${bron.status}` };

  const afronden = async (status: "wachtend" | "mislukt", fout: string) => {
    await db.rpc("vertaal_afronden", { p_taak: id, p_status: status, p_fout: fout });
    return { id, uitkomst: status === "wachtend" ? "terug in de wachtrij" : `mislukt: ${fout}` };
  };

  if (typeof r.fout === "string" && r.fout) return afronden("mislukt", `Vertaler: ${r.fout.slice(0, 300)}`);
  // Het origineel is na het ophalen bewerkt: opnieuw vertalen.
  if (bron.gewijzigd) return afronden("wachtend", "Het origineel is intussen gewijzigd.");

  const velden = (r.velden && typeof r.velden === "object" ? r.velden : {}) as Record<string, unknown>;
  const uit: Record<string, string> = {};
  for (const [naam, origineel] of Object.entries(bron.velden)) {
    const bronTekst = origineel ?? "";
    const vertaald = velden[naam];
    if (!bronTekst.trim()) {
      uit[naam] = "";
      continue;
    }
    if (typeof vertaald !== "string" || !vertaald.trim()) {
      return afronden("mislukt", `Het veld "${naam}" ontbreekt in de vertaling.`);
    }
    if (vertaald.length > bronTekst.length * 4 + 500) {
      return afronden("mislukt", `Het veld "${naam}" is onverwacht lang.`);
    }
    const { codes } = beschermCode(bronTekst);
    const hersteld = herstelCode(vertaald.trim(), codes);
    if (hersteld === null) {
      return afronden("mislukt", `Codeblokken in "${naam}" zijn niet ongewijzigd teruggekomen.`);
    }
    uit[naam] = hersteld;
  }

  const slug = bron.soort === "artikel" ? slugVan(uit.kop ?? "") : "";
  const { data: uitkomst, error: fout } = await db.rpc("vertaal_opslaan", {
    p_taak: id,
    p_velden: uit,
    p_slug: slug,
  });
  if (fout) return afronden("mislukt", `Opslaan mislukt: ${fout.message}`);
  // Direct verlopen, zodat de vertaling bij het volgende bezoek te zien is.
  revalidateTag(bron.soort === "artikel" ? "artikelen" : "forum", { expire: 0 });
  return { id, uitkomst: String(uitkomst) };
}

export async function POST(request: Request) {
  const controle = tokenKlopt(request);
  if (controle === "ontbreekt") return json({ fout: "VERTAAL_TOKEN ontbreekt in Vercel." }, 503);
  if (controle === "fout") return json({ fout: "Geen toegang." }, 401);

  const db = maakBeheerClient();
  if (!db) return json({ fout: "De geheime serversleutel van Supabase ontbreekt." }, 503);

  const tekst = await request.text();
  if (tekst.length > 2_000_000) return json({ fout: "Te groot." }, 413);
  let invoer: { resultaten?: Resultaat[] } & Resultaat;
  try {
    invoer = JSON.parse(tekst);
  } catch {
    return json({ fout: "Geen geldige JSON." }, 400);
  }
  const lijst = Array.isArray(invoer.resultaten) ? invoer.resultaten : [invoer];
  const uitkomsten = [];
  for (const r of lijst.slice(0, 50)) uitkomsten.push(await verwerk(db, r));
  return json({ uitkomsten });
}
