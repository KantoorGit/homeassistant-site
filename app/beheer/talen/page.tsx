import type { Metadata } from "next";
import Link from "next/link";
import { tijdTekst } from "@/lib/beheer/hulp";
import { beheerT } from "@/lib/beheer/taal";
import { vul } from "@/lib/beheer/teksten";
import { vereisBeheerder } from "@/lib/beheer/toegang";
import { talen, teksten } from "@/lib/site";
import { haalActieveTalen } from "@/lib/talen-instelling";
import { allesVertalen, opnieuwProberen, talenOpslaan } from "./acties";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await beheerT();
  return { title: t.talen.titel };
}

type Taak = {
  id: number;
  soort: string;
  artikel_id: string | null;
  bericht_id: number | null;
  doel_taal: string;
  status: string;
  fout: string | null;
  aangemaakt: string;
  opgehaald_op: string | null;
};

// Talen aan- en uitzetten (W-TAAL-10), alles naar een taal vertalen
// (W-TAAL-17) en de vertaalwachtrij bekijken (W-TAAL-16).
export default async function Talen({ searchParams }: PageProps<"/beheer/talen">) {
  const { supabase } = await vereisBeheerder();
  const zoek = await searchParams;
  const actief = await haalActieveTalen();
  const { taal, t: alle } = await beheerT();
  const t = alle.talen;
  const naam = teksten[taal].taalNaam;

  const { data, error } = await supabase
    .from("vertaal_taken")
    .select("id, soort, artikel_id, bericht_id, doel_taal, status, fout, aangemaakt, opgehaald_op")
    .order("aangemaakt", { ascending: false })
    .limit(300)
    .overrideTypes<Taak[], { merge: false }>();
  const taken = data ?? [];
  const tel = (s: string) => taken.filter((x) => x.status === s).length;
  const laatsteRonde = taken
    .map((x) => x.opgehaald_op)
    .filter((x): x is string => Boolean(x))
    .sort()
    .at(-1);
  const mislukt = taken.filter((x) => x.status === "mislukt").slice(0, 30);

  return (
    <section>
      <p className="terug">
        <Link href="/beheer">{alle.algemeen.terugBeheer}</Link>
      </p>
      <h1>{t.titel}</h1>

      {typeof zoek.fout === "string" && <p className="fout">{vul(t.mislukt, { fout: zoek.fout })}</p>}
      {zoek.opgeslagen && <p className="melding">{t.opgeslagen}</p>}
      {zoek.ingepland && <p className="melding">{vul(t.ingepland, { n: String(zoek.ingepland) })}</p>}
      {zoek.opnieuw && <p className="melding">{t.opnieuw}</p>}
      {error && (
        <p className="fout">{t.nietKlaar}</p>
      )}

      <form action={talenOpslaan} className="formulier">
        <fieldset className="velden-rij">
          <legend>{t.opDeSite}</legend>
          {talen.map((x) => (
            <label key={x} className="vinkje">
              <input
                type="checkbox"
                name="taal"
                value={x}
                defaultChecked={actief.includes(x)}
                disabled={x === "nl"}
              />
              {naam[x]}
              {x === "nl" && t.altijdAan}
            </label>
          ))}
        </fieldset>
        <p className="uitleg">{t.uitgezetUitleg}</p>
        <div className="beheer-knoppen">
          <button type="submit">{t.opslaan}</button>
        </div>
      </form>

      <h2>{t.wachtrij}</h2>
      <p>
        {t.wachtend}: <strong>{tel("wachtend")}</strong> · {t.bezig}: <strong>{tel("bezig")}</strong> ·{" "}
        {t.klaar}: <strong>{tel("klaar")}</strong> · {t.misluktTeller}: <strong>{tel("mislukt")}</strong>
        <br />
        {t.laatsteRonde}:{" "}
        <strong>{laatsteRonde ? tijdTekst(laatsteRonde, taal) : alle.algemeen.tijdNogNiet}</strong>
      </p>
      <p className="uitleg">{t.wachtrijUitleg}</p>

      {mislukt.length > 0 && (
        <table className="beheer-tabel">
          <thead>
            <tr>
              <th>{t.kolWat}</th>
              <th>{t.kolTaal}</th>
              <th>{t.kolReden}</th>
              <th>{t.kolWanneer}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mislukt.map((taak) => (
              <tr key={taak.id}>
                <td>
                  {taak.soort === "artikel" && taak.artikel_id ? (
                    <Link href={`/beheer/artikelen/${taak.artikel_id}`}>{alle.talen.artikel}</Link>
                  ) : (
                    vul(alle.talen.forumbericht, { n: String(taak.bericht_id) })
                  )}
                </td>
                <td>{naam[taak.doel_taal as keyof typeof naam] ?? taak.doel_taal}</td>
                <td>{taak.fout}</td>
                <td>{tijdTekst(taak.aangemaakt, taal)}</td>
                <td>
                  <form action={opnieuwProberen.bind(null, taak.id)}>
                    <button type="submit" className="knop-link">
                      {alle.talen.opnieuwKnop}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>{t.allesTitel}</h2>
      <p className="uitleg">{t.allesUitleg}</p>
      <div className="beheer-knoppen">
        {actief
          .filter((x) => x !== "nl")
          .map((x) => (
            <form key={x} action={allesVertalen.bind(null, x)}>
              <button type="submit" className="knop knop-licht">
                {vul(t.allesNaar, { taal: naam[x] })}
              </button>
            </form>
          ))}
      </div>
    </section>
  );
}
