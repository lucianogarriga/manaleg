import type { NextConfig } from "next";

const securityHeaders = [
  // Evita que la app sea embebida en iframes de terceros (clickjacking)
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // El browser no intenta adivinar el content-type
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Controla cuánto referrer se envía al navegar a otros sitios
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Desactiva funcionalidades de browser innecesarias para esta app
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HSTS: fuerza HTTPS por 1 año (solo afecta en producción con HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  // El indicador "N" de desarrollo tapaba el avatar del sidebar y chocaría
  // con el FAB. Los errores igual se muestran en el overlay de Next.
  devIndicators: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
