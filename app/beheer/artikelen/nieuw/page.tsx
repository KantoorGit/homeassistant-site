import type { Metadata } from "next";
import Link from "next/link";
import { kiesbareCategorieen } from "@/lib/beheer/artikelen";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { talen, teksten } from "@/lib/site";
import { haalActieveTalen } from "@/lib/talen-instelling";
import ArtikelFormulier from "../ArtikelFormulier";

export const metadata: Metadata = { title: "Nieuw artikel" };

export default async function NieuwArtikel() {
  const { redacteur } = await vereisRedacteur();
  const actieveTalen = await haalActieveTalen();
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
          vertaalinfo: {},
        }}
        categorieen={kiesbareCategorieen.map((c) => ({ id: c.id, naam: c.naam.nl }))}
        talen={[...talen]}
        actieveTalen={actieveTalen}
        taalNamen={teksten.nl.taalNaam}
        mijnTalen={redacteur.talen}
        opgeslagen={false}
      />
    </section>
  );
}
