import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { artikelPad } from "@/lib/artikelen";
import {
  alleArtikelen,
  bezettePlekken,
  categorieKeuzes,
  eenArtikel,
  kopVan,
  positieVan,
} from "@/lib/beheer/artikelen";
import { isoNaarAmsterdam } from "@/lib/beheer/hulp";
import { beheerT } from "@/lib/beheer/taal";
import { telTekst, vul } from "@/lib/beheer/teksten";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { haalAlleCategorieen } from "@/lib/categorieen";
import { categorieVanArtikel, isTaal, talen, teksten as siteTeksten, type Taal } from "@/lib/site";
import { supabaseInstellingen } from "@/lib/supabase";
import { haalActieveTalen } from "@/lib/talen-instelling";
import { artikelVerwijderen } from "../../acties";
import ArtikelFormulier, { type FormulierGegevens, type Vertaalinfo } from "../ArtikelFormulier";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await beheerT();
  return { title: t.artikel.titelBewerken };
}

export default async function ArtikelBewerken({
  params,
  searchParams,
}: PageProps<"/beheer/artikelen/[id]">) {
  const { supabase, redacteur } = await vereisRedacteur();
  const { taal, t } = await beheerT();
  const { id } = await params;
  const { opgeslagen, vertaald, plekfout } = await searchParams;
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
  const [actieveTalen, categorieen, { artikelen }] = await Promise.all([
    haalActieveTalen(),
    haalAlleCategorieen(),
    alleArtikelen(supabase),
  ]);
  const inWachtrij = Object.values(vertaalinfo).filter(
    (i) => i?.status === "wachtend" || i?.status === "bezig",
  ).length;
  const online =
    artikel.status === "gepubliceerd" &&
    artikel.gepubliceerd_op !== null &&
    new Date(artikel.gepubliceerd_op) <= new Date();
  const pad = artikelPad(
    {
      categorie: categorieVanArtikel(categorieen, artikel.categorie_id),
      slugPerTaal,
      origineleTaal: artikel.originele_taal,
    },
    artikel.originele_taal,
  );
  const v = t.vertaalpaneel;
  const n = Number(vertaald);
  const { url, sleutel } = supabaseInstellingen();

  return (
    <section>
      <p className="terug">
        <Link href="/beheer">{t.algemeen.terugArtikelen}</Link>
      </p>
      <div className="beheer-titelrij">
        <h1>{kopVan(artikel, taal, t.overzicht.zonderKop)}</h1>
        {online && pad && (
          <Link href={pad} className="knop-link" target="_blank">
            {t.artikel.bekijk}
          </Link>
        )}
      </div>

      {typeof plekfout === "string" && (
        <p className="fout" role="alert">
          {vul(t.fouten.plekMislukt, { fout: plekfout })}
        </p>
      )}
      {vertaald !== undefined && (
        <p className="melding" role="status">
          {n > 0 ? telTekst(n, v.inWachtrij1, v.inWachtrijN) : v.nietsInWachtrij}
        </p>
      )}
      {vertaald === undefined && inWachtrij > 0 && (
        <p className="uitleg">{telTekst(inWachtrij, v.wacht1, v.wachtN)}</p>
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
          positie: positieVan(artikel),
          afbeeldingUrl: artikel.afbeelding_url ?? "",
          videoUrl: artikel.video_url ?? "",
          teksten,
          vertaalinfo,
        }}
        categorieen={categorieKeuzes(categorieen, taal, artikel.categorie_id)}
        overigNaam={categorieen.find((c) => c.soort === "overig")?.naam[taal] ?? ""}
        talen={[...talen]}
        actieveTalen={actieveTalen}
        taalNamen={siteTeksten[taal].taalNaam}
        mijnTalen={redacteur.talen}
        opgeslagen={opgeslagen === "1"}
        bezettePlekken={bezettePlekken(artikelen, taal, t.overzicht.zonderKop)}
        t={t}
        supabaseUrl={url ?? ""}
        supabaseSleutel={sleutel ?? ""}
      />

      {redacteur.rol === "beheerder" && (
        <details className="gevaarzone">
          <summary>{t.artikel.verwijderTitel}</summary>
          <p>{t.artikel.verwijderUitleg}</p>
          <form action={artikelVerwijderen}>
            <input type="hidden" name="id" value={artikel.id} />
            <button type="submit" className="knop-gevaar">
              {t.artikel.verwijderKnop}
            </button>
          </form>
        </details>
      )}
    </section>
  );
}
