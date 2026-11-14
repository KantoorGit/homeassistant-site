import type { Metadata } from "next";
import Link from "next/link";
import { alleArtikelen, bezettePlekken, categorieKeuzes } from "@/lib/beheer/artikelen";
import { beheerT } from "@/lib/beheer/taal";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { haalAlleCategorieen } from "@/lib/categorieen";
import { talen, teksten } from "@/lib/site";
import { supabaseInstellingen } from "@/lib/supabase";
import { haalActieveTalen } from "@/lib/talen-instelling";
import ArtikelFormulier from "../ArtikelFormulier";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await beheerT();
  return { title: t.artikel.titelNieuw };
}

export default async function NieuwArtikel() {
  const { supabase, redacteur } = await vereisRedacteur();
  const { taal, t } = await beheerT();
  const [actieveTalen, categorieen, { artikelen }] = await Promise.all([
    haalActieveTalen(),
    haalAlleCategorieen(),
    alleArtikelen(supabase),
  ]);
  const eersteTaal = redacteur.talen.includes(taal)
    ? taal
    : redacteur.talen.includes("nl")
      ? "nl"
      : redacteur.talen[0];
  const { url, sleutel } = supabaseInstellingen();

  return (
    <section>
      <p className="terug">
        <Link href="/beheer">{t.algemeen.terugArtikelen}</Link>
      </p>
      <h1>{t.artikel.titelNieuw}</h1>
      <ArtikelFormulier
        gegevens={{
          id: null,
          categorie: "",
          origineleTaal: eersteTaal,
          auteur: redacteur.naam,
          status: "concept",
          gepubliceerdOp: "",
          positie: null,
          afbeeldingUrl: "",
          videoUrl: "",
          teksten: {},
          vertaalinfo: {},
        }}
        categorieen={categorieKeuzes(categorieen, taal)}
        overigNaam={categorieen.find((c) => c.soort === "overig")?.naam[taal] ?? ""}
        talen={[...talen]}
        actieveTalen={actieveTalen}
        taalNamen={teksten[taal].taalNaam}
        mijnTalen={redacteur.talen}
        opgeslagen={false}
        bezettePlekken={bezettePlekken(artikelen, taal, t.overzicht.zonderKop)}
        t={t}
        supabaseUrl={url ?? ""}
        supabaseSleutel={sleutel ?? ""}
      />
    </section>
  );
}
