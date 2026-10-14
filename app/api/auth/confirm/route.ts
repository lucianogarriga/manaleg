import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/services/supabase/server";

const TIPOS_VALIDOS: EmailOtpType[] = ["recovery", "signup", "email"];

// Destino de los emails con token_hash (recuperación de contraseña).
// Verifica el token en el servidor y deja la sesión iniciada.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next");
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/causas";

  if (tokenHash && tipo && TIPOS_VALIDOS.includes(tipo)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  return NextResponse.redirect(`${origin}/login?error=enlace`);
}
