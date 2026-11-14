import { cacheLife, cacheTag } from "next/cache";
import { isTaal, talen, type Taal } from "./site";
import { maakSupabaseClient } from "./supabase";

// Talen die op de site aan staan (W-TAAL-10), uit de tabel
// site_instellingen (supabase/006_vertalen.sql). Aan- en uitzetten gaat in
// het beheerpaneel, zonder de site opnieuw te bouwen. Zolang de tabel er
// niet is, staan alle zes talen aan.
export async function haalActieveTalen(): Promise<Taal[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("talen");

  const supabase = maakSupabaseClient();
  if (!supabase) return [...talen];
  const { data, error } = await supabase
    .from("site_instellingen")
    .select("waarde")
    .eq("sleutel", "actieve_talen")
    .maybeSingle<{ waarde: unknown }>();
  if (error || !Array.isArray(data?.waarde)) return [...talen];
  const actief = talen.filter((t) => (data.waarde as unknown[]).includes(t));
  return actief.length > 0 ? actief : [...talen];
}

export function filterTalen(waarden: unknown[]): Taal[] {
  return talen.filter((t) => waarden.some((w) => w === t && isTaal(w)));
}
