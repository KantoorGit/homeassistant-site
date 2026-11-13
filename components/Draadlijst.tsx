import Link from "next/link";
import { draadPad, forumDatum, onderwerpen, postTaalNamen } from "@/lib/forum";
import type { DraadKort } from "@/lib/forum-gegevens";
import type { Taal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

// Lijst van discussies, zoals op de forumvoorpagina en per onderwerp.
export default function Draadlijst({
  taal,
  draden,
  toonOnderwerp,
}: {
  taal: Taal;
  draden: DraadKort[];
  toonOnderwerp: boolean;
}) {
  const t = ledenTeksten[taal].forum;
  if (draden.length === 0) return <p className="leeg">{t.geenDraden}</p>;

  return (
    <ol className="draadlijst">
      {draden.map((d) => {
        const onderwerp = onderwerpen.find((o) => o.id === d.onderwerp);
        return (
          <li key={d.id}>
            <h3>
              <Link href={draadPad(taal, d)} lang={d.taal}>
                {d.titel}
              </Link>
            </h3>
            <p className="draad-meta">
              {toonOnderwerp && onderwerp && <span className="label-licht">{onderwerp.naam[taal]}</span>}
              {d.gesloten && <span className="label-licht">{t.gesloten}</span>}
              {d.taal !== taal && (
                <span className="label-licht">
                  {t.origineel}: {postTaalNamen[taal][d.taal]}
                </span>
              )}
              <span>
                {t.door} {d.auteur ?? "—"}
              </span>
              <span>{t.reacties(d.aantalReacties)}</span>
              <time dateTime={d.laatsteActiviteit}>
                {forumDatum(taal, d.laatsteActiviteit)}
              </time>
            </p>
          </li>
        );
      })}
    </ol>
  );
}
