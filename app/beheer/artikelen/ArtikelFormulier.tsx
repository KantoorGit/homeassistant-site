"use client";

import { useActionState, useState } from "react";
import Vertaalschakelaars from "@/components/Vertaalschakelaars";
import { telTekst, vul, type BeheerTeksten } from "@/lib/beheer/teksten";
import type { Taal } from "@/lib/site";
import { artikelOpslaan, artikelVertalen } from "../acties";
import Mediaveld from "./Mediaveld";
import Plekkiezer from "./Plekkiezer";

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
  positie: number | null;
  afbeeldingUrl: string;
  videoUrl: string;
  teksten: Partial<Record<Taal, Tekstvelden>>;
  vertaalinfo: Partial<Record<Taal, Vertaalinfo>>;
};

type T = BeheerTeksten;

function Tekstblok({
  taal,
  t,
  waarden,
  verplicht,
}: {
  taal: Taal;
  t: T["formulier"];
  waarden: Tekstvelden;
  verplicht: boolean;
}) {
  return (
    <div className="taalvelden">
      <label>
        {t.kop}
        <input name={`kop_${taal}`} defaultValue={waarden.kop} required={verplicht} lang={taal} />
      </label>
      <label>
        {t.intro}
        <textarea name={`intro_${taal}`} defaultValue={waarden.intro} rows={2} lang={taal} />
      </label>
      <label>
        {t.tekst}
        <textarea name={`tekst_${taal}`} defaultValue={waarden.tekst} rows={verplicht ? 14 : 8} lang={taal} />
        <small>{t.tekstUitleg}</small>
      </label>
      <label>
        {t.webadres}
        <input name={`slug_${taal}`} defaultValue={waarden.slug} placeholder={t.webadresVoorbeeld} />
      </label>
    </div>
  );
}

function statusTekst(t: T["formulier"], info?: Vertaalinfo): string {
  if (!info) return t.nogNietVertaald;
  const delen: string[] = [];
  if (info.status === "wachtend" || info.status === "bezig") delen.push(t.inWachtrij);
  if (info.status === "mislukt") delen.push(`${t.vertalenMislukt}${info.fout ? `: ${info.fout}` : ""}`);
  if (info.handmatig) delen.push(t.handmatig);
  else if (info.automatisch) delen.push(t.automatisch);
  return delen.join(" · ") || t.vertaald;
}

