import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {

  // 1. AÑADIR ESTA LÍNEA DE CONFIGURACIÓN
  // Esto le indica a Next.js que todas las rutas deben tener una barra final.
  trailingSlash: true,

  async rewrites() {
    return [
      {
        source: '/api/:path*/',
        // La URL de destino lee desde una variable de entorno para máxima flexibilidad.
        // Esto funciona tanto para desarrollo como para previsualización.
        destination: `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/:path*/`,
      },
    ];
  },
};

export default nextConfig;
