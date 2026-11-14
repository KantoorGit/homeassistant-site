"use client";

import { useActionState, useState } from "react";
import {
  bewerkEigen,
  nieuweDraad,
  reageer,
  vertaalBericht,
  type Forumstaat,
} from "@/app/[lang]/forum/acties";
import Formulierknop from "@/components/Formulierknop";
import Vertaalschakelaars from "@/components/Vertaalschakelaars";
import { isPostTaal, onderwerpen, postTaalNamen, postTalen } from "@/lib/forum";
import { teksten, type Taal } from "@/lib/site";
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

function TaalKeuze({
  taal,
  waarde,
  zetWaarde,
}: {
  taal: Taal;
  waarde: Taal;
  zetWaarde: (t: Taal) => void;
}) {
  const t = ledenTeksten[taal].forum;
  return (
    <label>
      {t.taalVeld}
      <select
        name="taal"
        value={waarde}
        onChange={(e) => isPostTaal(e.target.value) && zetWaarde(e.target.value)}
      >
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

// Taal van het bericht en de schakelaars per taal (W-TAAL-12, -13).
function useVertaalkeuze(taal: Taal, actieveTalen: Taal[], gekozen?: string) {
  const [postTaal, zetPostTaal] = useState<Taal>(isPostTaal(gekozen) ? gekozen : taal);
  const [aan, zetAan] = useState<Taal[]>(actieveTalen);
  const andere = actieveTalen.filter((t) => t !== postTaal);
  const gekozenTalen = andere.filter((t) => aan.includes(t));
  return { postTaal, zetPostTaal, aan, zetAan, andere, gekozenTalen };
}

function Plaatsen({
  taal,
  postTaal,
  aantal,
}: {
  taal: Taal;
  postTaal: Taal;
  aantal: number;
}) {
  const t = ledenTeksten[taal];
  return (
    <Formulierknop bezig={t.bezig}>
      {aantal > 0
        ? t.forum.plaatsenEnVertalen(aantal)
        : t.forum.alleenPlaatsenIn(teksten[taal].taalNaam[postTaal])}
    </Formulierknop>
  );
}

export function NieuweDraadFormulier({
  taal,
  onderwerp,
  actieveTalen,
}: {
  taal: Taal;
  onderwerp?: string;
  actieveTalen: Taal[];
}) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(nieuweDraad.bind(null, taal), leeg);
  const w = staat.waarden;
  const v = useVertaalkeuze(taal, actieveTalen, w?.taal);

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
      <TaalKeuze taal={taal} waarde={v.postTaal} zetWaarde={v.zetPostTaal} />
      <label>
        {t.forum.tekst}
        <textarea name="tekst" required minLength={2} maxLength={20000} rows={12} defaultValue={w?.tekst} />
        <small>{t.forum.codeUitleg}</small>
      </label>
      <Vertaalschakelaars
        titel={t.forum.vertalenNaar}
        talen={v.andere}
        namen={postTaalNamen[taal]}
        aan={v.aan}
        zetAan={v.zetAan}
      />
      <Plaatsen taal={taal} postTaal={v.postTaal} aantal={v.gekozenTalen.length} />
    </form>
  );
}

export function Reactieformulier({
  taal,
  draadId,
  pad,
  actieveTalen,
}: {
  taal: Taal;
  draadId: number;
  pad: string;
  actieveTalen: Taal[];
}) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(reageer.bind(null, taal, draadId, pad), leeg);
  // Na een geslaagde reactie is het veld leeg; na een fout blijft de tekst staan.
  const w = staat.fout ? staat.waarden : undefined;
  const v = useVertaalkeuze(taal, actieveTalen, w?.taal);

  return (
    <form action={actie} className="formulier formulier-breed" key={staat.poging}>
      <h2>{t.forum.reageren}</h2>
      <Uitkomst staat={staat} />
      <label>
        {t.forum.jouwReactie}
        <textarea name="tekst" required minLength={2} maxLength={20000} rows={6} defaultValue={w?.tekst} />
        <small>{t.forum.codeUitleg}</small>
      </label>
      <TaalKeuze taal={taal} waarde={v.postTaal} zetWaarde={v.zetPostTaal} />
      <Vertaalschakelaars
        titel={t.forum.vertalenNaar}
        talen={v.andere}
        namen={postTaalNamen[taal]}
        aan={v.aan}
        zetAan={v.zetAan}
      />
      <Plaatsen taal={taal} postTaal={v.postTaal} aantal={v.gekozenTalen.length} />
    </form>
  );
}

// Eigen bericht bewerken (W-FOR-09). Daarna niet automatisch vertalen
// (W-TAAL-14): de schrijver gebruikt de vertaalknop.
export function BewerkFormulier({
  taal,
  berichtId,
  pad,
  tekst,
  titel,
}: {
  taal: Taal;
  berichtId: number;
  pad: string;
  tekst: string;
  // Alleen bij het openingsbericht: de titel van de discussie.
  titel?: string;
}) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(bewerkEigen.bind(null, taal, berichtId, pad), leeg);
  const w = staat.fout ? staat.waarden : undefined;
  return (
    <form action={actie} className="formulier formulier-breed">
      <Uitkomst staat={staat} />
      {titel !== undefined && (
        <label>
          {t.forum.titelVeld}
          <input name="titel" required minLength={5} maxLength={150} defaultValue={w?.titel ?? titel} />
        </label>
      )}
      <label>
        {t.forum.tekst}
        <textarea name="tekst" required minLength={2} maxLength={20000} rows={8} defaultValue={w?.tekst ?? tekst} />
        <small>{t.forum.codeUitleg}</small>
      </label>
      <Formulierknop bezig={t.bezig}>{t.forum.bewerkenOpslaan}</Formulierknop>
    </form>
  );
}

// "Vertalen naar andere talen" bij een eigen bericht (W-TAAL-14).
export function VertaalFormulier({
  taal,
  berichtId,
  pad,
  postTaal,
  actieveTalen,
}: {
  taal: Taal;
  berichtId: number;
  pad: string;
  postTaal: Taal;
  actieveTalen: Taal[];
}) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(vertaalBericht.bind(null, taal, berichtId, pad), leeg);
  const andere = actieveTalen.filter((x) => x !== postTaal);
  const [aan, zetAan] = useState<Taal[]>(andere);
  const aantal = andere.filter((x) => aan.includes(x)).length;
  return (
    <form action={actie} className="formulier formulier-breed">
      <Uitkomst staat={staat} />
      <Vertaalschakelaars
        titel={t.forum.vertaalknop}
        talen={andere}
        namen={postTaalNamen[taal]}
        aan={aan}
        zetAan={zetAan}
      />
      <Formulierknop bezig={t.bezig} soort="licht">
        {t.forum.vertaalStarten(aantal)}
      </Formulierknop>
    </form>
  );
}
