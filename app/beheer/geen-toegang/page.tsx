import { beheerT } from "@/lib/beheer/taal";
import { uitloggen } from "../acties";

export default async function GeenToegang() {
  const { t } = await beheerT();
  return (
    <section className="beheer-smal">
      <h1>{t.geenToegang.titel}</h1>
      <p>{t.geenToegang.uitleg}</p>
      <form action={uitloggen}>
        <button type="submit">{t.algemeen.uitloggen}</button>
      </form>
    </section>
  );
}
