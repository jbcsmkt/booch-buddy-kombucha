import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: { 
    exclude: ['lucide-react'] 
  },
  server: {
    host: true,
    port: 5180,
    hmr: { 
      overlay: false 
    }
  },
  build: {
    outDir: 'dist'
  }
})