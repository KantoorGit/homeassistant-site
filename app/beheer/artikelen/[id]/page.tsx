import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { artikelPad } from "@/lib/artikelen";
import { eenArtikel, kiesbareCategorieen, kopVan } from "@/lib/beheer/artikelen";
import { isoNaarAmsterdam } from "@/lib/beheer/hulp";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { isTaal, talen, teksten as siteTeksten, type Taal } from "@/lib/site";
import { haalActieveTalen } from "@/lib/talen-instelling";
import { artikelVerwijderen } from "../../acties";
import ArtikelFormulier, { type FormulierGegevens, type Vertaalinfo } from "../ArtikelFormulier";

export const metadata: Metadata = { title: "Artikel bewerken" };

export default async function ArtikelBewerken({
  params,
  searchParams,
}: PageProps<"/beheer/artikelen/[id]">) {
  const { supabase, redacteur } = await vereisRedacteur();
  const { id } = await params;
  const { opgeslagen, vertaald } = await searchParams;
  const artikel = await eenArtikel(supabase, id);
  if (!artikel) notFound();

  const teksten: FormulierGegevens["teksten"] = {};
  const vertaalinfo: Partial<Record<Taal, Vertaalinfo>> = {};
  const slugPerTaal: Partial<Record<Taal, string>> = {};
  for (const v of artikel.artikel_vertalingen) {
    if (!isTaal(v.taal)) continue;
    teksten[v.taal] = { kop: v.kop, intro: v.intro, tekst: v.tekst, slug: v.slug };
    vertaalinfo[v.taal] = { automatisch: v.automatisch_vertaald, handmatig: v.handmatig_gecorrigeerd };
    slugPerTaal[v.taal] = v.slug;
  }
  // Laatste taak in de vertaalwachtrij per taal (W-TAAL-16).
  const { data: taken } = await supabase
    .from("vertaal_taken")
    .select("doel_taal, status, fout, aangemaakt")
    .eq("artikel_id", artikel.id)
    .order("aangemaakt", { ascending: false })
    .limit(60)
    .overrideTypes<{ doel_taal: string; status: Vertaalinfo["status"]; fout: string | null }[], { merge: false }>();
  for (const taak of taken ?? []) {
    if (!isTaal(taak.doel_taal)) continue;
    const info = vertaalinfo[taak.doel_taal] ?? { automatisch: false, handmatig: false };
    if (info.status) continue;
    vertaalinfo[taak.doel_taal] = { ...info, status: taak.status, fout: taak.fout };
  }
  const actieveTalen = await haalActieveTalen();
  const inWachtrij = Object.values(vertaalinfo).filter(
    (i) => i?.status === "wachtend" || i?.status === "bezig",
  ).length;
  const online =
    artikel.status === "gepubliceerd" &&
    artikel.gepubliceerd_op !== null &&
    new Date(artikel.gepubliceerd_op) <= new Date();
  const pad = artikelPad(
    {
      categorieId: artikel.categorie_id,
      slugPerTaal,
      origineleTaal: artikel.originele_taal,
    },
    artikel.originele_taal,
  );

  return (
    <section>
      <p className="terug">
        <Link href="/beheer">← Alle artikelen</Link>
      </p>
      <div className="beheer-titelrij">
        <h1>{kopVan(artikel)}</h1>
        {online && pad && (
          <Link href={pad} className="knop-link" target="_blank">
            Bekijk op de website ↗
          </Link>
        )}
      </div>

      {vertaald !== undefined && (
        <p className="melding" role="status">
          {Number(vertaald) > 0
            ? `${vertaald} ${Number(vertaald) === 1 ? "vertaling staat" : "vertalingen staan"} in de wachtrij. Ze verschijnen vanzelf zodra de Claude-app ze heeft gemaakt.`
            : "Er is niets in de wachtrij gezet (de gekozen talen zijn uitgezet of met de hand verbeterd)."}
        </p>
      )}
      {vertaald === undefined && inWachtrij > 0 && (
        <p className="uitleg">
          {inWachtrij} {inWachtrij === 1 ? "vertaling wacht" : "vertalingen wachten"} op de Claude-app.
        </p>
      )}

      <ArtikelFormulier
        key={artikel.bijgewerkt}
        gegevens={{
          id: artikel.id,
          categorie: artikel.categorie_id,
          origineleTaal: artikel.originele_taal,
          auteur: artikel.auteur,
          status: artikel.status,
          gepubliceerdOp: isoNaarAmsterdam(artikel.gepubliceerd_op),
          uitgelicht: artikel.uitgelicht,
          afbeeldingUrl: artikel.afbeelding_url ?? "",
          videoUrl: artikel.video_url ?? "",
          teksten,
          vertaalinfo,
        }}
        categorieen={kiesbareCategorieen.map((c) => ({ id: c.id, naam: c.naam.nl }))}
        talen={[...talen]}
        actieveTalen={actieveTalen}
        taalNamen={siteTeksten.nl.taalNaam}
        mijnTalen={redacteur.talen}
        opgeslagen={opgeslagen === "1"}
      />

      {redacteur.rol === "beheerder" && (
        <details className="gevaarzone">
          <summary>Artikel verwijderen</summary>
          <p>Het artikel verdwijnt in alle talen. Dit kun je niet ongedaan maken.</p>
          <form action={artikelVerwijderen}>
            <input type="hidden" name="id" value={artikel.id} />
            <button type="submit" className="knop-gevaar">
              Definitief verwijderen
            </button>
          </form>
        </details>
      )}
    </section>
  );
}
