import type { Metadata } from "next";
import Link from "next/link";
import { alleArtikelen, kopVan } from "@/lib/beheer/artikelen";
import {
  haalRapport,
  haalRealtime,
  leesFilters,
  perioden,
  tabs,
  zoekdeel,
  type Filters,
  type Rapport,
  type Rij,
} from "@/lib/beheer/statistieken";
import { beheerT } from "@/lib/beheer/taal";
import { landcode, vul, type BeheerTeksten } from "@/lib/beheer/teksten";
import { vereisBeheerder } from "@/lib/beheer/toegang";
import { haalAlleCategorieen } from "@/lib/categorieen";
import { talen, teksten, type Categorie, type Taal } from "@/lib/site";
import { Dagstaafjes, Tabel, Tegel } from "./onderdelen";
import { maakSecties, vertaalWaarde } from "./secties";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await beheerT();
  return { title: t.overzicht.statistieken };
}

type Ctx = { t: BeheerTeksten; taal: Taal; f: Filters };

// Namen van tabbladen en perioden in de taal van het beheerpaneel.
function tabNaam(t: BeheerTeksten, id: string): string {
  const s = t.stat;
  return (
    {
      overzicht: s.tabOverzicht,
      realtime: s.tabRealtime,
      acquisitie: s.tabAcquisitie,
      doelgroep: s.tabDoelgroep,
      gedrag: s.tabGedrag,
      doelen: s.tabDoelen,
    } as Record<string, string>
  )[id] ?? id;
}

function periodeNaam(t: BeheerTeksten, id: string): string {
  const s = t.stat;
  return (
    { vandaag: s.periodeVandaag, "7": s.periode7, "28": s.periode28, "90": s.periode90, "365": s.periode365 } as Record<
      string,
      string
    >
  )[id] ?? id;
}

// Kanalen zoals ze in de database staan (filterwaarden blijven Nederlands).
const kanalen = ["Direct", "Organisch zoeken", "Verwijzing", "Social", "E-mail", "Campagne", "Intern"];

// Bezoekersstatistieken, alleen voor de beheerder met 2FA (W-ANA-50 t/m -54).
export default async function Statistieken({ searchParams }: PageProps<"/beheer/statistieken">) {
  const { supabase } = await vereisBeheerder();
  const { taal, t } = await beheerT();
  const f = leesFilters(await searchParams);
  const ctx: Ctx = { t, taal, f };

  const [{ rapport, fout }, categorieen] = await Promise.all([
    f.tab === "realtime" ? haalRealtime(supabase, f.alles) : haalRapport(supabase, f),
    haalAlleCategorieen(),
  ]);

  return (
    <section className="statistieken">
      <p className="terug">
        <Link href="/beheer">{t.algemeen.terugBeheer}</Link>
      </p>
      <div className="beheer-titelrij">
        <h1>{t.stat.titel}</h1>
      </div>

      <nav className="stat-tabs" aria-label={t.stat.rapporten}>
        {tabs.map((tab) => (
          <Link
            key={tab.id}
            href={`/beheer/statistieken?${zoekdeel({ ...f, tab: tab.id })}`}
            aria-current={tab.id === f.tab ? "page" : undefined}
          >
            {tabNaam(t, tab.id)}
          </Link>
        ))}
      </nav>

      <Filterbalk ctx={ctx} categorieen={categorieen} />

      {fout && (
        <p className="fout">
          {/meting_|does not exist|schema cache/i.test(fout) ? t.stat.nietKlaar : vul(t.stat.ophalenMislukt, { fout })}
        </p>
      )}

      {rapport && f.tab === "realtime" && <Realtime r={rapport} ctx={ctx} />}
      {rapport && f.tab === "overzicht" && <Overzicht r={rapport} ctx={ctx} />}
      {rapport && f.tab === "acquisitie" && (
        <Blokken r={rapport} ctx={ctx} namen={["kanalen", "verwijzers", "zoekmachines", "campagnes"]} />
      )}
      {rapport && f.tab === "doelgroep" && (
        <>
          <ToestemmingUitleg r={rapport} ctx={ctx} />
          <Blokken
            r={rapport}
            ctx={ctx}
            namen={[
              "landen",
              "regios",
              "steden",
              "sitetalen",
              "browsertalen",
              "apparaten",
              "browsers",
              "besturingssystemen",
              "schermen",
              "nieuw_terugkerend",
              "bezoekfrequentie",
            ]}
          />
        </>
      )}
      {rapport && f.tab === "gedrag" && (
        <Gedrag r={rapport} ctx={ctx} koppen={await artikelKoppen(supabase, taal, t)} categorieen={categorieen} />
      )}
      {rapport && f.tab === "doelen" && <Doelen r={rapport} ctx={ctx} />}
    </section>
  );
}

