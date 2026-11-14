"use client";

import type { Taal } from "@/lib/site";

// Per taal een schakelaar, standaard aan (W-TAAL-12). De knop eronder zegt
// wat er gaat gebeuren (W-TAAL-13). Gebruikt in het forum en in het
// beheerpaneel.
export default function Vertaalschakelaars({
  titel,
  talen,
  namen,
  aan,
  zetAan,
  naam = "vertaal",
  waarschuwing,
}: {
  titel: string;
  talen: Taal[];
  namen: Record<Taal, string>;
  aan: Taal[];
  zetAan: (talen: Taal[]) => void;
  naam?: string;
  // Extra uitleg bij een taal, bijvoorbeeld "met de hand verbeterd".
  waarschuwing?: Partial<Record<Taal, string>>;
}) {
  if (talen.length === 0) return null;
  return (
    <fieldset className="vertaalschakelaars">
      <legend>{titel}</legend>
      {talen.map((t) => {
        const actief = aan.includes(t);
        return (
          <label key={t} className={`schakelaar${actief ? " schakelaar-aan" : ""}`}>
            <input
              type="checkbox"
              role="switch"
              name={naam}
              value={t}
              checked={actief}
              onChange={(e) =>
                zetAan(e.target.checked ? [...aan, t] : aan.filter((x) => x !== t))
              }
            />
            <span className="schakelaar-baan" aria-hidden="true" />
            <span lang={t === "zh" ? "zh-Hans" : t}>{namen[t]}</span>
            {waarschuwing?.[t] && <small className="schakelaar-let-op">{waarschuwing[t]}</small>}
          </label>
        );
      })}
    </fieldset>
  );
}
