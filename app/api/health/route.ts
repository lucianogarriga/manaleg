import { NextResponse } from "next/server";

// Health check endpoint para monitoreo externo (UptimeRobot, Betterstack, etc.)
// No requiere autenticación — solo verifica que el servidor responde.
export async function GET() {
  return NextResponse.json({ status: "ok", ts: Date.now() }, { status: 200 });
}
