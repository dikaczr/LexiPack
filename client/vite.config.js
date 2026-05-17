import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/lexipack/',
  optimizeDeps: {
    include: ["pdfjs-dist"],
  },
  build: {
    chunkSizeWarningLimit: 2500,
  },
})
