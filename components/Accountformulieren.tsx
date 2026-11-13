"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  bevestig2faInstellen,
  bevestigTweeFactor,
  gebruikCode,
  logIn,
  registreer,
  start2faInstellen,
  vernieuwHerstelcodes,
  vraagNieuwWachtwoord,
  zetNieuwWachtwoord,
  type Formulierstaat,
} from "@/app/[lang]/account/acties";
import Botcontrole from "@/components/Botcontrole";
import Formulierknop from "@/components/Formulierknop";
import { accountPad } from "@/lib/paden";
import type { Taal } from "@/lib/site";
import { ledenTeksten } from "@/lib/teksten-leden";

const leeg: Formulierstaat = {};

function Uitkomst({ staat }: { staat: Formulierstaat }) {
  return (
    <>
      {staat.fout && (
        <p className="formulier-fout" role="alert">
          {staat.fout}
        </p>
      )}
      {staat.melding && (
        <p className="formulier-melding" role="status">
          {staat.melding}
        </p>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------

export function RegistreerFormulier({ taal }: { taal: Taal }) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(registreer.bind(null, taal), leeg);

  if (staat.melding) return <Uitkomst staat={staat} />;

  return (
    <form action={actie} className="formulier" key={staat.poging}>
      <Uitkomst staat={staat} />
      <label>
        {t.gebruikersnaam}
        <input
          name="gebruikersnaam"
          required
          minLength={3}
          maxLength={30}
          pattern="[A-Za-z0-9_.\-]{3,30}"
          autoComplete="username"
          defaultValue={staat.waarden?.gebruikersnaam}
        />
        <small>{t.gebruikersnaamUitleg}</small>
      </label>
      <label>
        {t.email}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={staat.waarden?.email}
        />
      </label>
      <label>
        {t.wachtwoord}
        <input
          name="wachtwoord"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
        />
        <small>{t.wachtwoordUitleg}</small>
      </label>
      <label>
        {t.wachtwoordHerhalen}
        <input
          name="wachtwoord2"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      {/* Lokaas voor robots: onzichtbaar voor mensen. */}
      <div className="lokaas" aria-hidden="true">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="vinkje">
        <input type="checkbox" name="akkoord" value="ja" required />
        <span>
          {t.akkoordMet}{" "}
          <Link href={`/${taal}/forum/regels`} target="_blank">
            {t.forumregels}
          </Link>
        </span>
      </label>
      <p className="uitleg">{t.verplicht2faUitleg}</p>
      <Botcontrole taal={taal} ververs={staat.poging} />
      <Formulierknop bezig={t.bezig}>{t.registreren}</Formulierknop>
      <p>
        {t.alAccount} <Link href={accountPad(taal, "inloggen")}>{t.inloggen}</Link>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function InlogFormulier({ taal, volgende }: { taal: Taal; volgende: string }) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(logIn.bind(null, taal, volgende), leeg);

  return (
    <form action={actie} className="formulier" key={staat.poging}>
      <Uitkomst staat={staat} />
      <label>
        {t.email}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={staat.waarden?.email}
        />
      </label>
      <label>
        {t.wachtwoord}
        <input name="wachtwoord" type="password" required autoComplete="current-password" />
      </label>
      <Botcontrole taal={taal} ververs={staat.poging} />
      <Formulierknop bezig={t.bezig}>{t.inloggen}</Formulierknop>
      <p>
        <Link href={accountPad(taal, "wachtwoordVergeten")}>{t.wachtwoordVergetenLink}</Link>
      </p>
      <p>
        {t.nogGeenAccount}{" "}
        <Link href={accountPad(taal, "registreren")}>{t.registreren}</Link>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------

function CodeVeld({ label }: { label: string }) {
  return (
    <label>
      {label}
      <input
        name="code"
        required
        inputMode="numeric"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        autoComplete="one-time-code"
        className="codeveld"
        autoFocus
      />
    </label>
  );
}

export function TweeFactorFormulier({ taal, volgende }: { taal: Taal; volgende: string }) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(bevestigTweeFactor.bind(null, taal, volgende), leeg);

  return (
    <form action={actie} className="formulier" key={staat.poging}>
      <p>{t.tweeFactorUitleg}</p>
      <Uitkomst staat={staat} />
      <CodeVeld label={t.code} />
      <Formulierknop bezig={t.bezig}>{t.bevestigen}</Formulierknop>
      <p>
        <Link href={accountPad(taal, "herstelcode")}>{t.geenToegangApp}</Link>
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------

function Herstelcodelijst({
  taal,
  codes,
  volgende,
}: {
  taal: Taal;
  codes: string[];
  volgende?: string;
}) {
  const t = ledenTeksten[taal];
  const [gekopieerd, zetGekopieerd] = useState(false);

  return (
    <section className="herstelcodes" aria-labelledby="herstelcodes-kop">
      <h2 id="herstelcodes-kop">{t.herstelcodesTitel}</h2>
      <p>{t.herstelcodesUitleg}</p>
      <ol>
        {codes.map((c) => (
          <li key={c}>
            <code>{c}</code>
          </li>
        ))}
      </ol>
      <p className="knoppenrij">
        <button
          type="button"
          className="knop knop-licht"
          onClick={async () => {
            await navigator.clipboard.writeText(codes.join("\n"));
            zetGekopieerd(true);
          }}
        >
          {gekopieerd ? t.herstelcodesGekopieerd : t.herstelcodesKopieren}
        </button>
        {volgende && (
          <a href={volgende} className="knop knop-hoofd">
            {t.herstelcodesBewaard}
          </a>
        )}
      </p>
    </section>
  );
}

export function Instellen2faFormulier({ taal, volgende }: { taal: Taal; volgende: string }) {
  const t = ledenTeksten[taal];
  const [start, startActie] = useActionState(start2faInstellen.bind(null, taal), leeg);
  const [staat, bevestigActie] = useActionState(
    bevestig2faInstellen.bind(null, taal),
    leeg,
  );

  // Klaar: herstelcodes tonen. Een gewone link (geen client-navigatie),
  // zodat de volgende pagina de nieuwe sessie met 2FA meteen ziet.
  if (staat.codes) {
    if (staat.codesNietBeschikbaar) {
      return (
        <div className="formulier">
          <p className="formulier-melding">{t.herstelcodesNietBeschikbaar}</p>
          <a href={volgende} className="knop knop-hoofd">
            {t.doorgaan}
          </a>
        </div>
      );
    }
    return <Herstelcodelijst taal={taal} codes={staat.codes} volgende={volgende} />;
  }

  const qr = staat.qr ?? start.qr;
  const geheim = staat.geheim ?? start.geheim;
  const factorId = staat.factorId ?? start.factorId;

  return (
    <div className="formulier">
      <p>{t.instellenStap1}</p>
      {!qr ? (
        <form action={startActie}>
          <Uitkomst staat={start} />
          <Formulierknop bezig={t.bezig}>{t.instellenStart}</Formulierknop>
        </form>
      ) : (
        <>
          <p>{t.instellenStap2}</p>
          {/* De QR-code is een SVG die Supabase meestuurt (data-adres). */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt={t.qrAlt} width={200} height={200} className="qr" />
          <p className="klein">
            {t.instellenHandmatig} <code className="geheim">{geheim}</code>
          </p>
          <form action={bevestigActie} className="formulier">
            <p>{t.instellenStap3}</p>
            <Uitkomst staat={staat} />
            <input type="hidden" name="factorId" value={factorId} />
            <CodeVeld label={t.code} />
            <Formulierknop bezig={t.bezig}>{t.bevestigen}</Formulierknop>
          </form>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

export function HerstelcodeFormulier({ taal }: { taal: Taal }) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(gebruikCode.bind(null, taal), leeg);

  return (
    <form action={actie} className="formulier" key={staat.poging}>
      <p>{t.herstelcodeUitleg}</p>
      <Uitkomst staat={staat} />
      <label>
        {t.herstelcode}
        <input
          name="herstelcode"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="XXXXX-XXXXX"
          className="codeveld"
        />
      </label>
      <Formulierknop bezig={t.bezig} soort="gevaar">
        {t.herstelcodeGebruiken}
      </Formulierknop>
    </form>
  );
}

export function NieuweHerstelcodesFormulier({ taal }: { taal: Taal }) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(vernieuwHerstelcodes.bind(null, taal), leeg);

  if (staat.codes) return <Herstelcodelijst taal={taal} codes={staat.codes} />;
  return (
    <form action={actie}>
      <Uitkomst staat={staat} />
      <p className="klein">{t.nieuweHerstelcodesUitleg}</p>
      <Formulierknop bezig={t.bezig} soort="licht">
        {t.nieuweHerstelcodes}
      </Formulierknop>
    </form>
  );
}

// ---------------------------------------------------------------------------

export function WachtwoordVergetenFormulier({ taal }: { taal: Taal }) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(vraagNieuwWachtwoord.bind(null, taal), leeg);

  if (staat.melding) return <Uitkomst staat={staat} />;
  return (
    <form action={actie} className="formulier" key={staat.poging}>
      <p>{t.wachtwoordVergetenUitleg}</p>
      <Uitkomst staat={staat} />
      <label>
        {t.email}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          defaultValue={staat.waarden?.email}
        />
      </label>
      <Botcontrole taal={taal} ververs={staat.poging} />
      <Formulierknop bezig={t.bezig}>{t.stuurLink}</Formulierknop>
    </form>
  );
}

export function NieuwWachtwoordFormulier({ taal }: { taal: Taal }) {
  const t = ledenTeksten[taal];
  const [staat, actie] = useActionState(zetNieuwWachtwoord.bind(null, taal), leeg);

  if (staat.melding) {
    return (
      <div className="formulier">
        <Uitkomst staat={staat} />
        <Link href={accountPad(taal, "overzicht")}>{t.mijnAccount}</Link>
      </div>
    );
  }
  return (
    <form action={actie} className="formulier">
      <Uitkomst staat={staat} />
      <label>
        {t.nieuwWachtwoord}
        <input
          name="wachtwoord"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
        />
        <small>{t.wachtwoordUitleg}</small>
      </label>
      <label>
        {t.wachtwoordHerhalen}
        <input
          name="wachtwoord2"
          type="password"
          required
          minLength={10}
          maxLength={72}
          autoComplete="new-password"
        />
      </label>
      <Formulierknop bezig={t.bezig}>{t.opslaan}</Formulierknop>
    </form>
  );
}
