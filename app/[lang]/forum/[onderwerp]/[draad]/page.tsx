import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { Laden } from "@/components/Accountkader";
import Berichttekst from "@/components/Berichttekst";
import Formulierknop from "@/components/Formulierknop";
import { BewerkFormulier, Reactieformulier, VertaalFormulier } from "@/components/Forumformulieren";
import {
  draadPad,
  forumDatum,
  isPostTaal,
  onderwerpen,
  onderwerpPad,
  type Berichtstatus,
  type PostTaal,
} from "@/lib/forum";
import { accountPad } from "@/lib/paden";
import { huidigeSessie, isModerator, type Rol } from "@/lib/sessie";
import { isTaal, nietVertaaldZin, vertaaldUitZin, type Taal } from "@/lib/site";
import { maakServerClient } from "@/lib/supabase-server";
import { haalActieveTalen } from "@/lib/talen-instelling";
import { ledenTeksten } from "@/lib/teksten-leden";
import { draadSluiten, meld, modereer, verwijderEigen } from "../../acties";

type Props = PageProps<"/[lang]/forum/[onderwerp]/[draad]">;

function zoekBewerkt(zoek: Record<string, string | string[] | undefined>): string {
  return typeof zoek.bewerkt === "string" ? zoek.bewerkt : "";
}


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
  forum_vertalingen: { taal: string; titel: string | null; tekst: string; aangemaakt: string }[];
};

// Stand van de vertalingen van een eigen bericht (voor de schrijver).
type Vertaalstand = { wacht: number; mislukt: number };

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
        "auteur:profielen(gebruikersnaam, rol), forum_vertalingen(taal, titel, tekst, aangemaakt)",
    )
    .eq("draad_id", id)
    .neq("status", "verwijderd")
    .order("aangemaakt", { ascending: true })
    .overrideTypes<BerichtRij[], { merge: false }>();
  const berichten = berichtData ?? [];

  const sessie = await huidigeSessie();
  const volledig = Boolean(sessie && sessie.heeft2fa && sessie.aal === "aal2");
  const moderator = volledig && isModerator(sessie);
  const actieveTalen = await haalActieveTalen();

  // Stand van de vertalingen van de eigen berichten: per taal telt de
  // nieuwste taak (W-TAAL-16).
  const eigenIds = volledig ? berichten.filter((b) => b.auteur_id === sessie?.id).map((b) => b.id) : [];
  const standen = new Map<number, Vertaalstand>();
  if (eigenIds.length > 0) {
    const { data: taken } = await supabase
      .from("vertaal_taken")
      .select("bericht_id, doel_taal, status, aangemaakt")
      .in("bericht_id", eigenIds)
      .order("aangemaakt", { ascending: false })
      .overrideTypes<{ bericht_id: number; doel_taal: string; status: string }[], { merge: false }>();
    const gezien = new Set<string>();
    for (const taak of taken ?? []) {
      const sleutel = `${taak.bericht_id}:${taak.doel_taal}`;
      if (gezien.has(sleutel)) continue;
      gezien.add(sleutel);
      const stand = standen.get(taak.bericht_id) ?? { wacht: 0, mislukt: 0 };
      if (taak.status === "wachtend" || taak.status === "bezig") stand.wacht += 1;
      if (taak.status === "mislukt") stand.mislukt += 1;
      standen.set(taak.bericht_id, stand);
    }
  }
  const bewerktId = Number(zoekBewerkt(await searchParams));

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
          gesloten={draad.gesloten}
          titel={b.is_opening ? draad.titel : undefined}
          actieveTalen={actieveTalen}
          stand={standen.get(b.id)}
          netBewerkt={bewerktId === b.id}
        />
      ))}

      {draad.status === "zichtbaar" && !draad.gesloten &&
        (volledig ? (
          <Reactieformulier taal={lang} draadId={draad.id} pad={pad} actieveTalen={actieveTalen} />
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
  gesloten,
  titel,
  actieveTalen,
  stand,
  netBewerkt,
}: {
  taal: Taal;
  bericht: BerichtRij;
  pad: string;
  eigen: boolean;
  magMelden: boolean;
  moderator: boolean;
  gesloten: boolean;
  titel?: string;
  actieveTalen: Taal[];
  stand?: Vertaalstand;
  netBewerkt: boolean;
}) {
  const t = ledenTeksten[taal];
  const origineleTaal: PostTaal = isPostTaal(b.taal) ? b.taal : "nl";
  const vertaling = origineleTaal !== taal
    ? b.forum_vertalingen.find((v) => v.taal === taal)
    : undefined;
  // Vertaling van een eerdere versie van het bericht?
  const verouderd = Boolean(
    vertaling && b.bewerkt && new Date(vertaling.aangemaakt) < new Date(b.bewerkt),
  );
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
              ? vertaaldUitZin(taal, origineleTaal)
              : nietVertaaldZin(taal, origineleTaal)}
          </span>
        )}
      </header>

      {netBewerkt && <p className="formulier-melding">{t.forum.bewerktMelding}</p>}
      {eigen && stand && (stand.wacht > 0 || stand.mislukt > 0) && (
        <p className="vertaalstatus">{t.forum.vertaalStatus(stand.wacht, stand.mislukt)}</p>
      )}
      {verouderd && <p className="vertaalstatus">{t.forum.vertalingVerouderd}</p>}
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
          {eigen && !gesloten && (
            <details>
              <summary>{t.forum.bewerken}</summary>
              <BewerkFormulier taal={taal} berichtId={b.id} pad={pad} tekst={b.tekst} titel={titel} />
            </details>
          )}
          {eigen && actieveTalen.length > 1 && (
            <details open={netBewerkt}>
              <summary>{t.forum.vertaalknop}</summary>
              <VertaalFormulier
                taal={taal}
                berichtId={b.id}
                pad={pad}
                postTaal={origineleTaal}
                actieveTalen={actieveTalen}
              />
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
