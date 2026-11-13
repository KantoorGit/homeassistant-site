import { cacheLife, cacheTag } from "next/cache";
import type { PostTaal } from "./forum";
import { maakSupabaseClient } from "./supabase";

// ---------------------------------------------------------------------------
// Openbare lijsten van discussies. Kort bewaard; na een nieuw bericht wordt
// de bewaarde versie meteen ververst (updateTag("forum") in de acties).
// ---------------------------------------------------------------------------

export type DraadKort = {
  id: number;
  onderwerp: string;
  titel: string;
  taal: PostTaal;
  aantalReacties: number;
  laatsteActiviteit: string;
  gesloten: boolean;
  auteur: string | null;
};

type DraadRij = {
  id: number;
  onderwerp: string;
  titel: string;
  taal: PostTaal;
  aantal_reacties: number;
  laatste_activiteit: string;
  gesloten: boolean;
  auteur: { gebruikersnaam: string } | null;
};

export async function haalDraden(
  onderwerpId: string | null,
): Promise<{ draden: DraadKort[]; beschikbaar: boolean }> {
  "use cache";
  cacheLife("minutes");
  cacheTag("forum");

  const supabase = maakSupabaseClient();
  if (!supabase) return { draden: [], beschikbaar: false };

  let vraag = supabase
    .from("forum_draden")
    .select(
      "id, onderwerp, titel, taal, aantal_reacties, laatste_activiteit, gesloten, auteur:profielen(gebruikersnaam)",
    )
    .eq("status", "zichtbaar")
    .order("laatste_activiteit", { ascending: false })
    .limit(50);
  if (onderwerpId) vraag = vraag.eq("onderwerp", onderwerpId);

  const { data, error } = await vraag.overrideTypes<DraadRij[], { merge: false }>();
  if (error) {
    console.error("Forum ophalen mislukt:", error.code, error.message);
    return { draden: [], beschikbaar: false };
  }
  return {
    beschikbaar: true,
    draden: (data ?? []).map((r) => ({
      id: r.id,
      onderwerp: r.onderwerp,
      titel: r.titel,
      taal: r.taal,
      aantalReacties: r.aantal_reacties,
      laatsteActiviteit: r.laatste_activiteit,
      gesloten: r.gesloten,
      auteur: r.auteur?.gebruikersnaam ?? null,
    })),
  };
}

