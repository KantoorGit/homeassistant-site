"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { vereisBeheerder } from "@/lib/beheer/toegang";
import { isTaal } from "@/lib/site";

// Talen aan- of uitzetten (W-TAAL-10). Nederlands staat altijd aan.
export async function talenOpslaan(formData: FormData) {
  const { supabase } = await vereisBeheerder();
  const gekozen = formData.getAll("taal").filter(isTaal);
  if (!gekozen.includes("nl")) gekozen.unshift("nl");
  const { error } = await supabase.rpc("zet_actieve_talen", { p_talen: gekozen });
  if (error) redirect(`/beheer/talen?fout=${encodeURIComponent(error.message)}`);
  updateTag("talen");
  redirect("/beheer/talen?opgeslagen=1");
}

// Alle bestaande content naar één taal laten vertalen (W-TAAL-17).
export async function allesVertalen(taal: string) {
  const { supabase } = await vereisBeheerder();
  if (!isTaal(taal)) redirect("/beheer/talen");
  const { data, error } = await supabase.rpc("vertaal_alles_naar", { p_taal: taal });
  if (error) redirect(`/beheer/talen?fout=${encodeURIComponent(error.message)}`);
  redirect(`/beheer/talen?ingepland=${typeof data === "number" ? data : 0}`);
}

// Een mislukte vertaling opnieuw in de wachtrij zetten.
export async function opnieuwProberen(taakId: number) {
  const { supabase } = await vereisBeheerder();
  const { data: taak } = await supabase
    .from("vertaal_taken")
    .select("soort, artikel_id, bericht_id, doel_taal, overschrijven")
    .eq("id", taakId)
    .maybeSingle<{
      soort: string;
      artikel_id: string | null;
      bericht_id: number | null;
      doel_taal: string;
      overschrijven: boolean;
    }>();
  if (!taak) redirect("/beheer/talen");
  const { error } =
    taak.soort === "artikel"
      ? await supabase.rpc("vertaal_artikel", {
          p_artikel: taak.artikel_id,
          p_talen: [taak.doel_taal],
          p_overschrijven: taak.overschrijven,
        })
      : await supabase.rpc("forum_vertaal", {
          p_bericht: taak.bericht_id,
          p_talen: [taak.doel_taal],
          p_overschrijven: taak.overschrijven,
        });
  if (error) redirect(`/beheer/talen?fout=${encodeURIComponent(error.message)}`);
  redirect("/beheer/talen?opnieuw=1");
}
