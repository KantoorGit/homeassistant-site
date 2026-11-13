import { uitloggen } from "../acties";

export default function GeenToegang() {
  return (
    <section className="beheer-smal">
      <h1>Geen toegang</h1>
      <p>
        Je bent ingelogd, maar je account heeft (nog) niet de rol redacteur of
        beheerder. Vraag de beheerder om je deze rol te geven.
      </p>
      <form action={uitloggen}>
        <button type="submit">Uitloggen</button>
      </form>
    </section>
  );
}
