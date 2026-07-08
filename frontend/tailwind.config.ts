import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1220',
          800: '#141d2e',
          700: '#1d2839',
          600: '#2a3650',
        },
        jade: {
          50: '#eafaf2',
          100: '#c9f2dd',
          200: '#94e6bd',
          300: '#5bd49a',
          400: '#2fbd7c',
          500: '#12a368',
          600: '#0a8354',
          700: '#0a6745',
          800: '#0b5139',
          900: '#0a4330',
        },
        sand: {
          50: '#fbfaf6',
          100: '#f4f1e9',
          200: '#e9e3d4',
        },
        amber: {
          accent: '#e6a23c',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'Georgia', 'serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(11,18,32,0.04), 0 8px 24px -12px rgba(11,18,32,0.12)',
        lift: '0 12px 40px -16px rgba(11,18,32,0.28)',
      },
      borderRadius: {
        xl: '0.9rem',
        '2xl': '1.25rem',
      },
    },
  },
  plugins: [],
};

export default config;
