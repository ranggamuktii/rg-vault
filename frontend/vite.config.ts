import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 3000,
    host: true,
  },
  define: {
    global: 'globalThis',
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // Lembut & modern (layered)
        soft: '0 1px 2px rgba(0,0,0,.04), 0 8px 24px rgba(0,0,0,.06)',
        softLg: '0 2px 8px rgba(0,0,0,.06), 0 20px 40px rgba(0,0,0,.08)',
        elevated: '0 8px 24px rgba(18,18,23,.10), 0 2px 6px rgba(18,18,23,.06)',
        focus: '0 0 0 6px rgba(59,130,246,.14)', // buat focus ring halus
      },
      transitionTimingFunction: {
        gentle: 'cubic-bezier(.2,.8,.2,1)', // standard UI
        snappy: 'cubic-bezier(.16,1,.3,1)', // expo-ish
      },
      transitionProperty: {
        shadow: 'box-shadow',
      },
      borderColor: {
        subtle: 'rgba(0,0,0,0.06)',
      },
    },
  },
});