async function artikelKoppen(
  supabase: Awaited<ReturnType<typeof vereisBeheerder>>["supabase"],
  taal: Taal,
  t: BeheerTeksten,
): Promise<Map<string, string>> {
  const { artikelen } = await alleArtikelen(supabase);
  return new Map(artikelen.map((a) => [a.id, kopVan(a, taal, t.overzicht.zonderKop)]));
}

function Filterbalk({ ctx, categorieen }: { ctx: Ctx; categorieen: Categorie[] }) {
  const { t, taal, f } = ctx;
  const s = t.stat;
  return (
    <form className="stat-filters" method="get" action="/beheer/statistieken">
      <input type="hidden" name="tab" value={f.tab} />
      {f.tab !== "realtime" && (
        <label>
          {s.periode}
          <select name="periode" defaultValue={f.periode}>
            {perioden.map((p) => (
              <option key={p.id} value={p.id}>
                {periodeNaam(t, p.id)}
              </option>
            ))}
          </select>
        </label>
      )}
      {f.tab !== "realtime" && (
        <>
          <label>
            {s.taal}
            <select name="taal" defaultValue={f.taal}>
              <option value="">{t.algemeen.alle}</option>
              {talen.map((x) => (
                <option key={x} value={x}>
                  {teksten[taal].taalNaam[x]}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s.categorie}
            <select name="categorie" defaultValue={f.categorie}>
              <option value="">{t.algemeen.alle}</option>
              {categorieen
                .filter((c) => c.soort !== "voorpagina" && c.soort !== "laatste-nieuws")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.naam[taal]}
                  </option>
                ))}
            </select>
          </label>
          <label>
            {s.apparaat}
            <select name="apparaat" defaultValue={f.apparaat}>
              <option value="">{t.algemeen.alle}</option>
              <option value="computer">{t.waarde.computer}</option>
              <option value="tablet">{t.waarde.tablet}</option>
              <option value="telefoon">{t.waarde.telefoon}</option>
            </select>
          </label>
          <label>
            {s.kanaal}
            <select name="kanaal" defaultValue={f.kanaal}>
              <option value="">{t.algemeen.alle}</option>
              {kanalen.map((k) => (
                <option key={k} value={k}>
                  {String(vertaalWaarde(t, k))}
                </option>
              ))}
            </select>
          </label>
          <label>
            {s.land}
            <input name="land" defaultValue={f.land} placeholder={s.landVoorbeeld} size={4} maxLength={2} />
          </label>
        </>
      )}
      <label className="stat-vinkje">
        <input type="checkbox" name="alles" value="1" defaultChecked={f.alles} />
        {s.ookRedactie}
      </label>
      <button type="submit" className="knop">
        {s.toon}
      </button>
    </form>
  );
}

function csvAdres(f: Filters, sectie: string): string {
  return `/beheer/statistieken/csv?${zoekdeel(f, { sectie })}`;
}

// Tabellen waarvan de namen uit de database vertaald worden.
const metVertaaldeNamen = new Set(["kanalen", "apparaten", "nieuw_terugkerend"]);

