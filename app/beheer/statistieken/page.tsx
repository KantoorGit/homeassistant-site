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
import { vereisBeheerder } from "@/lib/beheer/toegang";
import { categorieen, talen, teksten } from "@/lib/site";
import { Dagstaafjes, Tabel, Tegel } from "./onderdelen";
import { doelNamen, secties } from "./secties";

export const metadata: Metadata = { title: "Statistieken" };

// Bezoekersstatistieken, alleen voor de beheerder met 2FA (W-ANA-50 t/m -54).
export default async function Statistieken({ searchParams }: PageProps<"/beheer/statistieken">) {
  const { supabase } = await vereisBeheerder();
  const f = leesFilters(await searchParams);

  const { rapport, fout } =
    f.tab === "realtime" ? await haalRealtime(supabase, f.alles) : await haalRapport(supabase, f);

  return (
    <section className="statistieken">
      <p className="terug">
        <Link href="/beheer">← Beheer</Link>
      </p>
      <div className="beheer-titelrij">
        <h1>Bezoekersstatistieken</h1>
      </div>

      <nav className="stat-tabs" aria-label="Rapporten">
        {tabs.map((t) => (
          <Link
            key={t.id}
            href={`/beheer/statistieken?${zoekdeel({ ...f, tab: t.id })}`}
            aria-current={t.id === f.tab ? "page" : undefined}
          >
            {t.naam}
          </Link>
        ))}
      </nav>

      <Filterbalk f={f} />

      {fout && (
        <p className="fout">
          {/meting_|does not exist|schema cache/i.test(fout)
            ? "De statistieken zijn nog niet klaar: voer eerst supabase/005_bezoekersstatistieken.sql uit in Supabase."
            : `Ophalen mislukt: ${fout}`}
        </p>
      )}

      {rapport && f.tab === "realtime" && <Realtime r={rapport} />}
      {rapport && f.tab === "overzicht" && <Overzicht r={rapport} f={f} />}
      {rapport && f.tab === "acquisitie" && (
        <Blokken r={rapport} f={f} namen={["kanalen", "verwijzers", "zoekmachines", "campagnes"]} />
      )}
      {rapport && f.tab === "doelgroep" && (
        <>
          <ToestemmingUitleg r={rapport} />
          <Blokken
            r={rapport}
            f={f}
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
        <Gedrag r={rapport} f={f} koppen={await artikelKoppen(supabase)} />
      )}
      {rapport && f.tab === "doelen" && <Doelen r={rapport} f={f} />}
    </section>
  );
}

async function artikelKoppen(
  supabase: Awaited<ReturnType<typeof vereisBeheerder>>["supabase"],
): Promise<Map<string, string>> {
  const { artikelen } = await alleArtikelen(supabase);
  return new Map(artikelen.map((a) => [a.id, kopVan(a)]));
}

