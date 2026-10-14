import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/services/supabase/server";

// Destino del link de confirmación de email (y futuros logins OAuth).
// Supabase redirige acá con ?code=... que se canjea por una sesión.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next");
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : "/causas";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  return NextResponse.redirect(`${origin}/login?error=confirmacion`);
}
