import { cookies, headers } from "next/headers";
import { createHash } from "node:crypto";
import { bewaarToestemming, ipVan, verwerkMeting } from "@/lib/meting/server";
import type { Verzending } from "@/lib/meting/instellingen";

// Ontvangt metingen van het meetscript (W-ANA-64). De browser schrijft nooit
// rechtstreeks in de database; deze route controleert en beperkt alles.

const maxGrootte = 32_000;

// Eenvoudige limiet per serverinstantie: hoogstens 60 verzendingen per
// minuut per afzender (gehasht, niet bewaard).
const tellers = new Map<string, { aantal: number; tot: number }>();

function teVaak(afzender: string): boolean {
  const nu = Date.now();
  if (tellers.size > 5000) {
    for (const [k, v] of tellers) if (v.tot < nu) tellers.delete(k);
  }
  const t = tellers.get(afzender);
  if (!t || t.tot < nu) {
    tellers.set(afzender, { aantal: 1, tot: nu + 60_000 });
    return false;
  }
  t.aantal += 1;
  return t.aantal > 60;
}

const leeg = () => new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });

export async function POST(request: Request) {
  try {
    const h = await headers();
    const c = await cookies();

    // Alleen verzoeken van deze site zelf.
    const herkomst = h.get("origin");
    if (herkomst && new URL(herkomst).host !== h.get("host")) return leeg();

    const afzender = createHash("sha256").update(ipVan(h)).digest("hex").slice(0, 16);
    if (teVaak(afzender)) return new Response(null, { status: 429 });

    const tekst = await request.text();
    if (tekst.length > maxGrootte) return new Response(null, { status: 413 });
    const invoer = JSON.parse(tekst) as Verzending;
    if (!invoer || typeof invoer !== "object") return leeg();

    if (invoer.toestemming) {
      const { keuze, versie } = invoer.toestemming;
      if ((keuze === "accepteren" || keuze === "weigeren") && typeof versie === "string") {
        await bewaarToestemming(keuze, versie, c);
      }
    }
    if (Array.isArray(invoer.gebeurtenissen) && invoer.gebeurtenissen.length > 0) {
      await verwerkMeting(invoer, c, h);
    }
  } catch (fout) {
    // Meten mag nooit hinderen; fouten alleen in het logboek.
    console.error("Meting mislukt:", fout instanceof Error ? fout.message : fout);
  }
  return leeg();
}
