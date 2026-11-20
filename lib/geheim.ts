import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

// Controleert "Authorization: Bearer <geheim>" in constante tijd, zodat de
// tijd die de controle kost niets verraadt over het geheim (W-SEC-18).
export function bearerKlopt(request: Request, verwacht: string): boolean {
  const kop = request.headers.get("authorization") ?? "";
  const gegeven = kop.startsWith("Bearer ") ? kop.slice(7).trim() : "";
  if (!gegeven || !verwacht) return false;
  const a = createHash("sha256").update(gegeven).digest();
  const b = createHash("sha256").update(verwacht).digest();
  return timingSafeEqual(a, b);
}
