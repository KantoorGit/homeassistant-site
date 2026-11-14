"use client";

import { useActionState, useState } from "react";
import Vertaalschakelaars from "@/components/Vertaalschakelaars";
import type { Taal } from "@/lib/site";
import { artikelOpslaan, artikelVertalen } from "../acties";

export type Tekstvelden = { kop: string; intro: string; tekst: string; slug: string };

export type Vertaalinfo = {
  // Laatste taak in de wachtrij voor deze taal.
  status?: "wachtend" | "bezig" | "klaar" | "mislukt";
  fout?: string | null;
  automatisch: boolean;
  handmatig: boolean;
};

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
  teksten: Partial<Record<Taal, Tekstvelden>>;
  vertaalinfo: Partial<Record<Taal, Vertaalinfo>>;
};

function Tekstblok({
  taal,
  t,
  verplicht,
  open = true,
}: {
  taal: Taal;
  t: Tekstvelden;
  verplicht: boolean;
  open?: boolean;
}) {
  return (
    <div className="taalvelden" data-open={open}>
      <label>
        Kop
        <input name={`kop_${taal}`} defaultValue={t.kop} required={verplicht} />
      </label>
      <label>
        Intro (één of twee zinnen, ook gebruikt in zoekmachines)
        <textarea name={`intro_${taal}`} defaultValue={t.intro} rows={2} />
      </label>
      <label>
        Tekst
        <textarea name={`tekst_${taal}`} defaultValue={t.tekst} rows={verplicht ? 14 : 8} />
        <small>
          Laat een witregel tussen alinea’s. Code tussen ``` wordt nooit vertaald.
        </small>
      </label>
      <label>
        Webadres (leeg = gemaakt uit de kop)
        <input
          name={`slug_${taal}`}
          defaultValue={t.slug}
          placeholder="bijv. lampen-aan-bij-zonsondergang"
        />
      </label>
    </div>
  );
}

function statusTekst(info?: Vertaalinfo): string {
  if (!info) return "Nog niet vertaald";
  const delen: string[] = [];
  if (info.status === "wachtend" || info.status === "bezig") delen.push("in de wachtrij");
  if (info.status === "mislukt") delen.push(`vertalen mislukt${info.fout ? `: ${info.fout}` : ""}`);
  if (info.handmatig) delen.push("met de hand verbeterd");
  else if (info.automatisch) delen.push("automatisch vertaald");
  return delen.join(" · ") || "vertaald";
}

export default function ArtikelFormulier({
  gegevens,
  categorieen,
  talen,
  actieveTalen,
  taalNamen,
  mijnTalen,
  opgeslagen,
}: {
  gegevens: FormulierGegevens;
  categorieen: { id: string; naam: string }[];
  talen: Taal[];
  actieveTalen: Taal[];
  taalNamen: Record<Taal, string>;
  mijnTalen: Taal[];
  opgeslagen: boolean;
}) {
  const [staat, actie, bezig] = useActionState(artikelOpslaan, undefined);
  const [origineel, zetOrigineel] = useState<Taal>(gegevens.origineleTaal);
  const nieuw = !gegevens.id;
  const andere = actieveTalen.filter((t) => t !== origineel);
  // Nieuw artikel: standaard naar alle andere talen vertalen (W-TAAL-11, -12).
  const [aan, zetAan] = useState<Taal[]>(actieveTalen);
  const aantal = andere.filter((t) => aan.includes(t)).length;
  const leeg: Tekstvelden = { kop: "", intro: "", tekst: "", slug: "" };

  return (
    <>
      <form action={actie} className="formulier artikel-formulier">
        {gegevens.id && <input type="hidden" name="id" value={gegevens.id} />}

        {opgeslagen && !staat?.fout && !bezig && (
          <p className="melding" role="status">
            Opgeslagen.
          </p>
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
            Taal waarin je schrijft
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
            <input type="datetime-local" name="gepubliceerd_op" defaultValue={gegevens.gepubliceerdOp} />
            <small>Leeg = nu. Een tijd in de toekomst = gepland.</small>
          </label>
          <label className="vinkje">
            <input type="checkbox" name="uitgelicht" value="aan" defaultChecked={gegevens.uitgelicht} />
            Uitlichten: groot bovenaan de voorpagina
          </label>
        </fieldset>

        <fieldset className="velden-rij">
          <legend>Beeld</legend>
          <label>
            Afbeelding (adres, begint met https://)
            <input name="afbeelding_url" type="url" defaultValue={gegevens.afbeeldingUrl} placeholder="https://…" />
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

        <fieldset className="taalblok">
          <legend>{taalNamen[origineel]} (origineel)</legend>
          <Tekstblok
            key={origineel}
            taal={origineel}
            t={gegevens.teksten[origineel] ?? leeg}
            verplicht
          />
        </fieldset>

        {/* Bestaande vertalingen: te verbeteren met de hand (W-TAAL-07). */}
        {!nieuw && andere.length > 0 && (
          <fieldset className="taalblok vertalingen">
            <legend>Vertalingen</legend>
            <p className="uitleg">
              Een vertaling die je hier verandert, telt als met de hand verbeterd en wordt niet
              zonder bevestiging overschreven.
            </p>
            {andere.map((taal) => {
              const t = gegevens.teksten[taal];
              const info = gegevens.vertaalinfo[taal];
              const magSchrijven = mijnTalen.includes(taal);
              return (
                <details key={taal} className="vertaling">
                  <summary>
                    <strong>{taalNamen[taal]}</strong>{" "}
                    <span className={`vertaalstatus-label ${info?.status ?? ""}`}>{statusTekst(info)}</span>
                  </summary>
                  {t ? (
                    <fieldset disabled={!magSchrijven}>
                      {!magSchrijven && <p className="uitleg">Alleen lezen: je schrijft niet in deze taal.</p>}
                      <Tekstblok taal={taal} t={t} verplicht={false} />
                    </fieldset>
                  ) : (
                    <p className="uitleg">
                      Er is nog geen tekst in deze taal. Gebruik &lsquo;Vertalen naar andere talen&rsquo;
                      hieronder.
                    </p>
                  )}
                </details>
              );
            })}
          </fieldset>
        )}

        {nieuw && (
          <Vertaalschakelaars
            titel="Ook automatisch vertalen naar"
            talen={andere}
            namen={taalNamen}
            aan={aan}
            zetAan={zetAan}
          />
        )}

        {staat?.fout && (
          <p className="fout" role="alert">
            {staat.fout}
          </p>
        )}
        <div className="beheer-knoppen">
          <button type="submit" disabled={bezig}>
            {bezig
              ? "Bezig met opslaan…"
              : !nieuw
                ? "Opslaan"
                : aantal > 0
                  ? `Opslaan en vertalen naar ${aantal} ${aantal === 1 ? "taal" : "talen"}`
                  : `Alleen in het ${taalNamen[origineel]} opslaan`}
          </button>
          {!nieuw && (
            <small className="uitleg">
              Opslaan vertaalt niet automatisch. Werk de andere talen bij met &lsquo;Vertalen naar
              andere talen&rsquo;.
            </small>
          )}
        </div>
      </form>

      {!nieuw && gegevens.id && (
        <Vertaalpaneel
          id={gegevens.id}
          andere={andere}
          taalNamen={taalNamen}
          vertaalinfo={gegevens.vertaalinfo}
        />
      )}
    </>
  );
}

// "Vertalen naar andere talen" bij een bestaand artikel (W-TAAL-14, -15).
// Talen met een met de hand verbeterde vertaling staan standaard uit en
// worden alleen na bevestiging overschreven.
function Vertaalpaneel({
  id,
  andere,
  taalNamen,
  vertaalinfo,
}: {
  id: string;
  andere: Taal[];
  taalNamen: Record<Taal, string>;
  vertaalinfo: Partial<Record<Taal, Vertaalinfo>>;
}) {
  const [staat, actie, bezig] = useActionState(artikelVertalen, undefined);
  const handmatig = andere.filter((t) => vertaalinfo[t]?.handmatig);
  const [aan, zetAan] = useState<Taal[]>(andere.filter((t) => !handmatig.includes(t)));
  const gekozen = andere.filter((t) => aan.includes(t));
  const overschrijftHandmatig = gekozen.some((t) => handmatig.includes(t));
  const waarschuwing = Object.fromEntries(handmatig.map((t) => [t, "met de hand verbeterd"]));

  if (andere.length === 0) return null;
  return (
    <form action={actie} className="formulier vertaalpaneel">
      <h2>Vertalen naar andere talen</h2>
      <input type="hidden" name="id" value={id} />
      <p className="uitleg">
        Vertaalt de opgeslagen tekst. De vertalingen verschijnen vanzelf zodra de Claude-app op de
        MacBook de wachtrij heeft afgewerkt.
      </p>
      <Vertaalschakelaars
        titel="Talen"
        talen={andere}
        namen={taalNamen}
        aan={aan}
        zetAan={zetAan}
        waarschuwing={waarschuwing}
      />
      {overschrijftHandmatig && (
        <label className="vinkje">
          <input type="checkbox" name="overschrijven" value="aan" required />
          Ja, overschrijf de met de hand verbeterde vertalingen
        </label>
      )}
      {staat?.fout && (
        <p className="fout" role="alert">
          {staat.fout}
        </p>
      )}
      {staat?.melding && (
        <p className="melding" role="status">
          {staat.melding}
        </p>
      )}
      <div className="beheer-knoppen">
        <button type="submit" disabled={bezig || gekozen.length === 0}>
          {bezig
            ? "Bezig…"
            : `Vertalen naar ${gekozen.length} ${gekozen.length === 1 ? "taal" : "talen"}`}
        </button>
      </div>
    </form>
  );
}
