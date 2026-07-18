import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: process.env.VITE_DEV_HOST || '0.0.0.0',
    port: parseInt(process.env.VITE_DEV_PORT) || 5173,
    strictPort: false,
    proxy: {
      '/api': `http://${process.env.SERVER_HOST || 'localhost'}:${process.env.SERVER_PORT || 12000}`,
      '/socket.io': {
        target: `http://${process.env.SERVER_HOST || 'localhost'}:${process.env.SERVER_PORT || 12000}`,
        ws: true,
      },
    },
  },
  preview: {
    host: process.env.VITE_DEV_HOST || '0.0.0.0',
    port: parseInt(process.env.VITE_PREVIEW_PORT) || 4173,
  },
  resolve: {
    alias: {
      shared: '/home/z/my-project/shared',
    },
  },
})
