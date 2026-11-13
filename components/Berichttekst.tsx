// Toont de tekst van een forumbericht. Alles wordt als platte tekst
// weergegeven (geen HTML uit de invoer), zodat niemand code in de pagina
// kan smokkelen. Blokken tussen ``` worden als code getoond (W-FOR-07).

type Deel = { soort: "tekst"; inhoud: string } | { soort: "code"; taal: string; inhoud: string };

function splits(tekst: string): Deel[] {
  const delen: Deel[] = [];
  const patroon = /```([A-Za-z0-9_+-]*)[ \t]*\n?([\s\S]*?)```/g;
  let vanaf = 0;
  for (const treffer of tekst.matchAll(patroon)) {
    const begin = treffer.index ?? 0;
    if (begin > vanaf) delen.push({ soort: "tekst", inhoud: tekst.slice(vanaf, begin) });
    delen.push({
      soort: "code",
      taal: treffer[1] ?? "",
      inhoud: (treffer[2] ?? "").replace(/\n$/, ""),
    });
    vanaf = begin + treffer[0].length;
  }
  if (vanaf < tekst.length) delen.push({ soort: "tekst", inhoud: tekst.slice(vanaf) });
  return delen;
}

export default function Berichttekst({ tekst }: { tekst: string }) {
  return (
    <div className="berichttekst">
      {splits(tekst).map((deel, i) =>
        deel.soort === "code" ? (
          <pre key={i} translate="no" data-taal={deel.taal || undefined}>
            <code>{deel.inhoud}</code>
          </pre>
        ) : (
          deel.inhoud
            .split(/\n{2,}/)
            .map((alinea) => alinea.trim())
            .filter(Boolean)
            .map((alinea, j) => <p key={`${i}-${j}`}>{alinea}</p>)
        ),
      )}
    </div>
  );
}
