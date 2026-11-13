import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import Accountkader, { Laden } from "@/components/Accountkader";
import Berichttekst from "@/components/Berichttekst";
import Formulierknop from "@/components/Formulierknop";
import { draadPad, forumDatum, postTaalNamen, type PostTaal } from "@/lib/forum";
import { isModerator, vereisVolledigIngelogd } from "@/lib/sessie";
import { isTaal, type Taal } from "@/lib/site";
import { maakServerClient } from "@/lib/supabase-server";
import { ledenTeksten } from "@/lib/teksten-leden";
import { blokkeer, deblokkeer, meldingAfwijzen, modereer } from "../acties";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = PageProps<"/[lang]/forum/moderatie">;

export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Inhoud {...props} />
    </Suspense>
  );
}

type BerichtInfo = {
  id: number;
  tekst: string;
  taal: PostTaal;
  status: string;
  aangemaakt: string;
  auteur_id: string | null;
  auteur: { gebruikersnaam: string } | null;
  draad: { id: number; titel: string; onderwerp: string } | null;
};

type MeldingRij = {
  id: number;
  reden: string;
  aangemaakt: string;
  melder: { gebruikersnaam: string } | null;
  bericht: BerichtInfo | null;
};

type LogRij = {
  id: number;
  actie: string;
  doel_type: string;
  doel_id: string;
  tijd: string;
  moderator: { gebruikersnaam: string } | null;
};

type BlokkadeRij = {
  id: number;
  gebruiker_id: string;
  tot: string | null;
  reden: string;
  gebruiker: { gebruikersnaam: string } | null;
};

const pad = (taal: Taal) => `/${taal}/forum/moderatie`;

const berichtKolommen =
  "id, tekst, taal, status, aangemaakt, auteur_id, auteur:profielen(gebruikersnaam), " +
  "draad:forum_draden(id, titel, onderwerp)";

