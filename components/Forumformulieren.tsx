"use client";

import { useActionState } from "react";
import { nieuweDraad, reageer, type Forumstaat } from "@/app/[lang]/forum/acties";
import Formulierknop from "@/components/Formulierknop";
import { onderwerpen, postTaalNamen, postTalen } from "@/lib/forum";
import type { Taal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

const leeg: Forumstaat = {};

function Uitkomst({ staat }: { staat: Forumstaat }) {
  return (
    <>
      {staat.fout && (
        <p className="formulier-fout" role="alert">
          {staat.fout}
        </p>
      )}
      {staat.melding && (
        <p className="formulier-melding" role="status">
          {staat.melding}
        </p>
      )}
    </>
  );
}

function TaalKeuze({ taal, gekozen }: { taal: Taal; gekozen?: string }) {
  const t = ledenTeksten[taal].forum;
  return (
    <label>
      {t.taalVeld}
      <select name="taal" defaultValue={gekozen || taal}>
        {postTalen.map((p) => (
          <option key={p} value={p} lang={p}>
            {postTaalNamen[taal][p]}
          </option>
        ))}
      </select>
      <small>{t.taalUitleg}</small>
    </label>
  );
}

export function NieuweDraadFormulier({
  taal,
  onderwerp,
}: {
  taal: Taal;
  onderwerp?: string;
}) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(nieuweDraad.bind(null, taal), leeg);
  const w = staat.waarden;

  return (
    <form action={actie} className="formulier formulier-breed" key={staat.poging}>
      <Uitkomst staat={staat} />
      <label>
        {t.forum.onderwerp}
        <select name="onderwerp" required defaultValue={w?.onderwerp ?? onderwerp ?? ""}>
          <option value="" disabled>
            —
          </option>
          {onderwerpen.map((o) => (
            <option key={o.id} value={o.id}>
              {o.naam[taal]}
            </option>
          ))}
        </select>
      </label>
      <label>
        {t.forum.titelVeld}
        <input name="titel" required minLength={5} maxLength={150} defaultValue={w?.titel} />
        <small>{t.forum.titelUitleg}</small>
      </label>
      <TaalKeuze taal={taal} gekozen={w?.taal} />
      <label>
        {t.forum.tekst}
        <textarea name="tekst" required minLength={2} maxLength={20000} rows={12} defaultValue={w?.tekst} />
        <small>{t.forum.codeUitleg}</small>
      </label>
      <Formulierknop bezig={t.bezig}>{t.forum.plaatsen}</Formulierknop>
    </form>
  );
}

export function Reactieformulier({
  taal,
  draadId,
  pad,
}: {
  taal: Taal;
  draadId: number;
  pad: string;
}) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(reageer.bind(null, taal, draadId, pad), leeg);
  // Na een geslaagde reactie is het veld leeg; na een fout blijft de tekst staan.
  const w = staat.fout ? staat.waarden : undefined;

  return (
    <form action={actie} className="formulier formulier-breed" key={staat.poging}>
      <h2>{t.forum.reageren}</h2>
      <Uitkomst staat={staat} />
      <label>
        {t.forum.jouwReactie}
        <textarea name="tekst" required minLength={2} maxLength={20000} rows={6} defaultValue={w?.tekst} />
        <small>{t.forum.codeUitleg}</small>
      </label>
      <TaalKeuze taal={taal} gekozen={w?.taal} />
      <Formulierknop bezig={t.bezig}>{t.forum.plaatsen}</Formulierknop>
    </form>
  );
}