export default function ArtikelFormulier({
  gegevens,
  categorieen,
  overigNaam,
  talen,
  actieveTalen,
  taalNamen,
  mijnTalen,
  opgeslagen,
  bezettePlekken,
  t,
  supabaseUrl,
  supabaseSleutel,
}: {
  gegevens: FormulierGegevens;
  // 'verwijderd' = de categorie van dit artikel is verwijderd: het staat op de
  // site onder Overig, maar onthoudt zijn categorie (W-ADM-14).
  categorieen: { id: string; naam: string; verwijderd?: boolean }[];
  overigNaam: string;
  talen: Taal[];
  actieveTalen: Taal[];
  taalNamen: Record<Taal, string>;
  mijnTalen: Taal[];
  opgeslagen: boolean;
  bezettePlekken: Record<number, { id: string; kop: string }>;
  t: T;
  supabaseUrl: string;
  supabaseSleutel: string;
}) {
  const f = t.formulier;
  const [staat, actie, bezig] = useActionState(artikelOpslaan, undefined);
  const [origineel, zetOrigineel] = useState<Taal>(gegevens.origineleTaal);
  const nieuw = !gegevens.id;
  const andere = actieveTalen.filter((x) => x !== origineel);
  // Nieuw artikel: standaard naar alle andere talen vertalen (W-TAAL-11, -12).
  const [aan, zetAan] = useState<Taal[]>(actieveTalen);
  const aantal = andere.filter((x) => aan.includes(x)).length;
  const leeg: Tekstvelden = { kop: "", intro: "", tekst: "", slug: "" };

  return (
    <>
      <form action={actie} className="formulier artikel-formulier">
        {gegevens.id && <input type="hidden" name="id" value={gegevens.id} />}
        <input type="hidden" name="huidige_categorie" value={gegevens.categorie} />

        {opgeslagen && !staat?.fout && !bezig && (
          <p className="melding" role="status">
            {f.opgeslagen}
          </p>
        )}

        <fieldset className="velden-rij">
          <legend>{f.plaatsing}</legend>
          <label>
            {f.categorie}
            <select name="categorie" defaultValue={gegevens.categorie} required>
              <option value="" disabled>
                {f.kies}
              </option>
              {categorieen.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.verwijderd ? vul(f.verwijderdeCategorie, { naam: c.naam, overig: overigNaam }) : c.naam}
                </option>
              ))}
            </select>
          </label>
          <label>
            {f.taalSchrijf}
            <select
              name="originele_taal"
              value={origineel}
              onChange={(e) => zetOrigineel(e.target.value as Taal)}
            >
              {talen.map((x) => (
                <option key={x} value={x} disabled={!mijnTalen.includes(x)}>
                  {taalNamen[x]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {f.auteur}
            <input name="auteur" defaultValue={gegevens.auteur} />
          </label>
        </fieldset>

        <fieldset className="velden-rij publicatie">
          <legend>{f.publicatie}</legend>
          <label>
            {f.status}
            <select name="status" defaultValue={gegevens.status}>
              <option value="concept">{f.statusConcept}</option>
              <option value="gepubliceerd">{f.statusPubliceren}</option>
            </select>
          </label>
          <label>
            {f.publicatieTijd}
            <input type="datetime-local" name="gepubliceerd_op" defaultValue={gegevens.gepubliceerdOp} />
            <small>{f.publicatieUitleg}</small>
          </label>
          <Plekkiezer t={t.plek} waarde={gegevens.positie} bezet={bezettePlekken} eigenId={gegevens.id} />
        </fieldset>

        <fieldset className="velden-rij beeld">
          <legend>{f.beeld}</legend>
          <div className="beeld-blok">
            <h3>{f.afbeelding}</h3>
            <Mediaveld
              soort="afbeelding"
              naam="afbeelding_url"
              waarde={gegevens.afbeeldingUrl}
              t={f}
              supabaseUrl={supabaseUrl}
              supabaseSleutel={supabaseSleutel}
            />
          </div>
          <div className="beeld-blok">
            <h3>{f.video}</h3>
            <Mediaveld
              soort="video"
              naam="video_url"
              waarde={gegevens.videoUrl}
              t={f}
              supabaseUrl={supabaseUrl}
              supabaseSleutel={supabaseSleutel}
            />
          </div>
        </fieldset>

        <fieldset className="taalblok">
          <legend>{vul(f.origineel, { taal: taalNamen[origineel] })}</legend>
          <Tekstblok
            key={origineel}
            taal={origineel}
            t={f}
            waarden={gegevens.teksten[origineel] ?? leeg}
            verplicht
          />
        </fieldset>

        {/* Bestaande vertalingen: te verbeteren met de hand (W-TAAL-07). */}
        {!nieuw && andere.length > 0 && (
          <fieldset className="taalblok vertalingen">
            <legend>{f.vertalingen}</legend>
            <p className="uitleg">{f.vertalingenUitleg}</p>
            {andere.map((taal) => {
              const tekst = gegevens.teksten[taal];
              const info = gegevens.vertaalinfo[taal];
              const magSchrijven = mijnTalen.includes(taal);
              return (
                <details key={taal} className="vertaling">
                  <summary>
                    <strong>{taalNamen[taal]}</strong>{" "}
                    <span className={`vertaalstatus-label ${info?.status ?? ""}`}>{statusTekst(f, info)}</span>
                  </summary>
                  {tekst ? (
                    <fieldset disabled={!magSchrijven}>
                      {!magSchrijven && <p className="uitleg">{f.alleenLezen}</p>}
                      <Tekstblok taal={taal} t={f} waarden={tekst} verplicht={false} />
                    </fieldset>
                  ) : (
                    <p className="uitleg">{f.nogGeenTekst}</p>
                  )}
                </details>
              );
            })}
          </fieldset>
        )}

        {nieuw && (
          <Vertaalschakelaars titel={f.ookVertalen} talen={andere} namen={taalNamen} aan={aan} zetAan={zetAan} />
        )}

        {staat?.fout && (
          <p className="fout" role="alert">
            {staat.fout}
          </p>
        )}
        <div className="beheer-knoppen">
          <button type="submit" disabled={bezig}>
            {bezig
              ? f.opslaanBezig
              : !nieuw
                ? t.algemeen.opslaan
                : aantal > 0
                  ? telTekst(aantal, f.opslaanVertalen1, f.opslaanVertalenN)
                  : vul(f.alleenOpslaanIn, { taal: taalNamen[origineel] })}
          </button>
          {!nieuw && <small className="uitleg">{f.opslaanVertaaltNiet}</small>}
        </div>
      </form>

      {!nieuw && gegevens.id && (
        <Vertaalpaneel
          id={gegevens.id}
          andere={andere}
          taalNamen={taalNamen}
          vertaalinfo={gegevens.vertaalinfo}
          t={t}
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
  t,
}: {
  id: string;
  andere: Taal[];
  taalNamen: Record<Taal, string>;
  vertaalinfo: Partial<Record<Taal, Vertaalinfo>>;
  t: T;
}) {
  const v = t.vertaalpaneel;
  const [staat, actie, bezig] = useActionState(artikelVertalen, undefined);
  const handmatig = andere.filter((x) => vertaalinfo[x]?.handmatig);
  const [aan, zetAan] = useState<Taal[]>(andere.filter((x) => !handmatig.includes(x)));
  const gekozen = andere.filter((x) => aan.includes(x));
  const overschrijftHandmatig = gekozen.some((x) => handmatig.includes(x));
  const waarschuwing = Object.fromEntries(handmatig.map((x) => [x, t.formulier.handmatig]));

  if (andere.length === 0) return null;
  return (
    <form action={actie} className="formulier vertaalpaneel">
      <h2>{v.titel}</h2>
      <input type="hidden" name="id" value={id} />
      <p className="uitleg">{v.uitleg}</p>
      <Vertaalschakelaars
        titel={v.talen}
        talen={andere}
        namen={taalNamen}
        aan={aan}
        zetAan={zetAan}
        waarschuwing={waarschuwing}
      />
      {overschrijftHandmatig && (
        <label className="vinkje">
          <input type="checkbox" name="overschrijven" value="aan" required />
          {v.overschrijven}
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
          {bezig ? t.algemeen.bezig : telTekst(gekozen.length, v.vertalen1, v.vertalenN)}
        </button>
      </div>
    </form>
  );
}
