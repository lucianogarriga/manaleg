import { NextResponse, type NextRequest } from "next/server";
import { enviarAvisos } from "@/services/alerts/avisosDiarios";

// Lo invoca Vercel Cron de lunes a viernes (ver vercel.json).
// Vercel manda automáticamente "Authorization: Bearer <CRON_SECRET>".
// ?dry=1 calcula qué se enviaría sin mandar ni registrar nada.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no está configurado" }, { status: 500 });
  }
  if (request.headers.get("authorization") !== `Bearer ${secret}`) {
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
