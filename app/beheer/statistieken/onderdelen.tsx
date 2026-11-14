import Link from "next/link";
import type { Rij } from "@/lib/beheer/statistieken";
import { landcode, type BeheerTeksten } from "@/lib/beheer/teksten";
import type { Taal } from "@/lib/site";

// Bouwstenen van het statistiekendashboard: tegels, staafjes per dag en
// tabellen met CSV-download, in de taal van het beheerpaneel.

type StatT = BeheerTeksten["stat"];

const getallen = new Map<Taal, Intl.NumberFormat>();
function getalOpmaak(taal: Taal): Intl.NumberFormat {
  let f = getallen.get(taal);
  if (!f) {
    f = new Intl.NumberFormat(landcode[taal]);
    getallen.set(taal, f);
  }
  return f;
}

export function duur(ms: number | null | undefined): string {
  const s = Math.round((ms ?? 0) / 1000);
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  return `${m} min ${String(s % 60).padStart(2, "0")} s`;
}

export type Soort = "tekst" | "getal" | "ms" | "pct" | "seconden";

export function opmaak(waarde: unknown, soort: Soort, taal: Taal = "nl"): string {
  const getal = getalOpmaak(taal);
  if (waarde === null || waarde === undefined || waarde === "") return "–";
  switch (soort) {
    case "getal":
      return getal.format(Number(waarde));
    case "ms":
      return duur(Number(waarde));
    case "pct":
      return `${getal.format(Number(waarde))}%`;
    case "seconden":
      return getal.format(Number(waarde));
    default:
      return String(waarde);
  }
}

function verschil(nu: number, vorig: number, nieuw: string): { tekst: string; richting: "op" | "neer" | "gelijk" } {
  if (!vorig) return { tekst: nu ? nieuw : "–", richting: "gelijk" };
  const pct = Math.round(((nu - vorig) / vorig) * 100);
  return {
    tekst: `${pct > 0 ? "+" : ""}${pct}%`,
    richting: pct > 0 ? "op" : pct < 0 ? "neer" : "gelijk",
  };
}

export function Tegel({
  titel,
  waarde,
  vorig,
  soort = "getal",
  lagerIsBeter = false,
  t,
  taal,
}: {
  titel: string;
  waarde: number;
  vorig?: number;
  soort?: Soort;
  lagerIsBeter?: boolean;
  t: StatT;
  taal: Taal;
}) {
  const v = vorig === undefined ? null : verschil(waarde, vorig, t.nieuw);
  const goed = v && v.richting !== "gelijk" && (v.richting === "op") !== lagerIsBeter;
  return (
    <div className="stat-tegel">
      <p className="stat-titel">{titel}</p>
      <p className="stat-waarde">{opmaak(waarde, soort, taal)}</p>
      {v && (
        <p className={`stat-verschil ${v.richting === "gelijk" ? "" : goed ? "goed" : "minder"}`}>
          {v.richting === "op" ? "▲ " : v.richting === "neer" ? "▼ " : ""}
          {v.tekst} <span>{t.tovVorige}</span>
        </p>
      )}
    </div>
  );
}

