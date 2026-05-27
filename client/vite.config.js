import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
  plugins: [react()],
  base: '/lexipack/',
  optimizeDeps: {
    include: ["pdfjs-dist"],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react":   ["react", "react-dom"],
          "vendor-aggrid":  ["ag-grid-community", "ag-grid-react"],
          "vendor-pdfjs":   ["pdfjs-dist"],
          "vendor-tesseract": ["tesseract.js"],
          "vendor-jspdf":   ["jspdf"],
          "vendor-xlsx":    ["xlsx"],
        },
      },
    },
  },
})