function Blokken({
  r,
  ctx,
  namen,
  rijen,
}: {
  r: Rapport;
  ctx: Ctx;
  namen: string[];
  rijen?: Record<string, Rij[]>;
}) {
  const { t, taal, f } = ctx;
  const secties = maakSecties(t);
  return (
    <div className="stat-raster">
      {namen.map((n) => {
        const s = secties[n];
        let lijst = rijen?.[n] ?? (r[n] as Rij[] | undefined);
        if (lijst && metVertaaldeNamen.has(n)) {
          lijst = lijst.map((rij) => ({ ...rij, naam: vertaalWaarde(t, rij.naam) }));
        }
        return (
          <Tabel
            key={n}
            titel={s.titel}
            kolommen={s.kolommen}
            uitleg={s.uitleg}
            alleenToestemming={s.alleenToestemming}
            rijen={lijst}
            csv={csvAdres(f, n)}
            t={t.stat}
            taal={taal}
          />
        );
      })}
    </div>
  );
}

function ToestemmingUitleg({ r, ctx }: { r: Rapport; ctx: Ctx }) {
  const s = ctx.t.stat;
  const pct = Number(r.overzicht?.uitgebreid_pct ?? 0);
  return (
    <p className="stat-toestemming">
      <strong>{new Intl.NumberFormat(landcode[ctx.taal]).format(pct)}%</strong> {s.toestemming1}{" "}
      <span className="etiket etiket-toestemming">{s.etiketToestemming}</span> {s.toestemming2}
    </p>
  );
}

function Overzicht({ r, ctx }: { r: Rapport; ctx: Ctx }) {
  const { t, taal } = ctx;
  const s = t.stat;
  const o = r.overzicht ?? {};
  const v = r.vorige ?? {};
  const n = (x: unknown) => Number(x ?? 0);
  const tegel = { t: s, taal };
  return (
    <>
      <div className="stat-tegels">
        <Tegel titel={s.bezoekers} waarde={n(o.bezoekers)} vorig={n(v.bezoekers)} {...tegel} />
        <Tegel titel={s.sessies} waarde={n(o.sessies)} vorig={n(v.sessies)} {...tegel} />
        <Tegel titel={s.paginaweergaven} waarde={n(o.paginaweergaven)} vorig={n(v.paginaweergaven)} {...tegel} />
        <Tegel titel={s.gemTijd} waarde={n(o.gem_actieve_ms)} vorig={n(v.gem_actieve_ms)} soort="ms" {...tegel} />
        <Tegel
          titel={s.eenPagina}
          waarde={n(o.een_pagina_pct)}
          vorig={n(v.een_pagina_pct)}
          soort="pct"
          lagerIsBeter
          {...tegel}
        />
      </div>
      <ToestemmingUitleg r={r} ctx={ctx} />
      <Dagstaafjes rijen={(r.per_dag as Rij[]) ?? []} sleutel="sessies" titel={s.sessiesPerDag} t={s} taal={taal} />
      <details className="stat-tabelweergave">
        <summary>{s.cijfersTabel}</summary>
        <Blokken r={r} ctx={ctx} namen={["per_dag"]} />
      </details>
      <Blokken r={r} ctx={ctx} namen={["kanalen", "paginas", "landen", "apparaten"]} />
    </>
  );
}

function Gedrag({
  r,
  ctx,
  koppen,
  categorieen,
}: {
  r: Rapport;
  ctx: Ctx;
  koppen: Map<string, string>;
  categorieen: Categorie[];
}) {
  const artikelen = ((r.artikelen as Rij[]) ?? []).map((a) => ({
    ...a,
    kop: koppen.get(String(a.id)) ?? String(a.pad ?? a.id),
  }));
  // Categorie-id's uit de meting als naam in de taal van het beheerpaneel.
  const categorieRijen = ((r.categorieen as Rij[]) ?? []).map((c) => ({
    ...c,
    naam: categorieen.find((x) => x.id === c.naam)?.naam[ctx.taal] ?? c.naam,
  }));
  return (
    <Blokken
      r={r}
      ctx={ctx}
      rijen={{ artikelen, categorieen: categorieRijen }}
      namen={[
        "paginas",
        "artikelen",
        "categorieen",
        "instap",
        "uitstap",
        "paden",
        "klikken",
        "scroll",
        "video",
        "trainingen",
        "zoeken",
        "fouten404",
        "snelheid",
      ]}
    />
  );
}

