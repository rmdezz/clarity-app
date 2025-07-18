import type { Config } from 'tailwindcss';

const config: Config = {
  // AQUÍ ESTÁ LA SOLUCIÓN A SU PROBLEMA:
  // Especificamos explícitamente todas las carpetas que contienen clases de Tailwind.
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}', // Para compatibilidad
    './src/features/**/*.{js,ts,jsx,tsx,mdx}',
    './src/entities/**/*.{js,ts,jsx,tsx,mdx}',
    './src/shared/**/*.{js,ts,jsx,tsx,mdx}', // MUY IMPORTANTE
  ],
  theme: {
    extend: {
      // Re-establecemos la configuración del tema que antes estaba en globals.css
      colors: {
        primary: '#005A9C',
        success: '#28A745',
        error: {
          DEFAULT: '#DC3545',
          dark: '#991B1B',
          light: '#FEE2E2',
        },
        neutral: {
          '900': '#121212',
          '500': '#6B7280',
          '300': '#D1D5DB',
          '50': '#F9FAFB',
        },
        background: '#FFFFFF',
      },
      fontSize: {
        'heading-1': ['24px', { fontWeight: '600' }],
        'body-label': ['14px', { fontWeight: '500' }],
        'body-input': ['16px', { fontWeight: '400' }],
        'caption-error': ['14px', { fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};

export default config;