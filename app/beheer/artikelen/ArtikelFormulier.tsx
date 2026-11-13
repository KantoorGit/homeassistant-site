"use client";

import { useActionState, useState } from "react";
import type { Taal } from "@/lib/site";
import { artikelOpslaan } from "../acties";

export type FormulierGegevens = {
  id: string | null;
  categorie: string;
  origineleTaal: Taal;
  auteur: string;
  status: "concept" | "gepubliceerd";
  gepubliceerdOp: string; // "2026-11-13T10:00", Amsterdamse tijd
  uitgelicht: boolean;
  afbeeldingUrl: string;
  videoUrl: string;
  teksten: Record<string, { kop: string; intro: string; tekst: string; slug: string }>;
};

export default function ArtikelFormulier({
  gegevens,
  categorieen,
  talen,
  taalNamen,
  mijnTalen,
  opgeslagen,
}: {
  gegevens: FormulierGegevens;
  categorieen: { id: string; naam: string }[];
  talen: Taal[];
  taalNamen: Record<Taal, string>;
  mijnTalen: Taal[];
  opgeslagen: boolean;
}) {
  const [staat, actie, bezig] = useActionState(artikelOpslaan, undefined);
  const [origineel, zetOrigineel] = useState<Taal>(gegevens.origineleTaal);
  // Volgorde: eerst de originele taal, daarna de vertalingen.
  const volgorde = [origineel, ...talen.filter((t) => t !== origineel)];

  return (
    <form action={actie} className="formulier artikel-formulier">
      {gegevens.id && <input type="hidden" name="id" value={gegevens.id} />}

      {opgeslagen && !staat?.fout && !bezig && (
        <p className="melding" role="status">Opgeslagen.</p>
      )}

      <fieldset className="velden-rij">
        <legend>Plaatsing</legend>
        <label>
          Categorie
          <select name="categorie" defaultValue={gegevens.categorie} required>
            <option value="" disabled>
              Kies…
            </option>
            {categorieen.map((c) => (
              <option key={c.id} value={c.id}>
                {c.naam}
              </option>
            ))}
          </select>
        </label>
        <label>
          Originele taal
          <select
            name="originele_taal"
            value={origineel}
            onChange={(e) => zetOrigineel(e.target.value as Taal)}
          >
            {talen.map((t) => (
              <option key={t} value={t} disabled={!mijnTalen.includes(t)}>
                {taalNamen[t]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Auteur
          <input name="auteur" defaultValue={gegevens.auteur} />
        </label>
      </fieldset>

      <fieldset className="velden-rij">
        <legend>Publicatie</legend>
        <label>
          Status
          <select name="status" defaultValue={gegevens.status}>
            <option value="concept">Concept (niet zichtbaar)</option>
            <option value="gepubliceerd">Publiceren</option>
          </select>
        </label>
        <label>
          Publicatiedatum en -tijd
          <input
            type="datetime-local"
            name="gepubliceerd_op"
            defaultValue={gegevens.gepubliceerdOp}
          />
          <small>Leeg = nu. Een tijd in de toekomst = gepland.</small>
        </label>
        <label className="vinkje">
          <input
            type="checkbox"
            name="uitgelicht"
            value="aan"
            defaultChecked={gegevens.uitgelicht}
          />
          Uitlichten: groot bovenaan de voorpagina
        </label>
      </fieldset>

      <fieldset className="velden-rij">
        <legend>Beeld</legend>
        <label>
          Afbeelding (adres, begint met https://)
          <input
            name="afbeelding_url"
            type="url"
            defaultValue={gegevens.afbeeldingUrl}
            placeholder="https://…"
          />
        </label>
        <label>
          YouTube-video (adres)
          <input
            name="video_url"
            type="url"
            defaultValue={gegevens.videoUrl}
            placeholder="https://www.youtube.com/watch?v=…"
          />
        </label>
      </fieldset>

      {volgorde.map((taal) => {
        const t = gegevens.teksten[taal] ?? { kop: "", intro: "", tekst: "", slug: "" };
        const isOrigineel = taal === origineel;
        const magSchrijven = mijnTalen.includes(taal);
        return (
          <fieldset key={taal} className="taalblok" disabled={!magSchrijven}>
            <legend>
              {taalNamen[taal]} {isOrigineel ? "(origineel)" : "(vertaling, optioneel)"}
              {!magSchrijven && " – alleen lezen"}
            </legend>
            <label>
              Kop
              <input name={`kop_${taal}`} defaultValue={t.kop} required={isOrigineel} />
            </label>
            <label>
              Intro (één of twee zinnen, ook gebruikt in zoekmachines)
              <textarea name={`intro_${taal}`} defaultValue={t.intro} rows={2} />
            </label>
            <label>
              Tekst
              <textarea name={`tekst_${taal}`} defaultValue={t.tekst} rows={14} />
              <small>Laat een witregel tussen alinea’s.</small>
            </label>
            <label>
              Webadres (leeg = gemaakt uit de kop)
              <input name={`slug_${taal}`} defaultValue={t.slug} placeholder="bijv. lampen-aan-bij-zonsondergang" />
            </label>
          </fieldset>
        );
      })}

      {staat?.fout && <p className="fout" role="alert">{staat.fout}</p>}
      <div className="beheer-knoppen">
        <button type="submit" disabled={bezig}>
          {bezig ? "Bezig met opslaan…" : "Opslaan"}
        </button>
      </div>
    </form>
  );
}
