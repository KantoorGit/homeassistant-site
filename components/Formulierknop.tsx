"use client";

import { useFormStatus } from "react-dom";

// Verzendknop die tijdens het versturen uitgeschakeld is, zodat een
// formulier niet twee keer wordt verstuurd.
export default function Formulierknop({
  children,
  bezig,
  soort = "hoofd",
}: {
  children: React.ReactNode;
  bezig: string;
  soort?: "hoofd" | "licht" | "gevaar";
}) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={`knop knop-${soort}`} disabled={pending}>
      {pending ? bezig : children}
    </button>
  );
}
