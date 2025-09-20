import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Remove the base path to ensure routing works correctly in all environments
  base: '/',
  server: {
    // This configures the dev server to handle history API fallbacks for SPA routing
    historyApiFallback: true,
  },
})
