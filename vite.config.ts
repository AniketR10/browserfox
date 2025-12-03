import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/service-worker.ts')
      },
      output: {
        entryFileNames: (chuckInfo) => {
          if(chuckInfo.name === 'background'){
            return 'service-worker.js';
          }
          return 'assets/[name]-[hash].js';
        }
      }
    }
  }
})
