import type { Metadata } from "next";
import Inlogformulier from "./Inlogformulier";

export const metadata: Metadata = { title: "Inloggen" };

export default function Inlogpagina() {
  return (
    <section className="beheer-smal">
      <h1>Inloggen</h1>
      <p>Alleen voor de redactie. Daarna vraagt de site een code uit je authenticator-app.</p>
      <Inlogformulier />
    </section>
  );
}
