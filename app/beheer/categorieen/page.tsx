import type { Metadata } from "next";
import Link from "next/link";
import { alleArtikelen } from "@/lib/beheer/artikelen";
import { beheerT } from "@/lib/beheer/taal";
import { telTekst, vul, type BeheerTeksten } from "@/lib/beheer/teksten";
import { vereisBeheerder } from "@/lib/beheer/toegang";
import { haalAlleCategorieen } from "@/lib/categorieen";
import { taalCode, talen, teksten, type Categorie, type Taal } from "@/lib/site";
import {
  categorieOpslaan,
  categorieTerugzetten,
  categorieVerplaatsen,
  categorieVerwijderen,
} from "./acties";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await beheerT();
  return { title: t.categorieen.titel };
}

// Velden voor naam en webadres in alle zes talen; de taal van het
// beheerpaneel staat bovenaan.
function Velden({
  c,
  taal,
  t,
  metWebadres,
}: {
  c?: Categorie;
  taal: Taal;
  t: BeheerTeksten["categorieen"];
  metWebadres: boolean;
}) {
  const volgorde = [taal, ...talen.filter((x) => x !== taal)];
  return (
    <div className="categorie-velden">
      {volgorde.map((x) => (
        <div key={x} className="categorie-taal">
          <span className="categorie-taalnaam">{teksten[taal].taalNaam[x]}</span>
          <label>
            {t.naam}
            <input
              name={`naam_${x}`}
              defaultValue={c?.naam[x] ?? ""}
              maxLength={40}
              lang={taalCode[x]}
              required={!c && x === taal}
            />
          </label>
          {metWebadres && (
            <label>
              {t.webadres}
              <input
                name={`slug_${x}`}
                defaultValue={c?.slug[x] ?? ""}
                maxLength={60}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                placeholder={c ? "" : "…"}
              />
            </label>
          )}
        </div>
      ))}
      {metWebadres && <small className="uitleg">{t.webadresUitleg}</small>}
    </div>
  );
}

