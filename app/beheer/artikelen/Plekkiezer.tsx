"use client";

import { useState } from "react";
import type { BeheerTeksten } from "@/lib/beheer/teksten";
import { vul } from "@/lib/beheer/teksten";

// Plek op de voorpagina kiezen met een plaatje van de voorpagina
// (W-ADM-17): groot bovenaan (positie 1) of één van de zes plekken in het
// raster eronder (positie 2-7, op het scherm "Plek 1" t/m "Plek 6").
export default function Plekkiezer({
  t,
  waarde,
  bezet,
  eigenId,
}: {
  t: BeheerTeksten["plek"];
  waarde: number | null;
  bezet: Record<number, { id: string; kop: string }>;
  eigenId: string | null;
}) {
  const [gekozen, zetGekozen] = useState<number | null>(waarde);

  // Een gewone functie (geen los component), zodat de keuzerondjes bij een
  // klik niet opnieuw worden opgebouwd.
  function vak(positie: number, titel: string, klasse: string) {
    const bezetter = bezet[positie];
    const vanAnder = bezetter && bezetter.id !== eigenId;
    const actief = gekozen === positie;
    return (
      <label key={positie} className={`plek ${klasse}${actief ? " plek-gekozen" : ""}${vanAnder ? " plek-bezet" : ""}`}>
        <input
          type="radio"
          name="positie"
          value={positie}
          checked={actief}
          onChange={() => zetGekozen(positie)}
        />
        <span className="plek-titel">{titel}</span>
        <small className="plek-stand">
          {actief ? t.dit : vanAnder ? vul(t.nu, { kop: bezetter.kop }) : t.vrij}
        </small>
      </label>
    );
  }

  return (
    <fieldset className="plekkiezer">
      <legend>{t.legend}</legend>
      <p className="uitleg">{t.uitleg}</p>
      <input type="hidden" name="huidige_positie" value={waarde ?? ""} />
      <div className="plek-voorbeeld">
        <div className="plek-hoofdkolom">
          {vak(1, t.groot, "plek-groot")}
          <div className="plek-raster">
            {[2, 3, 4, 5, 6, 7].map((p) => vak(p, vul(t.plekN, { n: p - 1 }), "plek-klein"))}
          </div>
        </div>
        <div className="plek-zijkolom" aria-hidden="true">
          <span>{t.laatsteNieuws}</span>
          <i />
          <i />
          <i />
          <i />
        </div>
      </div>
      <label className={`plek-geen${gekozen === null ? " plek-gekozen" : ""}`}>
        <input
          type="radio"
          name="positie"
          value=""
          checked={gekozen === null}
          onChange={() => zetGekozen(null)}
        />
        <span>
          <strong>{t.geen}</strong> <small>{t.geenUitleg}</small>
        </span>
      </label>
    </fieldset>
  );
}
