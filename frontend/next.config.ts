import type { NextConfig } from "next";

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // La URL de destino lee desde una variable de entorno para máxima flexibilidad.
        // Esto funciona tanto para desarrollo como para previsualización.
        destination: `${process.env.NEXT_PUBLIC_DJANGO_API_URL}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
