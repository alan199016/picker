import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use relative links, because GitHub Pages serves the app from a subfolder.
  base: './',
})