function Filterbalk({ f }: { f: Filters }) {
  return (
    <form className="stat-filters" method="get" action="/beheer/statistieken">
      <input type="hidden" name="tab" value={f.tab} />
      {f.tab !== "realtime" && (
        <label>
          Periode
          <select name="periode" defaultValue={f.periode}>
            {perioden.map((p) => (
              <option key={p.id} value={p.id}>
                {p.naam}
              </option>
            ))}
          </select>
        </label>
      )}
      {f.tab !== "realtime" && (
        <>
          <label>
            Taal
            <select name="taal" defaultValue={f.taal}>
              <option value="">Alle</option>
              {talen.map((t) => (
                <option key={t} value={t}>
                  {teksten.nl.taalNaam[t]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Categorie
            <select name="categorie" defaultValue={f.categorie}>
              <option value="">Alle</option>
              {categorieen
                .filter((c) => c.id !== "voorpagina" && c.id !== "laatste-nieuws")
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.naam.nl}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Apparaat
            <select name="apparaat" defaultValue={f.apparaat}>
              <option value="">Alle</option>
              <option value="computer">Computer</option>
              <option value="tablet">Tablet</option>
              <option value="telefoon">Telefoon</option>
            </select>
          </label>
          <label>
            Kanaal
            <select name="kanaal" defaultValue={f.kanaal}>
              <option value="">Alle</option>
              {["Direct", "Organisch zoeken", "Verwijzing", "Social", "E-mail", "Campagne", "Intern"].map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </label>
          <label>
            Land
            <input name="land" defaultValue={f.land} placeholder="bijv. NL" size={4} maxLength={2} />
          </label>
        </>
      )}
      <label className="stat-vinkje">
        <input type="checkbox" name="alles" value="1" defaultChecked={f.alles} />
        Ook redactie en testomgeving
      </label>
      <button type="submit" className="knop">
        Toon
      </button>
    </form>
  );
}

function csvAdres(f: Filters, sectie: string): string {
  return `/beheer/statistieken/csv?${zoekdeel(f, { sectie })}`;
}

function Blokken({ r, f, namen, rijen }: { r: Rapport; f: Filters; namen: string[]; rijen?: Record<string, Rij[]> }) {
  return (
    <div className="stat-raster">
      {namen.map((n) => {
        const s = secties[n];
        return (
          <Tabel
            key={n}
            titel={s.titel}
            kolommen={s.kolommen}
            uitleg={s.uitleg}
            alleenToestemming={s.alleenToestemming}
            rijen={rijen?.[n] ?? (r[n] as Rij[] | undefined)}
            csv={csvAdres(f, n)}
          />
        );
      })}
    </div>
  );
}

function ToestemmingUitleg({ r }: { r: Rapport }) {
  const pct = Number(r.overzicht?.uitgebreid_pct ?? 0);
  return (
    <p className="stat-toestemming">
      <strong>{pct}%</strong> van de sessies is van bezoekers die toestemming gaven. Cijfers met het
      etiket <span className="etiket etiket-toestemming">alleen met toestemming</span> gaan alleen over
      die groep en zeggen niets over alle bezoekers (W-ANA-54). &ldquo;Bezoekers&rdquo; zonder
      toestemming worden per dag geteld: wie op twee dagen komt, telt twee keer.
    </p>
  );
}

function Overzicht({ r, f }: { r: Rapport; f: Filters }) {
  const o = r.overzicht ?? {};
  const v = r.vorige ?? {};
  const n = (x: unknown) => Number(x ?? 0);
  return (
    <>
      <div className="stat-tegels">
        <Tegel titel="Bezoekers" waarde={n(o.bezoekers)} vorig={n(v.bezoekers)} />
        <Tegel titel="Sessies" waarde={n(o.sessies)} vorig={n(v.sessies)} />
        <Tegel titel="Paginaweergaven" waarde={n(o.paginaweergaven)} vorig={n(v.paginaweergaven)} />
        <Tegel titel="Gem. actieve tijd per sessie" waarde={n(o.gem_actieve_ms)} vorig={n(v.gem_actieve_ms)} soort="ms" />
        <Tegel titel="Sessies met één pagina" waarde={n(o.een_pagina_pct)} vorig={n(v.een_pagina_pct)} soort="pct" lagerIsBeter />
      </div>
      <ToestemmingUitleg r={r} />
      <Dagstaafjes rijen={(r.per_dag as Rij[]) ?? []} sleutel="sessies" titel="Sessies per dag" />
      <details className="stat-tabelweergave">
        <summary>Cijfers per dag als tabel</summary>
        <Blokken r={r} f={f} namen={["per_dag"]} />
      </details>
      <Blokken r={r} f={f} namen={["kanalen", "paginas", "landen", "apparaten"]} />
    </>
  );
}

function Gedrag({ r, f, koppen }: { r: Rapport; f: Filters; koppen: Map<string, string> }) {
  const artikelen = ((r.artikelen as Rij[]) ?? []).map((a) => ({
    ...a,
    kop: koppen.get(String(a.id)) ?? String(a.pad ?? a.id),
  }));
  return (
    <Blokken
      r={r}
      f={f}
      rijen={{ artikelen }}
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

function Doelen({ r, f }: { r: Rapport; f: Filters }) {
  const t = r.trechter ?? {};
  const stappen = [
    { naam: "Registratiepagina bekeken", aantal: Number(t.registratie_bekeken ?? 0) },
    { naam: "Account aangemaakt", aantal: Number(t.registratie_voltooid ?? 0) },
    { naam: "Authenticator-app gekoppeld", aantal: Number(t.tweefactor_gekoppeld ?? 0) },
    { naam: "Eerste forumbericht", aantal: Number(t.eerste_bericht ?? 0) },
  ];
  const max = Math.max(stappen[0].aantal, 1);
  const doelen = ((r.doelen as Rij[]) ?? []).map((d) => ({
    ...d,
    naam: doelNamen[String(d.naam)] ?? d.naam,
  }));
  return (
    <>
      <section className="stat-blok">
        <h2>Trechter van registratie (sessies)</h2>
        <ol className="stat-trechter">
          {stappen.map((s) => (
            <li key={s.naam}>
              <span className="stat-trechter-naam">{s.naam}</span>
              <span className="stat-balk-cel">
                <span className="stat-balk" style={{ width: `${Math.round((s.aantal / max) * 100)}%` }} />
                <span>{s.aantal}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>
      <Blokken r={r} f={f} rijen={{ doelen }} namen={["doelen", "taalwissels"]} />
    </>
  );
}

function Realtime({ r }: { r: Rapport }) {
  const gebeurtenissen = ((r.gebeurtenissen as Rij[]) ?? []).map((g) => ({
    ...g,
    tijd: new Date(String(g.tijd)).toLocaleTimeString("nl-NL", { timeZone: "Europe/Amsterdam" }),
  }));
  return (
    <>
      <p className="stat-uitleg">
        Laatste 30 minuten. Ververs de pagina voor nieuwe cijfers. Metingen komen binnen ongeveer 10
        seconden binnen.
      </p>
      <div className="stat-tegels">
        <Tegel titel="Actief (laatste 5 min.)" waarde={Number(r.actief ?? 0)} />
        <Tegel titel="Sessies" waarde={Number(r.sessies ?? 0)} />
        <Tegel titel="Paginaweergaven" waarde={Number(r.paginaweergaven ?? 0)} />
      </div>
      <div className="stat-raster">
        <Tabel
          titel="Pagina's"
          rijen={r.paginas as Rij[]}
          kolommen={[
            { sleutel: "naam", label: "Pagina" },
            { sleutel: "weergaven", label: "Weergaven", soort: "getal" },
          ]}
        />
        <Tabel
          titel="Landen"
          rijen={r.landen as Rij[]}
          kolommen={[
            { sleutel: "naam", label: "Land" },
            { sleutel: "sessies", label: "Sessies", soort: "getal" },
          ]}
        />
        <Tabel
          titel="Laatste gebeurtenissen"
          rijen={gebeurtenissen}
          kolommen={[
            { sleutel: "tijd", label: "Tijd" },
            { sleutel: "type", label: "Soort" },
            { sleutel: "pad", label: "Pagina" },
            { sleutel: "plek", label: "Plek" },
            { sleutel: "naam", label: "Details" },
          ]}
        />
      </div>
    </>
  );
}
