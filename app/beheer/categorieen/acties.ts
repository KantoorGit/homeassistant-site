"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { maakSlug } from "@/lib/beheer/hulp";
import { beheerT } from "@/lib/beheer/taal";
import { vereisBeheerder } from "@/lib/beheer/toegang";
import { haalAlleCategorieen } from "@/lib/categorieen";
import { talen, type Taal } from "@/lib/site";

// Categorieën wijzigen in het beheerpaneel (W-ADM-07, W-ADM-13 t/m -16).
// Alles loopt via databasefuncties in supabase/007_…sql, die zelf ook
// controleren of je beheerder bent met 2FA.

function tekst(formData: FormData, naam: string): string {
  const w = formData.get(naam);
  return typeof w === "string" ? w.trim() : "";
}

function terug(params: Record<string, string>): never {
  redirect(`/beheer/categorieen?${new URLSearchParams(params).toString()}`);
}

// Foutcode uit de database ("slug_bestaat:en") naar een zoekparameter.
function foutNaarParams(bericht: string): Record<string, string> {
  const m = /(naam_leeg|naam_te_lang|slug_ongeldig|slug_gereserveerd|slug_bestaat|niet_verwijderbaar|slug_voorpagina|slug_forum)(?::(\w+))?/.exec(
    bericht,
  );
  if (m) return { fout: m[1], taal: m[2] ?? "" };
  if (/categorie_|categorieen|schema cache|does not exist/i.test(bericht)) return { fout: "niet_klaar" };
  return { fout: "algemeen", bericht: bericht.slice(0, 200) };
}

// Naam en webadres per taal uit het formulier. Een lege naam krijgt de naam
// in de taal van het beheerpaneel (of de eerste die is ingevuld); een leeg
// webadres wordt gemaakt uit de naam, anders uit een naam in een taal met
// Latijnse letters (zo krijgt Chinees een adres in gewone letters).
function leesVelden(formData: FormData, beheerTaal: Taal) {
  const naam = Object.fromEntries(talen.map((t) => [t, tekst(formData, `naam_${t}`).slice(0, 40)])) as Record<
    Taal,
    string
  >;
  const terugval = naam[beheerTaal] || talen.map((t) => naam[t]).find(Boolean) || "";
  for (const t of talen) if (!naam[t]) naam[t] = terugval;
  const latijn = talen.map((t) => maakSlug(naam[t])).find(Boolean) || "";
  const slug = Object.fromEntries(
    talen.map((t) => {
      const ingevuld = maakSlug(tekst(formData, `slug_${t}`));
      return [t, ingevuld || maakSlug(naam[t]) || latijn];
    }),
  ) as Record<Taal, string>;
  return { naam, slug, leeg: !terugval };
}

export async function categorieOpslaan(formData: FormData) {
  const { supabase } = await vereisBeheerder();
  const { taal } = await beheerT();
  const id = tekst(formData, "id");
  const oud = id ? (await haalAlleCategorieen()).find((c) => c.id === id) : undefined;
  // Leeg webadresveld bij bestaande categorie: het bestaande adres houden.
  const { naam, slug, leeg } = leesVelden(formData, taal);
  if (oud) {
    for (const t of talen) {
      if (!tekst(formData, `slug_${t}`)) slug[t] = oud.slug[t];
    }
  }
  if (leeg) terug({ fout: "naam_leeg", taal: "" });
  const { error } = await supabase.rpc("categorie_opslaan", {
    p_id: id || null,
    p_naam: naam,
    p_slug: slug,
  });
  if (error) terug(foutNaarParams(error.message));
  updateTag("categorieen");
  updateTag("artikelen");
  terug({ melding: id ? "opgeslagen" : "toegevoegd" });
}

export async function categorieVerplaatsen(id: string, richting: "omhoog" | "omlaag") {
  const { supabase } = await vereisBeheerder();
  const lijst = (await haalAlleCategorieen()).filter(
    (c) => !c.verwijderd && (c.soort === "gewoon" || c.soort === "laatste-nieuws"),
  );
  const i = lijst.findIndex((c) => c.id === id);
  const j = richting === "omhoog" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lijst.length) terug({});
  [lijst[i], lijst[j]] = [lijst[j], lijst[i]];
  const { error } = await supabase.rpc("categorie_volgorde", { p_ids: lijst.map((c) => c.id) });
  if (error) terug(foutNaarParams(error.message));
  updateTag("categorieen");
  terug({ melding: "volgorde", kijk: id });
}

export async function categorieVerwijderen(formData: FormData) {
  const { supabase } = await vereisBeheerder();
  const id = tekst(formData, "id");
  if (formData.get("bevestig") !== "ja") terug({});
  const { error } = await supabase.rpc("categorie_verwijderen", { p_id: id });
  if (error) terug(foutNaarParams(error.message));
  updateTag("categorieen");
  updateTag("artikelen");
  terug({ melding: "verwijderd" });
}

export async function categorieTerugzetten(id: string) {
  const { supabase } = await vereisBeheerder();
  const { error } = await supabase.rpc("categorie_terugzetten", { p_id: id });
  if (error) terug(foutNaarParams(error.message));
  updateTag("categorieen");
  updateTag("artikelen");
  terug({ melding: "teruggezet" });
}
