import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El indicador "N" de desarrollo tapaba el avatar del sidebar y chocaría
  // con el FAB. Los errores igual se muestran en el overlay de Next.
  devIndicators: false,
};

export default nextConfig;
