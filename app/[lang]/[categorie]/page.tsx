import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Artikelkaart from "@/components/Artikelkaart";
import { categorieen, isTaal, talen, teksten, vindCategorie } from "@/lib/site";
import { artikelen } from "@/lib/voorbeeldartikelen";

export async function generateStaticParams() {
  return talen.flatMap((lang) =>
    categorieen
      .filter((c) => c.slug[lang] !== "")
      .map((c) => ({ lang, categorie: c.slug[lang] })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/[categorie]">): Promise<Metadata> {
  const { lang, categorie: slug } = await params;
  if (!isTaal(lang)) return {};
  const categorie = vindCategorie(lang, slug);
  return categorie ? { title: categorie.naam[lang] } : {};
}

// Overzichtspagina per categorie (requirement W-LAY-06).
export default async function Categoriepagina({
  params,
}: PageProps<"/[lang]/[categorie]">) {
  const { lang, categorie: slug } = await params;
  if (!isTaal(lang)) notFound();
  const categorie = vindCategorie(lang, slug);
  if (!categorie) notFound();

  const t = teksten[lang];
  const lijst =
    categorie.id === "laatste-nieuws"
      ? artikelen
      : artikelen.filter((a) => a.categorieId === categorie.id);

  return (
    <div className="categoriepagina">
      <h1>{categorie.naam[lang]}</h1>
      {lijst.length === 0 ? (
        <p className="leeg">{t.nogLeeg}</p>
      ) : (
        <div className="raster">
          {lijst.map((artikel) => (
            <Artikelkaart key={artikel.id} artikel={artikel} taal={lang} />
          ))}
        </div>
      )}
    </div>
  );
}