// Staafjes per dag (één reeks, dus geen legenda; de titel zegt wat het is).
// Elke staaf heeft een tooltip; de tabel eronder geeft dezelfde cijfers.
export function Dagstaafjes({
  rijen,
  sleutel,
  titel,
  t,
  taal,
}: {
  rijen: Rij[];
  sleutel: string;
  titel: string;
  t: StatT;
  taal: Taal;
}) {
  const getal = getalOpmaak(taal);
  if (rijen.length === 0) return <p className="stat-leeg">{t.leeg}</p>;
  const hoogte = 160;
  const breedteVak = Math.max(8, Math.min(32, Math.floor(720 / rijen.length)));
  const staaf = Math.min(24, Math.max(4, breedteVak - 2));
  const max = Math.max(...rijen.map((r) => Number(r[sleutel]) || 0), 1);
  const stap = max <= 5 ? 1 : Math.pow(10, Math.floor(Math.log10(max)));
  const top = Math.ceil(max / stap) * stap;
  const lijnen = [0, top / 2, top];
  const breedte = rijen.length * breedteVak + 40;
  const datum = (d: unknown) =>
    new Date(`${d}T12:00:00Z`).toLocaleDateString(landcode[taal], { day: "numeric", month: "short" });

  return (
    <figure className="stat-grafiek">
      <figcaption>{titel}</figcaption>
      <div className="stat-grafiek-scroll">
        <svg
          viewBox={`0 0 ${breedte} ${hoogte + 24}`}
          width={breedte}
          height={hoogte + 24}
          role="img"
          aria-label={titel}
        >
          {lijnen.map((l) => {
            const y = hoogte - (l / top) * hoogte + 4;
            return (
              <g key={l}>
                <line x1={36} x2={breedte} y1={y} y2={y} className="stat-raster" />
                <text x={30} y={y + 4} textAnchor="end" className="stat-as">
                  {getal.format(l)}
                </text>
              </g>
            );
          })}
          {rijen.map((r, i) => {
            const w = Number(r[sleutel]) || 0;
            const h = Math.max(w ? 2 : 0, (w / top) * hoogte);
            const x = 40 + i * breedteVak + (breedteVak - staaf) / 2;
            const y = hoogte - h + 4;
            const radius = Math.min(4, h / 2, staaf / 2);
            // Afgeronde bovenkant, rechte onderkant op de basislijn.
            const pad = `M${x},${hoogte + 4} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + staaf - radius} Q${x + staaf},${y} ${x + staaf},${y + radius} V${hoogte + 4} Z`;
            return (
              <g key={String(r.dag)} className="stat-staaf">
                {/* Ruimere hoverzone dan de staaf zelf */}
                <rect x={40 + i * breedteVak} y={0} width={breedteVak} height={hoogte + 4} fill="transparent" />
                {h > 0 && <path d={pad} />}
                <title>{`${datum(r.dag)}: ${getal.format(w)}`}</title>
                {(i === 0 || i === rijen.length - 1 || rijen.length <= 8) && (
                  <text x={x + staaf / 2} y={hoogte + 20} textAnchor="middle" className="stat-as">
                    {datum(r.dag)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </figure>
  );
}

export type Kolom = { sleutel: string; label: string; soort?: Soort };

export function Tabel({
  titel,
  rijen,
  kolommen,
  csv,
  uitleg,
  alleenToestemming = false,
  t,
  taal,
}: {
  titel: string;
  rijen: Rij[] | undefined;
  kolommen: Kolom[];
  csv?: string;
  uitleg?: string;
  alleenToestemming?: boolean;
  t: StatT;
  taal: Taal;
}) {
  const lijst = rijen ?? [];
  const eersteGetal = kolommen.find((k) => k.soort === "getal");
  const max = eersteGetal ? Math.max(...lijst.map((r) => Number(r[eersteGetal.sleutel]) || 0), 1) : 1;
  return (
    <section className="stat-blok">
      <div className="stat-blok-kop">
        <h2>
          {titel}
          {alleenToestemming && <span className="etiket etiket-toestemming">{t.etiketToestemming}</span>}
        </h2>
        {csv && lijst.length > 0 && (
          <Link href={csv} className="knop-link" prefetch={false}>
            {t.csv}
          </Link>
        )}
      </div>
      {uitleg && <p className="stat-uitleg">{uitleg}</p>}
      {lijst.length === 0 ? (
        <p className="stat-leeg">{t.leeg}</p>
      ) : (
        <div className="tabel-scroll">
          <table className="beheer-tabel stat-tabel">
            <thead>
              <tr>
                {kolommen.map((k) => (
                  <th key={k.sleutel} className={k.soort && k.soort !== "tekst" ? "getal" : undefined}>
                    {k.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lijst.map((r, i) => (
                <tr key={i}>
                  {kolommen.map((k) => (
                    <td key={k.sleutel} className={k.soort && k.soort !== "tekst" ? "getal" : "tekstcel"}>
                      {k === eersteGetal ? (
                        <span className="stat-balk-cel">
                          <span
                            className="stat-balk"
                            style={{ width: `${Math.round(((Number(r[k.sleutel]) || 0) / max) * 100)}%` }}
                          />
                          <span>{opmaak(r[k.sleutel], k.soort ?? "tekst", taal)}</span>
                        </span>
                      ) : (
                        opmaak(r[k.sleutel], k.soort ?? "tekst", taal)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
