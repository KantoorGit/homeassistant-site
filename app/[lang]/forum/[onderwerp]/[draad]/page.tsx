import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Laden } from "@/components/Accountkader";
import Berichttekst from "@/components/Berichttekst";
import Formulierknop from "@/components/Formulierknop";
import { Reactieformulier } from "@/components/Forumformulieren";
import {
  draadPad,
  forumDatum,
  isPostTaal,
  onderwerpen,
  onderwerpPad,
  postTaalInZin,
  postTaalNamen,
  type Berichtstatus,
  type PostTaal,
} from "@/lib/forum";
import { accountPad } from "@/lib/paden";
import { huidigeSessie, isModerator, type Rol } from "@/lib/sessie";
import { isTaal, type Taal } from "@/lib/site";
import { maakServerClient } from "@/lib/supabase-server";
import { ledenTeksten } from "@/lib/teksten-leden";
import { draadSluiten, meld, modereer, verwijderEigen } from "../../acties";

type Props = PageProps<"/[lang]/forum/[onderwerp]/[draad]">;


export default function Pagina(props: Props) {
  return (
    <Suspense fallback={<Laden />}>
      <Draad {...props} />
    </Suspense>
  );
}

type DraadRij = {
  id: number;
  onderwerp: string;
  titel: string;
  taal: PostTaal;
  status: Berichtstatus;
  gesloten: boolean;
};

type BerichtRij = {
  id: number;
  tekst: string;
  taal: PostTaal;
  is_opening: boolean;
  status: Berichtstatus;
  aangemaakt: string;
  bewerkt: string | null;
  auteur_id: string | null;
  auteur: { gebruikersnaam: string; rol: Rol } | null;
  forum_vertalingen: { taal: string; titel: string | null; tekst: string }[];
};

// Eén discussie met alle reacties. Deze pagina wordt per bezoek opgebouwd,
// omdat de auteur zijn eigen wachtende berichten ziet en moderators meer
// knoppen krijgen.
async function Draad({ params, searchParams }: Props) {
  const { lang, onderwerp: onderwerpSlug, draad: draadSlug } = await params;
  if (!isTaal(lang)) notFound();
  const id = Number.parseInt(draadSlug, 10);
  if (!Number.isSafeInteger(id) || id <= 0) notFound();

  const supabase = await maakServerClient();
  if (!supabase) notFound();

  const { data: draad } = await supabase
    .from("forum_draden")
    .select("id, onderwerp, titel, taal, status, gesloten")
    .eq("id", id)
    .maybeSingle<DraadRij>();
  if (!draad || draad.status === "verwijderd") notFound();

  // Klopt het adres niet precies, dan door naar het juiste adres.
  const pad = draadPad(lang, draad);
  if (pad !== `/${lang}/forum/${onderwerpSlug}/${draadSlug}`) redirect(pad);

  const { data: berichtData } = await supabase
    .from("forum_berichten")
    .select(
      "id, tekst, taal, is_opening, status, aangemaakt, bewerkt, auteur_id, " +
        "auteur:profielen(gebruikersnaam, rol), forum_vertalingen(taal, titel, tekst)",
    )
    .eq("draad_id", id)
    .neq("status", "verwijderd")
    .order("aangemaakt", { ascending: true })
    .overrideTypes<BerichtRij[], { merge: false }>();
  const berichten = berichtData ?? [];

  const sessie = await huidigeSessie();
  const volledig = Boolean(sessie && sessie.heeft2fa && sessie.aal === "aal2");
  const moderator = volledig && isModerator(sessie);

  const t = ledenTeksten[lang];
  const zoek = await searchParams;
  const fout = typeof zoek.fout === "string" ? t.forumFouten[zoek.fout] ?? t.fouten.algemeen : null;
  const onderwerp = onderwerpen.find((o) => o.id === draad.onderwerp)!;

  const opening = berichten.find((b) => b.is_opening);
  const titelVertaling = opening?.forum_vertalingen.find((v) => v.taal === lang)?.titel;
  const titel = draad.taal !== lang && titelVertaling ? titelVertaling : draad.titel;

  return (
    <div className="forum draad">
      <nav className="kruimelpad" aria-label="Kruimelpad">
        <Link href={`/${lang}/forum`}>{t.forum.titel}</Link> ›{" "}
        <Link href={onderwerpPad(onderwerp, lang)}>{onderwerp.naam[lang]}</Link>
      </nav>
      <h1 lang={titel === draad.titel ? draad.taal : lang}>{titel}</h1>

      {fout && (
        <p className="formulier-fout" role="alert">
          {fout}
        </p>
      )}
      {zoek.gemeld && <p className="formulier-melding">{t.forum.gemeld}</p>}
      {draad.gesloten && <p className="formulier-melding">{t.forum.draadGesloten}</p>}
      {moderator && (
        <form action={draadSluiten.bind(null, lang, draad.id, !draad.gesloten, pad)}>
          <Formulierknop bezig={t.bezig} soort="licht">
            {draad.gesloten ? t.forum.openen : t.forum.sluiten}
          </Formulierknop>
        </form>
      )}

      {berichten.map((b) => (
        <Bericht
          key={b.id}
          taal={lang}
          bericht={b}
          pad={pad}
          eigen={volledig && sessie?.id === b.auteur_id}
          magMelden={volledig && sessie?.id !== b.auteur_id}
          moderator={moderator}
        />
      ))}

      {draad.status === "zichtbaar" && !draad.gesloten &&
        (volledig ? (
          <Reactieformulier taal={lang} draadId={draad.id} pad={pad} />
        ) : (
          <p className="inlogoproep">
            <Link href={accountPad(lang, "inloggen", pad)} className="knop knop-hoofd">
              {t.forum.inloggenOmTeReageren}
            </Link>
          </p>
        ))}
    </div>
  );
}

