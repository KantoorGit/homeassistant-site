import Link from "next/link";
import { alleArtikelen, kopVan, positieVan } from "@/lib/beheer/artikelen";
import { tijdTekst } from "@/lib/beheer/hulp";
import { beheerT } from "@/lib/beheer/taal";
import { vul, type BeheerTeksten } from "@/lib/beheer/teksten";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { haalAlleCategorieen } from "@/lib/categorieen";
import { teksten } from "@/lib/site";
import { uitloggen } from "./acties";

function statusVan(t: BeheerTeksten["overzicht"], status: string, gepubliceerdOp: string | null) {
  if (status !== "gepubliceerd") return { tekst: t.concept, klasse: "concept" };
  if (gepubliceerdOp && new Date(gepubliceerdOp) > new Date()) {
    return { tekst: t.gepland, klasse: "gepland" };
  }
  return { tekst: t.online, klasse: "online" };
}

export default async function Beheeroverzicht({ searchParams }: PageProps<"/beheer">) {
  const { supabase, redacteur } = await vereisRedacteur();
  const { taal, t } = await beheerT();
  const o = t.overzicht;
  const [{ artikelen, fout }, categorieen] = await Promise.all([
    alleArtikelen(supabase),
    haalAlleCategorieen(),
  ]);
  const { verwijderd } = await searchParams;
  const overig = categorieen.find((c) => c.soort === "overig");

  return (
    <section>
      <div className="beheer-titelrij">
        <div>
          <h1>{o.titel}</h1>
          <p className="beheer-wie">
            {vul(o.ingelogdAls, {
              naam: redacteur.naam,
              rol: t.rollen[redacteur.rol],
              talen: redacteur.talen.map((x) => teksten[taal].taalNaam[x]).join(", ") || o.geenTaal,
            })}
          </p>
        </div>
        <div className="beheer-knoppen">
          <Link href="/beheer/artikelen/nieuw" className="knop">
            {o.nieuwArtikel}
          </Link>
          {redacteur.rol === "beheerder" && (
            <>
              <Link href="/beheer/categorieen" className="knop knop-licht">
                {o.categorieen}
              </Link>
              <Link href="/beheer/statistieken" className="knop knop-licht">
                {o.statistieken}
              </Link>
              <Link href="/beheer/talen" className="knop knop-licht">
                {o.talen}
              </Link>
            </>
          )}
          <form action={uitloggen}>
            <button type="submit" className="knop-link">
              {t.algemeen.uitloggen}
            </button>
          </form>
        </div>
      </div>

      {verwijderd && <p className="melding">{o.verwijderd}</p>}
      {fout && <p className="fout">{vul(o.ophalenMislukt, { fout })}</p>}

      {artikelen.length === 0 && !fout ? (
        <p>{o.leeg}</p>
      ) : (
        <table className="beheer-tabel">
          <thead>
            <tr>
              <th>{o.kolKop}</th>
              <th>{o.kolCategorie}</th>
              <th>{o.kolTalen}</th>
              <th>{o.kolStatus}</th>
              <th>{o.kolPublicatie}</th>
            </tr>
          </thead>
          <tbody>
            {artikelen.map((a) => {
              const s = statusVan(o, a.status, a.gepubliceerd_op);
              const categorie = categorieen.find((c) => c.id === a.categorie_id);
              const positie = positieVan(a);
              return (
                <tr key={a.id}>
                  <td>
                    <Link href={`/beheer/artikelen/${a.id}`}>{kopVan(a, taal, o.zonderKop)}</Link>
                    {positie === 1 && <span className="etiket">{t.plek.etiketGroot}</span>}
                    {positie && positie > 1 && (
                      <span className="etiket">{vul(t.plek.etiketPlek, { n: positie - 1 })}</span>
                    )}
                    {a.is_voorbeeld && <span className="etiket grijs">{o.voorbeeld}</span>}
                  </td>
                  <td>
                    {!categorie
                      ? (overig?.naam[taal] ?? a.categorie_id)
                      : categorie.verwijderd
                        ? vul(o.overigWas, { overig: overig?.naam[taal] ?? "", naam: categorie.naam[taal] })
                        : categorie.naam[taal]}
                  </td>
                  <td>
                    {a.artikel_vertalingen
                      .map((v) => v.taal.toUpperCase())
                      .sort()
                      .join(" · ")}
                  </td>
                  <td>
                    <span className={`status ${s.klasse}`}>{s.tekst}</span>
                  </td>
                  <td>{tijdTekst(a.gepubliceerd_op, taal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
