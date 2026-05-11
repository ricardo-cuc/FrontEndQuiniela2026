import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  server: {
    host: true,
    port: 4173
  },
  plugins: [react(), tailwindcss(), cloudflare()]
})