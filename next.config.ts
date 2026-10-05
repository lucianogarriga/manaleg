import type { NextConfig } from "next";

// CSP — Content-Security-Policy
// Indica al browser qué fuentes son legítimas para scripts, estilos, conexiones, etc.
// Previene XSS: aunque un atacante inyecte código, el browser no lo ejecuta si no
// proviene de una fuente autorizada.
// 'unsafe-inline' en script-src es necesario porque Next.js App Router inyecta scripts
// inline para hidratación. 'unsafe-eval' es requerido por Turbopack en desarrollo.
function buildCsp(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  // Supabase usa WebSockets para realtime (wss://)
  const supabaseWss = supabaseUrl.replace(/^https:\/\//, "wss://");

  const directives = [
    "default-src 'self'",
    // Next.js necesita 'unsafe-inline' para hidratación. 'unsafe-eval' solo en dev (Turbopack).
    `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""}`,
    // Tailwind genera estilos inline
    "style-src 'self' 'unsafe-inline'",
    // Conexiones permitidas: propia app + Supabase REST/Auth + Supabase Realtime (wss)
    `connect-src 'self' ${supabaseUrl} ${supabaseWss}`,
    // Imágenes: propias + data URIs (avatares inline) + blob (previews de archivo)
    "img-src 'self' data: blob:",
    "font-src 'self'",
    // No puede ser embebida en iframes de terceros (refuerza X-Frame-Options)
    "frame-ancestors 'none'",
    // El atributo base de HTML solo puede apuntar al propio origen
    "base-uri 'self'",
    // Los formularios solo pueden submitear al propio origen
    "form-action 'self'",
  ];

  return directives.join("; ");
}

function buildHeaders() {
  return [
    { key: "X-Frame-Options",             value: "DENY" },
    { key: "X-Content-Type-Options",       value: "nosniff" },
    { key: "Referrer-Policy",              value: "strict-origin-when-cross-origin" },
    { key: "Permissions-Policy",           value: "camera=(), microphone=(), geolocation=()" },
    ...(process.env.NODE_ENV === "production"
      ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
      : []),
    { key: "Content-Security-Policy",      value: buildCsp() },
  ];
}

const nextConfig: NextConfig = {
  devIndicators: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: buildHeaders(),
      },
    ];
  },
};

export default nextConfig;
