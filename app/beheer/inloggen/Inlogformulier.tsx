"use client";

import { useActionState } from "react";
import type { BeheerTeksten } from "@/lib/beheer/teksten";
import { inloggen } from "../acties";

export default function Inlogformulier({
  t,
  bezigTekst,
}: {
  t: BeheerTeksten["inloggen"];
  bezigTekst: string;
}) {
  const [staat, actie, bezig] = useActionState(inloggen, undefined);
  return (
    <form action={actie} className="formulier">
      <label>
        {t.email}
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        {t.wachtwoord}
        <input name="wachtwoord" type="password" autoComplete="current-password" required />
      </label>
      {staat?.fout && <p className="fout" role="alert">{staat.fout}</p>}
      <button type="submit" disabled={bezig}>
        {bezig ? bezigTekst : t.knop}
      </button>
    </form>
  );
}
