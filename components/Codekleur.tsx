import type { ReactNode } from "react";

// Eenvoudige syntax-kleuring voor codeblokken in forumberichten (W-FOR-07).
// Gericht op wat in Home Assistant het meest voorkomt: YAML met Jinja-
// sjablonen. Andere talen krijgen dezelfde algemene kleuring (opmerkingen,
// teksten, getallen). Alles blijft platte tekst: er komt nooit HTML uit de
// invoer op de pagina.

type Stuk = { soort: string | null; tekst: string };

// Volgorde is belangrijk: het eerste patroon dat past, wint.
const regels: [string, RegExp][] = [
  ["jinja", /\{\{[\s\S]*?\}\}|\{%[\s\S]*?%\}|\{#[\s\S]*?#\}/y],
  ["opmerking", /#[^\n]*/y],
  ["tekst", /"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|''|\\.)*'/y],
  ["sleutel", /(?<=^[ \t]*(?:- )?)[A-Za-z_][\w.-]*(?=\s*:(?:\s|$))/my],
  ["anker", /[&*][A-Za-z_][\w-]*|![A-Za-z_][\w!]*/y],
  ["waarde", /\b(?:true|false|null|on|off|yes|no|True|False|None)\b/y],
  ["getal", /\b-?\d+(?:\.\d+)?\b/y],
];

function kleur(code: string): Stuk[] {
  const stukken: Stuk[] = [];
  let platte = "";
  let i = 0;
  outer: while (i < code.length) {
    for (const [soort, patroon] of regels) {
      patroon.lastIndex = i;
      const m = patroon.exec(code);
      if (m && m[0].length > 0) {
        // Een # midden in een woord (bijv. een URL-anker) is geen opmerking.
        if (soort === "opmerking" && i > 0 && !/\s/.test(code[i - 1])) continue;
        if (platte) {
          stukken.push({ soort: null, tekst: platte });
          platte = "";
        }
        stukken.push({ soort, tekst: m[0] });
        i += m[0].length;
        continue outer;
      }
    }
    platte += code[i];
    i += 1;
  }
  if (platte) stukken.push({ soort: null, tekst: platte });
  return stukken;
}

export default function Codekleur({ code }: { code: string }): ReactNode {
  return kleur(code).map((s, i) =>
    s.soort ? (
      <span key={i} className={`code-${s.soort}`}>
        {s.tekst}
      </span>
    ) : (
      s.tekst
    ),
  );
}
