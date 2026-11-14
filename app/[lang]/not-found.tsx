"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { isTaal, type Taal } from "@/lib/site";

// Foutpagina 404. Het kenmerk data-meting-404 laat het meetscript de
// foutpagina tellen, met de site die ernaartoe verwees (W-ANA-38).
const tekst: Record<Taal, { titel: string; uitleg: string; terug: string }> = {
  nl: { titel: "Pagina niet gevonden", uitleg: "Deze pagina bestaat niet (meer) of het adres klopt niet.", terug: "Naar de voorpagina" },
  en: { titel: "Page not found", uitleg: "This page does not exist (anymore) or the address is wrong.", terug: "Go to the home page" },
  zh: { titel: "找不到页面", uitleg: "此页面不存在（或已删除），或者网址有误。", terug: "返回首页" },
  fr: { titel: "Page introuvable", uitleg: "Cette page n'existe pas (ou plus) ou l'adresse est incorrecte.", terug: "Retour à l'accueil" },
  de: { titel: "Seite nicht gefunden", uitleg: "Diese Seite existiert nicht (mehr) oder die Adresse ist falsch.", terug: "Zur Startseite" },
  es: { titel: "Página no encontrada", uitleg: "Esta página no existe (o ya no existe) o la dirección no es correcta.", terug: "Ir a la página de inicio" },
};

export default function NietGevonden() {
  const eerste = usePathname().split("/")[1];
  const taal: Taal = isTaal(eerste) ? eerste : "nl";
  const t = tekst[taal];
  return (
    <section className="artikel" data-meting-404>
      <h1>{t.titel}</h1>
      <p>{t.uitleg}</p>
      <p>
        <Link href={`/${taal}`}>{t.terug}</Link>
      </p>
    </section>
  );
}
