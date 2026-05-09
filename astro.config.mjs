// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from "@tailwindcss/vite";
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime'],
      esbuildOptions: {
        define: {
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'development'),
        },
      },
    },
  },
  integrations: [react()]
});