"use client";

import { openCookieInstellingen } from "./Cookiebanner";

export default function CookieInstellingenLink({ tekst }: { tekst: string }) {
  return (
    <button type="button" className="voet-link" onClick={openCookieInstellingen}>
      {tekst}
    </button>
  );
}
