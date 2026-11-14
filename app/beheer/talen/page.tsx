import type { Metadata } from "next";
import Link from "next/link";
import { tijdTekst } from "@/lib/beheer/hulp";
import { vereisBeheerder } from "@/lib/beheer/toegang";
import { talen, teksten } from "@/lib/site";
import { haalActieveTalen } from "@/lib/talen-instelling";
import { allesVertalen, opnieuwProberen, talenOpslaan } from "./acties";

export const metadata: Metadata = { title: "Talen en vertalingen" };

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
  const naam = teksten.nl.taalNaam;

  const { data, error } = await supabase
    .from("vertaal_taken")
    .select("id, soort, artikel_id, bericht_id, doel_taal, status, fout, aangemaakt, opgehaald_op")
    .order("aangemaakt", { ascending: false })
    .limit(300)
    .overrideTypes<Taak[], { merge: false }>();
  const taken = data ?? [];
  const tel = (s: string) => taken.filter((t) => t.status === s).length;
  const laatsteRonde = taken
    .map((t) => t.opgehaald_op)
    .filter((t): t is string => Boolean(t))
    .sort()
    .at(-1);
  const mislukt = taken.filter((t) => t.status === "mislukt").slice(0, 30);

  return (
    <section>
      <p className="terug">
        <Link href="/beheer">← Beheer</Link>
      </p>
      <h1>Talen en vertalingen</h1>

      {typeof zoek.fout === "string" && <p className="fout">Mislukt: {zoek.fout}</p>}
      {zoek.opgeslagen && <p className="melding">De talen zijn opgeslagen.</p>}
      {zoek.ingepland && <p className="melding">{zoek.ingepland} vertalingen staan in de wachtrij.</p>}
      {zoek.opnieuw && <p className="melding">De vertaling staat opnieuw in de wachtrij.</p>}
      {error && (
        <p className="fout">
          De vertaalwachtrij is nog niet klaar: voer eerst supabase/006_vertalen.sql uit in Supabase.
        </p>
      )}

      <form action={talenOpslaan} className="formulier">
        <fieldset className="velden-rij">
          <legend>Talen op de site</legend>
          {talen.map((t) => (
            <label key={t} className="vinkje">
              <input
                type="checkbox"
                name="taal"
                value={t}
                defaultChecked={actief.includes(t)}
                disabled={t === "nl"}
              />
              {naam[t]}
              {t === "nl" && " (altijd aan)"}
            </label>
          ))}
        </fieldset>
        <p className="uitleg">
          Een uitgezette taal verdwijnt uit de taalkiezer en de schakelaars bij plaatsen; bestaande
          vertalingen blijven bewaard.
        </p>
        <div className="beheer-knoppen">
          <button type="submit">Talen opslaan</button>
        </div>
      </form>

      <h2>Vertaalwachtrij</h2>
      <p>
        Wachtend: <strong>{tel("wachtend")}</strong> · Bezig: <strong>{tel("bezig")}</strong> ·
        Klaar: <strong>{tel("klaar")}</strong> · Mislukt: <strong>{tel("mislukt")}</strong>
        <br />
        Laatste ronde van de Claude-app:{" "}
        <strong>{laatsteRonde ? tijdTekst(laatsteRonde) : "nog niet"}</strong>
      </p>
      <p className="uitleg">
        De vertalingen worden gemaakt door een geplande taak in de Claude-app op de MacBook (om de 6
        dagen, zolang de Mac aan staat en de app open is). Je kunt de taak ook met de hand starten in
        de Claude-app.
      </p>

      {mislukt.length > 0 && (
        <table className="beheer-tabel">
          <thead>
            <tr>
              <th>Wat</th>
              <th>Taal</th>
              <th>Reden</th>
              <th>Wanneer</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {mislukt.map((t) => (
              <tr key={t.id}>
                <td>
                  {t.soort === "artikel" && t.artikel_id ? (
                    <Link href={`/beheer/artikelen/${t.artikel_id}`}>Artikel</Link>
                  ) : (
                    `Forumbericht ${t.bericht_id}`
                  )}
                </td>
                <td>{naam[t.doel_taal as keyof typeof naam] ?? t.doel_taal}</td>
                <td>{t.fout}</td>
                <td>{tijdTekst(t.aangemaakt)}</td>
                <td>
                  <form action={opnieuwProberen.bind(null, t.id)}>
                    <button type="submit" className="knop-link">
                      Opnieuw
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2>Alles naar één taal vertalen</h2>
      <p className="uitleg">
        Zet alle artikelen en zichtbare forumberichten die nog geen tekst in die taal hebben in de
        wachtrij. Handig nadat een taal is aangezet.
      </p>
      <div className="beheer-knoppen">
        {actief
          .filter((t) => t !== "nl")
          .map((t) => (
            <form key={t} action={allesVertalen.bind(null, t)}>
              <button type="submit" className="knop knop-licht">
                Alles naar het {naam[t]}
              </button>
            </form>
          ))}
      </div>
    </section>
  );
}