function Bericht({
  taal,
  bericht: b,
  pad,
  eigen,
  magMelden,
  moderator,
}: {
  taal: Taal;
  bericht: BerichtRij;
  pad: string;
  eigen: boolean;
  magMelden: boolean;
  moderator: boolean;
}) {
  const t = ledenTeksten[taal];
  const origineleTaal: PostTaal = isPostTaal(b.taal) ? b.taal : "nl";
  const vertaling = origineleTaal !== taal
    ? b.forum_vertalingen.find((v) => v.taal === taal)
    : undefined;
  const rolLabel =
    b.auteur?.rol === "moderator" || b.auteur?.rol === "beheerder"
      ? t.rollen[b.auteur.rol]
      : null;

  return (
    <article id={`bericht-${b.id}`} className={`bericht bericht-${b.status}`}>
      <header className="bericht-kop">
        <strong>{b.auteur?.gebruikersnaam ?? "—"}</strong>
        {rolLabel && <span className="label-licht">{rolLabel}</span>}
        <time dateTime={b.aangemaakt}>{forumDatum(taal, b.aangemaakt)}</time>
        {b.bewerkt && <span>({t.forum.bewerkt})</span>}
        {/* Taal van het origineel altijd zichtbaar (W-FOR-06, W-TAAL-08). */}
        {origineleTaal !== taal && (
          <span className="label-licht">
            {vertaling
              ? `${t.forum.automatischVertaald} ${postTaalInZin[taal][origineleTaal]}`
              : `${t.forum.origineel}: ${postTaalNamen[taal][origineleTaal]} · ${t.forum.nogNietVertaald}`}
          </span>
        )}
      </header>

      {b.status === "wacht" && <p className="formulier-melding">{t.forum.wachtOpGoedkeuring}</p>}
      {b.status === "verborgen" && <p className="formulier-fout">{t.forum.verborgen}</p>}

      {vertaling ? (
        <>
          <div lang={taal}>
            <Berichttekst tekst={vertaling.tekst} />
          </div>
          <details className="origineel">
            <summary>{t.forum.origineelTonen}</summary>
            <div lang={origineleTaal}>
              <Berichttekst tekst={b.tekst} />
            </div>
          </details>
        </>
      ) : (
        <div lang={origineleTaal}>
          <Berichttekst tekst={b.tekst} />
        </div>
      )}

      {(eigen || magMelden || moderator) && (
        <footer className="bericht-acties">
          {magMelden && (
            <details>
              <summary>{t.forum.melden}</summary>
              <form action={meld.bind(null, taal, b.id, pad)} className="formulier">
                <label>
                  {t.forum.meldReden}
                  <textarea name="reden" required minLength={3} maxLength={1000} rows={3} />
                </label>
                <Formulierknop bezig={t.bezig} soort="licht">
                  {t.forum.meldVersturen}
                </Formulierknop>
              </form>
            </details>
          )}
          {eigen && (
            <details>
              <summary>{t.forum.verwijderen}</summary>
              <form action={verwijderEigen.bind(null, taal, b.id, pad)}>
                <Formulierknop bezig={t.bezig} soort="gevaar">
                  {t.forum.verwijderenBevestig}
                </Formulierknop>
              </form>
            </details>
          )}
          {moderator && b.status !== "zichtbaar" && (
            <form action={modereer.bind(null, taal, b.id, "tonen", pad)}>
              <Formulierknop bezig={t.bezig} soort="licht">
                {t.forum.tonen}
              </Formulierknop>
            </form>
          )}
          {moderator && b.status === "zichtbaar" && (
            <form action={modereer.bind(null, taal, b.id, "verbergen", pad)}>
              <Formulierknop bezig={t.bezig} soort="gevaar">
                {t.forum.verbergen}
              </Formulierknop>
            </form>
          )}
        </footer>
      )}
    </article>
  );
}
