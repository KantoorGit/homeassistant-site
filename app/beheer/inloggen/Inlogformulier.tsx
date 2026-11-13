"use client";

import { useActionState } from "react";
import { inloggen } from "../acties";

export default function Inlogformulier() {
  const [staat, actie, bezig] = useActionState(inloggen, undefined);
  return (
    <form action={actie} className="formulier">
      <label>
        E-mailadres
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Wachtwoord
        <input
          name="wachtwoord"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      {staat?.fout && <p className="fout" role="alert">{staat.fout}</p>}
      <button type="submit" disabled={bezig}>
        {bezig ? "Bezig…" : "Inloggen"}
      </button>
    </form>
  );
}
