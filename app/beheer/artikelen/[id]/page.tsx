import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { artikelPad } from "@/lib/artikelen";
import { eenArtikel, kiesbareCategorieen, kopVan } from "@/lib/beheer/artikelen";
import { isoNaarAmsterdam } from "@/lib/beheer/hulp";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { isTaal, talen, taalNamen, type Taal } from "@/lib/site";
import { artikelVerwijderen } from "../../acties";
import ArtikelFormulier, { type FormulierGegevens } from "../ArtikelFormulier";

export const metadata: Metadata = { title: "Artikel bewerken" };

export default async function ArtikelBewerken({
  params,
  searchParams,
}: PageProps<"/beheer/artikelen/[id]">) {
  const { supabase, redacteur } = await vereisRedacteur();
  const { id } = await params;
  const { opgeslagen } = await searchParams;
  const artikel = await eenArtikel(supabase, id);
  if (!artikel) notFound();

  const teksten: FormulierGegevens["teksten"] = {};
  const slugPerTaal: Partial<Record<Taal, string>> = {};
  for (const v of artikel.artikel_vertalingen) {
    teksten[v.taal] = { kop: v.kop, intro: v.intro, tekst: v.tekst, slug: v.slug };
    if (isTaal(v.taal)) slugPerTaal[v.taal] = v.slug;
  }
  const online =
    artikel.status === "gepubliceerd" &&
    artikel.gepubliceerd_op !== null &&
    new Date(artikel.gepubliceerd_op) <= new Date();
  const pad = artikelPad(
    { categorieId: artikel.categorie_id, slugPerTaal },
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
        }}
        categorieen={kiesbareCategorieen.map((c) => ({ id: c.id, naam: c.naam.nl }))}
        talen={[...talen]}
        taalNamen={taalNamen}
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
