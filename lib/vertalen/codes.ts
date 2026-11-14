// Codeblokken (```…```) en code tussen backticks (`…`) worden nooit vertaald
// (W-FOR-07). Vóór het vertalen vervangen door een merkteken ⟦CODE1⟧;
// daarna worden ze ongewijzigd teruggezet.

const patroon = /```[\s\S]*?```|`[^`\n]+`/g;

export function beschermCode(tekst: string): { tekst: string; codes: string[] } {
  const codes: string[] = [];
  const beschermd = tekst.replace(patroon, (code) => {
    codes.push(code);
    return `⟦CODE${codes.length}⟧`;
  });
  return { tekst: beschermd, codes };
}

// Zet de code terug. Geeft null als een merkteken ontbreekt, dubbel
// voorkomt of er een onbekend merkteken bij is gekomen.
export function herstelCode(vertaald: string, codes: string[]): string | null {
  const gevonden = [...vertaald.matchAll(/⟦CODE(\d+)⟧/g)].map((m) => Number(m[1]));
  if (gevonden.length !== codes.length) return null;
  const uniek = new Set(gevonden);
  if (uniek.size !== codes.length) return null;
  for (let i = 1; i <= codes.length; i++) if (!uniek.has(i)) return null;
  return vertaald.replace(/⟦CODE(\d+)⟧/g, (_, n: string) => codes[Number(n) - 1]);
}
