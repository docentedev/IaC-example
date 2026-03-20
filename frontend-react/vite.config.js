import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuracion de Vite para el frontend React.
// En desarrollo local, el proxy redirige /api y /health al API Gateway
// (o directamente a los microservicios). En produccion, Traefik
// resuelve esas rutas a nivel de Ingress.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
