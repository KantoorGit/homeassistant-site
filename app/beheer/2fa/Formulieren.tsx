"use client";

import { useActionState, useState, useTransition } from "react";
import {
  bevestig2fa,
  controleer2fa,
  start2fa,
  type Koppeling,
} from "../acties";

function Codeveld() {
  return (
    <label>
      Code uit de app
      <input
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        autoFocus
      />
    </label>
  );
}

export function Codeformulier() {
  const [staat, actie, bezig] = useActionState(controleer2fa, undefined);
  return (
    <form action={actie} className="formulier">
      <Codeveld />
      {staat?.fout && <p className="fout" role="alert">{staat.fout}</p>}
      <button type="submit" disabled={bezig}>
        {bezig ? "Bezig…" : "Bevestigen"}
      </button>
    </form>
  );
}

export function Koppelen() {
  const [koppeling, zetKoppeling] = useState<Koppeling | null>(null);
  const [bezigMetStart, start] = useTransition();
  const [staat, actie, bezig] = useActionState(bevestig2fa, undefined);

  if (!koppeling || koppeling.fout !== undefined) {
    return (
      <div className="formulier">
        {koppeling?.fout && (
          <p className="fout" role="alert">{koppeling.fout}</p>
        )}
        <button
          type="button"
          disabled={bezigMetStart}
          onClick={() => start(async () => zetKoppeling(await start2fa()))}
        >
          {bezigMetStart ? "Bezig…" : "Authenticator-app koppelen"}
        </button>
      </div>
    );
  }

  return (
    <form action={actie} className="formulier">
      <ol className="stappen">
        <li>Open je authenticator-app en kies ‘account toevoegen’.</li>
        <li>Scan deze QR-code.</li>
      </ol>
      {/* De QR-code komt als afbeelding (SVG) van Supabase. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={koppeling.qr} alt="QR-code voor je authenticator-app" className="qr" />
      <details>
        <summary>Lukt scannen niet? Typ dan deze sleutel over</summary>
        <code className="geheim">{koppeling.geheim}</code>
      </details>
      <input type="hidden" name="factorId" value={koppeling.factorId} />
      <Codeveld />
      {staat?.fout && <p className="fout" role="alert">{staat.fout}</p>}
      <button type="submit" disabled={bezig}>
        {bezig ? "Bezig…" : "Koppeling bevestigen"}
      </button>
    </form>
  );
}
