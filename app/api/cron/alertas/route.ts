import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { enviarAvisos } from "@/services/alerts/avisosDiarios";

// Comparación a tiempo constante: no revela cuántos caracteres coinciden.
// Se comparan los hashes SHA-256 para que ambos tengan el mismo largo.
function coincide(recibido: string | null, esperado: string): boolean {
  if (!recibido) return false;
  const a = createHash("sha256").update(recibido).digest();
  const b = createHash("sha256").update(esperado).digest();
  return timingSafeEqual(a, b);
}

export const maxDuration = 60; // segundos — activo en planes Pro/Enterprise de Vercel

// Lo invoca Vercel Cron de lunes a viernes (ver vercel.json).
// Vercel manda automáticamente "Authorization: Bearer <CRON_SECRET>".
// ?dry=1 calcula qué se enviaría sin mandar ni registrar nada.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no está configurado" }, { status: 500 });
  }
  if (!coincide(request.headers.get("authorization"), `Bearer ${secret}`)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const resumen = await enviarAvisos({
      dryRun: request.nextUrl.searchParams.get("dry") === "1",
    });
    return NextResponse.json(resumen, { status: resumen.errores.length ? 207 : 200 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
