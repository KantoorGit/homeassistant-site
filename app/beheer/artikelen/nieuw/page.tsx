import type { Metadata } from "next";
import Link from "next/link";
import { kiesbareCategorieen } from "@/lib/beheer/artikelen";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { talen, taalNamen } from "@/lib/site";
import ArtikelFormulier from "../ArtikelFormulier";

export const metadata: Metadata = { title: "Nieuw artikel" };

export default async function NieuwArtikel() {
  const { redacteur } = await vereisRedacteur();
  const eersteTaal = redacteur.talen.includes("nl") ? "nl" : redacteur.talen[0];

  return (
    <section>
      <p className="terug">
        <Link href="/beheer">← Alle artikelen</Link>
      </p>
      <h1>Nieuw artikel</h1>
      <ArtikelFormulier
        gegevens={{
          id: null,
          categorie: "",
          origineleTaal: eersteTaal,
          auteur: redacteur.naam,
          status: "concept",
          gepubliceerdOp: "",
          uitgelicht: false,
          afbeeldingUrl: "",
          videoUrl: "",
          teksten: {},
        }}
        categorieen={kiesbareCategorieen.map((c) => ({ id: c.id, naam: c.naam.nl }))}
        talen={[...talen]}
        taalNamen={taalNamen}
        mijnTalen={redacteur.talen}
        opgeslagen={false}
      />
    </section>
  );
}
