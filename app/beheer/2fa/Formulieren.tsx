"use client";

import { useActionState, useState, useTransition } from "react";
import type { BeheerTeksten } from "@/lib/beheer/teksten";
import {
  bevestig2fa,
  controleer2fa,
  start2fa,
  type Koppeling,
} from "../acties";

type T = BeheerTeksten["tweefa"];

function Codeveld({ t }: { t: T }) {
  return (
    <label>
      {t.codeLabel}
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

export function Codeformulier({ t, bezigTekst }: { t: T; bezigTekst: string }) {
  const [staat, actie, bezig] = useActionState(controleer2fa, undefined);
  return (
    <form action={actie} className="formulier">
      <Codeveld t={t} />
      {staat?.fout && <p className="fout" role="alert">{staat.fout}</p>}
      <button type="submit" disabled={bezig}>
        {bezig ? bezigTekst : t.bevestigen}
      </button>
    </form>
  );
}

export function Koppelen({ t, bezigTekst }: { t: T; bezigTekst: string }) {
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
          {bezigMetStart ? bezigTekst : t.koppelen}
        </button>
      </div>
    );
  }

  return (
    <form action={actie} className="formulier">
      <ol className="stappen">
        <li>{t.stap1}</li>
        <li>{t.stap2}</li>
      </ol>
      {/* De QR-code komt als afbeelding (SVG) van Supabase. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={koppeling.qr} alt={t.qrAlt} className="qr" />
      <details>
        <summary>{t.nietScannen}</summary>
        <code className="geheim">{koppeling.geheim}</code>
      </details>
      <input type="hidden" name="factorId" value={koppeling.factorId} />
      <Codeveld t={t} />
      {staat?.fout && <p className="fout" role="alert">{staat.fout}</p>}
      <button type="submit" disabled={bezig}>
        {bezig ? bezigTekst : t.koppelingBevestigen}
      </button>
    </form>
  );
}