function Doelen({ r, ctx }: { r: Rapport; ctx: Ctx }) {
  const { t } = ctx;
  const s = t.stat;
  const tr = r.trechter ?? {};
  const stappen = [
    { naam: s.trechterBekeken, aantal: Number(tr.registratie_bekeken ?? 0) },
    { naam: s.trechterAccount, aantal: Number(tr.registratie_voltooid ?? 0) },
    { naam: s.trechter2fa, aantal: Number(tr.tweefactor_gekoppeld ?? 0) },
    { naam: s.trechterBericht, aantal: Number(tr.eerste_bericht ?? 0) },
  ];
  const max = Math.max(stappen[0].aantal, 1);
  const doelen = ((r.doelen as Rij[]) ?? []).map((d) => ({
    ...d,
    naam: (t.doel as Record<string, string>)[String(d.naam)] ?? d.naam,
  }));
  return (
    <>
      <section className="stat-blok">
        <h2>{s.trechter}</h2>
        <ol className="stat-trechter">
          {stappen.map((st) => (
            <li key={st.naam}>
              <span className="stat-trechter-naam">{st.naam}</span>
              <span className="stat-balk-cel">
                <span className="stat-balk" style={{ width: `${Math.round((st.aantal / max) * 100)}%` }} />
                <span>{st.aantal}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <Blokken r={r} ctx={ctx} rijen={{ doelen }} namen={["doelen", "taalwissels"]} />
    </>
  );
}

function Realtime({ r, ctx }: { r: Rapport; ctx: Ctx }) {
  const { t, taal } = ctx;
  const s = t.stat;
  const k = t.kol;
  const gebeurtenissen = ((r.gebeurtenissen as Rij[]) ?? []).map((g) => ({
    ...g,
    tijd: new Date(String(g.tijd)).toLocaleTimeString(landcode[taal], { timeZone: "Europe/Amsterdam" }),
  }));
  const tegel = { t: s, taal };
  return (
    <>
      <p className="stat-uitleg">{s.realtimeUitleg}</p>
      <div className="stat-tegels">
        <Tegel titel={s.actief5} waarde={Number(r.actief ?? 0)} {...tegel} />
        <Tegel titel={s.sessies} waarde={Number(r.sessies ?? 0)} {...tegel} />
        <Tegel titel={s.paginaweergaven} waarde={Number(r.paginaweergaven ?? 0)} {...tegel} />
      </div>
      <div className="stat-raster">
        <Tabel
          titel={t.sectie.realtimePaginas}
          rijen={r.paginas as Rij[]}
          kolommen={[
            { sleutel: "naam", label: k.pagina },
            { sleutel: "weergaven", label: k.weergaven, soort: "getal" },
          ]}
          {...tegel}
        />
        <Tabel
          titel={t.sectie.realtimeLanden}
          rijen={r.landen as Rij[]}
          kolommen={[
            { sleutel: "naam", label: k.land },
            { sleutel: "sessies", label: k.sessies, soort: "getal" },
          ]}
          {...tegel}
        />
        <Tabel
          titel={s.laatsteGebeurtenissen}
          rijen={gebeurtenissen}
          kolommen={[
            { sleutel: "tijd", label: k.tijd },
            { sleutel: "type", label: k.soort },
            { sleutel: "pad", label: k.pagina },
            { sleutel: "plek", label: k.plek },
            { sleutel: "naam", label: k.details },
          ]}
          {...tegel}
        />
      </div>
    </>
  );
}