// Moderatie in alle talen (W-ADM-02, -03, -04, -08). Alleen voor moderators
// en beheerders; de database controleert dat bij elke actie nog eens.
async function Inhoud({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!isTaal(lang)) notFound();
  const t = ledenTeksten[lang];
  const sessie = await vereisVolledigIngelogd(lang, pad(lang));

  if (!isModerator(sessie)) {
    return (
      <Accountkader titel={t.forum.moderatieTitel}>
        <p className="formulier-fout">{t.forum.geenToegang}</p>
      </Accountkader>
    );
  }

  const supabase = (await maakServerClient())!;
  const nu = new Date().toISOString();
  const [meldingen, wachtend, logboek, blokkades] = await Promise.all([
    supabase
      .from("forum_meldingen")
      .select(
        `id, reden, aangemaakt, melder:profielen!forum_meldingen_melder_id_fkey(gebruikersnaam), bericht:forum_berichten(${berichtKolommen})`,
      )
      .eq("status", "open")
      .order("aangemaakt", { ascending: true })
      .limit(100)
      .overrideTypes<MeldingRij[], { merge: false }>(),
    supabase
      .from("forum_berichten")
      .select(berichtKolommen)
      .eq("status", "wacht")
      .order("aangemaakt", { ascending: true })
      .limit(100)
      .overrideTypes<BerichtInfo[], { merge: false }>(),
    supabase
      .from("moderatie_logboek")
      .select("id, actie, doel_type, doel_id, tijd, moderator:profielen(gebruikersnaam)")
      .order("tijd", { ascending: false })
      .limit(30)
      .overrideTypes<LogRij[], { merge: false }>(),
    supabase
      .from("blokkades")
      .select(
        "id, gebruiker_id, tot, reden, gebruiker:profielen!blokkades_gebruiker_id_fkey(gebruikersnaam)",
      )
      .is("opgeheven", null)
      .or(`tot.is.null,tot.gt.${nu}`)
      .order("aangemaakt", { ascending: false })
      .overrideTypes<BlokkadeRij[], { merge: false }>(),
  ]);

  const zoek = await searchParams;
  const fout = typeof zoek.fout === "string" ? t.forumFouten[zoek.fout] ?? t.fouten.algemeen : null;

  return (
    <div className="moderatie">
      <h1>{t.forum.moderatieTitel}</h1>
      {fout && <p className="formulier-fout">{fout}</p>}

      <section>
        <h2>{t.forum.openMeldingen}</h2>
        {(meldingen.data ?? []).length === 0 ? (
          <p className="leeg">{t.forum.geenMeldingen}</p>
        ) : (
          (meldingen.data ?? []).map((m) => (
            <div key={m.id} className="moderatie-item">
              <p>
                <strong>{m.reden}</strong> — {t.forum.gemeldDoor} {m.melder?.gebruikersnaam ?? "—"},{" "}
                {forumDatum(lang, m.aangemaakt)}
              </p>
              {m.bericht && <Berichtkaart taal={lang} bericht={m.bericht} />}
              <form action={meldingAfwijzen.bind(null, lang, m.id, pad(lang))}>
                <Formulierknop bezig={t.bezig} soort="licht">
                  {t.forum.afwijzen}
                </Formulierknop>
              </form>
            </div>
          ))
        )}
      </section>

      <section>
        <h2>{t.forum.wachtend}</h2>
        {(wachtend.data ?? []).length === 0 ? (
          <p className="leeg">{t.forum.geenWachtend}</p>
        ) : (
          (wachtend.data ?? []).map((b) => (
            <div key={b.id} className="moderatie-item">
              <Berichtkaart taal={lang} bericht={b} />
            </div>
          ))
        )}
      </section>

      <section>
        <h2>{t.forum.blokkades}</h2>
        {(blokkades.data ?? []).length === 0 ? (
          <p className="leeg">{t.forum.geenBlokkades}</p>
        ) : (
          <ul className="moderatie-lijst">
            {(blokkades.data ?? []).map((b) => (
              <li key={b.id}>
                <strong>{b.gebruiker?.gebruikersnaam ?? "—"}</strong>{" "}
                {b.tot ? `${t.forum.tot} ${forumDatum(lang, b.tot)}` : t.forum.permanent}
                <form action={deblokkeer.bind(null, lang, b.gebruiker_id, pad(lang))}>
                  <Formulierknop bezig={t.bezig} soort="licht">
                    {t.forum.deblokkeren}
                  </Formulierknop>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2>{t.forum.logboek}</h2>
        <ul className="moderatie-lijst">
          {(logboek.data ?? []).map((r) => (
            <li key={r.id}>
              <time dateTime={r.tijd}>{forumDatum(lang, r.tijd)}</time> ·{" "}
              {r.moderator?.gebruikersnaam ?? "—"} · {r.actie} · {r.doel_type} {r.doel_id}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// Een bericht met het origineel en de knoppen om het te beoordelen.
function Berichtkaart({ taal, bericht: b }: { taal: Taal; bericht: BerichtInfo }) {
  const t = ledenTeksten[taal];
  const link = b.draad ? `${draadPad(taal, b.draad)}#bericht-${b.id}` : null;
  return (
    <div className="bericht">
      <p className="bericht-kop">
        <strong>{b.auteur?.gebruikersnaam ?? "—"}</strong>
        <span className="label-licht">
          {t.forum.origineel}: {postTaalNamen[taal][b.taal] ?? b.taal}
        </span>
        <span>
          {t.forum.status}: {b.status}
        </span>
        {link && <Link href={link}>{b.draad?.titel}</Link>}
      </p>
      <div lang={b.taal}>
        <Berichttekst tekst={b.tekst} />
      </div>
      <div className="bericht-acties">
        {b.status !== "zichtbaar" && (
          <form action={modereer.bind(null, taal, b.id, "tonen", pad(taal))}>
            <Formulierknop bezig={t.bezig}>{t.forum.tonen}</Formulierknop>
          </form>
        )}
        {b.status !== "verborgen" && (
          <form action={modereer.bind(null, taal, b.id, "verbergen", pad(taal))}>
            <Formulierknop bezig={t.bezig} soort="gevaar">
              {t.forum.verbergen}
            </Formulierknop>
          </form>
        )}
        {b.auteur_id && (
          <>
            <form action={blokkeer.bind(null, taal, b.auteur_id, 7, pad(taal))}>
              <Formulierknop bezig={t.bezig} soort="licht">
                {t.forum.blokkeer7}
              </Formulierknop>
            </form>
            <form action={blokkeer.bind(null, taal, b.auteur_id, null, pad(taal))}>
              <Formulierknop bezig={t.bezig} soort="gevaar">
                {t.forum.blokkeerPermanent}
              </Formulierknop>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
