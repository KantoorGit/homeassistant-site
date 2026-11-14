import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Artikelkaart from "@/components/Artikelkaart";
import { getArtikelen } from "@/lib/artikelen";
import { haalAlleCategorieen, haalCategorieen } from "@/lib/categorieen";
import { taalAlternatieven } from "@/lib/hreflang";
import { categoriePad, isTaal, talen, teksten, vindCategorie } from "@/lib/site";

export async function generateStaticParams() {
  const categorieen = await haalCategorieen();
  return talen.flatMap((lang) =>
    categorieen
      // Het forum heeft eigen pagina's in app/[lang]/forum.
      .filter((c) => c.slug[lang] !== "" && c.soort !== "forum")
      .map((c) => ({ lang, categorie: c.slug[lang] })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/[categorie]">): Promise<Metadata> {
  const { lang, categorie: slug } = await params;
  if (!isTaal(lang)) return {};
  const gevonden = vindCategorie(await haalAlleCategorieen(), lang, slug);
  if (!gevonden) return {};
  const categorie = gevonden.categorie;
  return {
    title: categorie.naam[lang],
    alternates: taalAlternatieven(
      lang,
      Object.fromEntries(talen.map((t) => [t, categoriePad(categorie, t)])),
    ),
  };
}

// Overzichtspagina per categorie (requirement W-LAY-06). "Overig" toont ook
// de artikelen van verwijderde categorieën (W-ADM-14).
export default async function Categoriepagina({
  params,
}: PageProps<"/[lang]/[categorie]">) {
  const { lang, categorie: slug } = await params;
  if (!isTaal(lang)) notFound();
  const gevonden = vindCategorie(await haalAlleCategorieen(), lang, slug);
  if (!gevonden || gevonden.categorie.soort === "forum") notFound();
  const categorie = gevonden.categorie;
  // Oud webadres (na hernoemen): door naar het nieuwe adres.
  if (gevonden.oud) permanentRedirect(categoriePad(categorie, lang));

  const t = teksten[lang];
  const artikelen = await getArtikelen(lang);
  const lijst =
    categorie.soort === "laatste-nieuws"
      ? artikelen
      : artikelen.filter((a) => a.categorie.id === categorie.id);

  return (
    <div className="categoriepagina">
      <h1>{categorie.naam[lang]}</h1>
      {lijst.length === 0 ? (
        <p className="leeg">{t.nogLeeg}</p>
      ) : (
        <div className="raster">
          {lijst.map((artikel) => (
            <Artikelkaart key={artikel.id} artikel={artikel} />
          ))}
        </div>
      )}
    </div>
  );
}
