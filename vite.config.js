import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Use empty base for HashRouter compatibility
  base: '',
  server: {
    // This configures the dev server to handle history API fallbacks for SPA routing
    historyApiFallback: true,
  },
})
