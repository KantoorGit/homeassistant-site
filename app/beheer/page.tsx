import Link from "next/link";
import { alleArtikelen, kopVan } from "@/lib/beheer/artikelen";
import { tijdTekst } from "@/lib/beheer/hulp";
import { vereisRedacteur } from "@/lib/beheer/toegang";
import { categorieen, teksten } from "@/lib/site";
import { uitloggen } from "./acties";

function statusVan(status: string, gepubliceerdOp: string | null) {
  if (status !== "gepubliceerd") return { tekst: "Concept", klasse: "concept" };
  if (gepubliceerdOp && new Date(gepubliceerdOp) > new Date()) {
    return { tekst: "Gepland", klasse: "gepland" };
  }
  return { tekst: "Online", klasse: "online" };
}

export default async function Beheeroverzicht({
  searchParams,
}: PageProps<"/beheer">) {
  const { supabase, redacteur } = await vereisRedacteur();
  const { artikelen, fout } = await alleArtikelen(supabase);
  const { verwijderd } = await searchParams;

  return (
    <section>
      <div className="beheer-titelrij">
        <div>
          <h1>Artikelen</h1>
          <p className="beheer-wie">
            Ingelogd als {redacteur.naam} ({redacteur.rol}, schrijft in{" "}
            {redacteur.talen.map((t) => teksten.nl.taalNaam[t]).join(", ") || "geen taal"})
          </p>
        </div>
        <div className="beheer-knoppen">
          <Link href="/beheer/artikelen/nieuw" className="knop">
            Nieuw artikel
          </Link>
          {redacteur.rol === "beheerder" && (
            <>
              <Link href="/beheer/statistieken" className="knop knop-licht">
                Statistieken
              </Link>
              <Link href="/beheer/talen" className="knop knop-licht">
                Talen en vertalingen
              </Link>
            </>
          )}
          <form action={uitloggen}>
            <button type="submit" className="knop-link">
              Uitloggen
            </button>
          </form>
        </div>
      </div>

      {verwijderd && <p className="melding">Het artikel is verwijderd.</p>}
      {fout && <p className="fout">Artikelen ophalen mislukt: {fout}</p>}

      {artikelen.length === 0 && !fout ? (
        <p>Er zijn nog geen artikelen. Maak je eerste artikel met ‘Nieuw artikel’.</p>
      ) : (
        <table className="beheer-tabel">
          <thead>
            <tr>
              <th>Kop</th>
              <th>Categorie</th>
              <th>Talen</th>
              <th>Status</th>
              <th>Publicatie</th>
            </tr>
          </thead>
          <tbody>
            {artikelen.map((a) => {
              const s = statusVan(a.status, a.gepubliceerd_op);
              const categorie = categorieen.find((c) => c.id === a.categorie_id);
              return (
                <tr key={a.id}>
                  <td>
                    <Link href={`/beheer/artikelen/${a.id}`}>{kopVan(a)}</Link>
                    {a.uitgelicht && <span className="etiket">Voorpagina</span>}
                    {a.is_voorbeeld && <span className="etiket grijs">Voorbeeld</span>}
                  </td>
                  <td>{categorie?.naam.nl ?? a.categorie_id}</td>
                  <td>
                    {a.artikel_vertalingen
                      .map((v) => v.taal.toUpperCase())
                      .sort()
                      .join(" · ")}
                  </td>
                  <td>
                    <span className={`status ${s.klasse}`}>{s.tekst}</span>
                  </td>
                  <td>{tijdTekst(a.gepubliceerd_op)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