// Categorieën beheren (W-ADM-07): hernoemen, volgorde, toevoegen,
// verwijderen (artikelen naar Overig) en terugzetten. Alleen de beheerder.
export default async function Categorieen({ searchParams }: PageProps<"/beheer/categorieen">) {
  const { supabase } = await vereisBeheerder();
  const { taal, t } = await beheerT();
  const c = t.categorieen;
  const zoek = await searchParams;
  const [alle, { artikelen }] = await Promise.all([haalAlleCategorieen(), alleArtikelen(supabase)]);

  // Staat de tabel er nog niet, dan komt de lijst uit de code.
  const { error: tabelFout } = await supabase.from("categorieen").select("id").limit(1);
  const klaar = !tabelFout;

  const actief = alle.filter((x) => !x.verwijderd);
  const verwijderd = alle.filter((x) => x.verwijderd);
  const verplaatsbaar = actief.filter((x) => x.soort === "gewoon" || x.soort === "laatste-nieuws");
  const aantal = (id: string) => artikelen.filter((a) => a.categorie_id === id).length;
  const overigAantal = artikelen.filter(
    (a) => a.categorie_id === "overig" || verwijderd.some((v) => v.id === a.categorie_id) || !alle.some((v) => v.id === a.categorie_id),
  ).length;

  const foutTekst: Record<string, string> = {
    naam_leeg: c.foutNaamLeeg,
    naam_te_lang: c.foutNaamTeLang,
    slug_ongeldig: c.foutSlugOngeldig,
    slug_gereserveerd: c.foutSlugGereserveerd,
    slug_bestaat: c.foutSlugBestaat,
    slug_voorpagina: c.foutSlugOngeldig,
    slug_forum: c.foutSlugOngeldig,
    niet_verwijderbaar: c.foutNietVerwijderbaar,
    niet_klaar: c.nietKlaar,
    algemeen: c.foutAlgemeen,
  };
  const meldingTekst: Record<string, string> = {
    opgeslagen: c.melOpgeslagen,
    toegevoegd: c.melToegevoegd,
    verwijderd: c.melVerwijderd,
    teruggezet: c.melTeruggezet,
    volgorde: c.melVolgorde,
  };
  const foutTaal = typeof zoek.taal === "string" && zoek.taal in teksten[taal].taalNaam
    ? teksten[taal].taalNaam[zoek.taal as Taal]
    : "";

  return (
    <section className="categoriebeheer">
      <p className="terug">
        <Link href="/beheer">{t.algemeen.terugBeheer}</Link>
      </p>
      <h1>{c.titel}</h1>
      <p className="uitleg">{c.uitleg}</p>

      {!klaar && <p className="fout">{c.nietKlaar}</p>}
      {typeof zoek.fout === "string" && foutTekst[zoek.fout] && (
        <p className="fout" role="alert">
          {vul(foutTekst[zoek.fout], {
            taal: foutTaal,
            fout: typeof zoek.bericht === "string" ? zoek.bericht : "",
          })}
        </p>
      )}
      {typeof zoek.melding === "string" && meldingTekst[zoek.melding] && (
        <p className="melding" role="status">
          {meldingTekst[zoek.melding]}
        </p>
      )}

      <ol className="categorielijst">
        {actief.map((x) => {
          const plek = verplaatsbaar.findIndex((v) => v.id === x.id);
          const n = x.soort === "overig" ? overigAantal : aantal(x.id);
          const vast =
            x.soort === "voorpagina"
              ? c.vastEerste
              : x.soort === "overig"
                ? c.vastOverig
                : x.soort === "forum"
                  ? c.vastForum
                  : x.soort === "laatste-nieuws"
                    ? c.automatisch
                    : "";
          return (
            <li key={x.id} className={`categorie-rij${zoek.kijk === x.id ? " categorie-net" : ""}`} id={`categorie-${x.id}`}>
              <div className="categorie-kop">
                <div>
                  <strong>{x.naam[taal]}</strong>
                  {x.slug[taal] && <code className="categorie-adres">/{taal}/{x.slug[taal]}</code>}
                  {(x.soort === "gewoon" || x.soort === "overig") && (
                    <span className="etiket grijs">{telTekst(n, c.artikelen1, c.artikelenN)}</span>
                  )}
                  {vast && <small className="uitleg categorie-vast">{vast}</small>}
                </div>
                {plek >= 0 && klaar && (
                  <div className="categorie-pijlen">
                    <form action={categorieVerplaatsen.bind(null, x.id, "omhoog")}>
                      <button
                        type="submit"
                        className="knop-pijl"
                        disabled={plek === 0}
                        aria-label={vul(c.omhoogLabel, { naam: x.naam[taal] })}
                        title={c.omhoog}
                      >
                        ↑
                      </button>
                    </form>
                    <form action={categorieVerplaatsen.bind(null, x.id, "omlaag")}>
                      <button
                        type="submit"
                        className="knop-pijl"
                        disabled={plek === verplaatsbaar.length - 1}
                        aria-label={vul(c.omlaagLabel, { naam: x.naam[taal] })}
                        title={c.omlaag}
                      >
                        ↓
                      </button>
                    </form>
                  </div>
                )}
              </div>
              {klaar && (
                <details className="categorie-wijzig">
                  <summary>{c.wijzigen}</summary>
                  <form action={categorieOpslaan} className="formulier">
                    <input type="hidden" name="id" value={x.id} />
                    <Velden c={x} taal={taal} t={c} metWebadres={x.soort !== "voorpagina" && x.soort !== "forum"} />
                    <div className="beheer-knoppen">
                      <button type="submit">{t.algemeen.opslaan}</button>
                    </div>
                  </form>
                  {x.soort === "gewoon" && (
                    <form action={categorieVerwijderen} className="formulier gevaarzone categorie-verwijder">
                      <input type="hidden" name="id" value={x.id} />
                      <p>
                        {n === 0 ? c.verwijderUitleg0 : telTekst(n, c.verwijderUitleg1, c.verwijderUitlegN)}
                      </p>
                      <label className="vinkje">
                        <input type="checkbox" name="bevestig" value="ja" required />
                        {c.verwijderBevestig}
                      </label>
                      <button type="submit" className="knop-gevaar">
                        {c.verwijderen}
                      </button>
                    </form>
                  )}
                </details>
              )}
            </li>
          );
        })}
      </ol>

      {klaar && (
        <section className="formulier categorie-nieuw">
          <h2>{c.nieuwTitel}</h2>
          <p className="uitleg">{c.nieuwUitleg}</p>
          <form action={categorieOpslaan}>
            <Velden taal={taal} t={c} metWebadres />
            <div className="beheer-knoppen">
              <button type="submit">{c.toevoegen}</button>
            </div>
          </form>
        </section>
      )}

      {verwijderd.length > 0 && (
        <>
          <h2>{c.verwijderdeTitel}</h2>
          <p className="uitleg">{c.verwijderdeUitleg}</p>
          <ul className="categorielijst">
            {verwijderd.map((x) => (
              <li key={x.id} className="categorie-rij categorie-weg">
                <div className="categorie-kop">
                  <div>
                    <strong>{x.naam[taal]}</strong>
                    <span className="etiket grijs">{telTekst(aantal(x.id), c.artikelen1, c.artikelenN)}</span>
                  </div>
                  <form action={categorieTerugzetten.bind(null, x.id)}>
                    <button type="submit" className="knop knop-licht">
                      {c.terugzetten}
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
