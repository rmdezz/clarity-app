import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts', // Archivo para configurar el DOM
    // Esto le dice a Vitest que cada vez que el código pida 'next/navigation',
    // debe sustituirlo por el mock proporcionado por la librería.
    alias: {
      'next/navigation': 'next-router-mock',
    },
    server: {
      deps: {
        inline: ['next-router-mock']
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});