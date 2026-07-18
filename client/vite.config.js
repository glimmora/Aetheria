import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Load .env from project root (not client/ subdir)
  const env = loadEnv(mode, '../', '')

  const serverHost = env.SERVER_HOST || 'localhost'
  const serverPort = env.SERVER_PORT || env.PORT || '12000'
  const devHost = env.VITE_DEV_HOST || '0.0.0.0'
  const devPort = parseInt(env.VITE_DEV_PORT) || 5173

  return {
    plugins: [react()],
    // Tell Vite to load .env from project root
    envDir: '../',
    server: {
      host: devHost,
      port: devPort,
      strictPort: false,
      proxy: {
        '/api': `http://${serverHost}:${serverPort}`,
        '/health': `http://${serverHost}:${serverPort}`,
        '/socket.io': {
          target: `http://${serverHost}:${serverPort}`,
          ws: true,
        },
      },
    },
    preview: {
      host: devHost,
      port: parseInt(env.VITE_PREVIEW_PORT) || 4173,
    },
    resolve: {
      alias: {
        shared: '/home/z/my-project/shared',
      },
    },
  }
})
