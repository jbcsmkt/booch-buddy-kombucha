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
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunks
          'vendor': ['react', 'react-dom'],
          'ui': ['lucide-react'],
          'utils': ['date-fns']
        }
      }
    },
    // Increase chunk size warning limit since we have a data-heavy app
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: true,
    // Optimize for modern browsers
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console logs for debugging
        drop_debugger: true
      }
    }
  }
})