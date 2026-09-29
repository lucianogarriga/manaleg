import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_KEY, SUPABASE_URL } from "./config";

const AUTH_PAGES = ["/login", "/register"];
const PUBLIC_PREFIXES = [...AUTH_PAGES, "/api/auth"];

// Refresca la sesión de Supabase en cada request y redirige según
// si el usuario está logueado o no.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // No meter código entre createServerClient y getClaims:
  // getClaims es lo que valida y refresca el token.
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;
  const isAuthPage = AUTH_PAGES.some((p) => path.startsWith(p));
  const isPublic = PUBLIC_PREFIXES.some((p) => path.startsWith(p));

  if (!isLoggedIn && !isPublic) return redirectTo(request, response, "/login");
  if (isLoggedIn && isAuthPage) return redirectTo(request, response, "/causas");

  return response;
}

// Redirige conservando las cookies de sesión que Supabase haya refrescado
function redirectTo(request: NextRequest, response: NextResponse, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
