import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'


// https://vite.dev/config/
export default defineConfig({
  optimizeDeps: {
    exclude: ['swiper'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (error, request, response) => {
            console.error(
              'API proxy error: backend is not reachable at http://127.0.0.1:5000'
            )

            if (!response.headersSent) {
              response.writeHead(503, { 'Content-Type': 'application/json' })
            }

            response.end(
              JSON.stringify({
                success: false,
                message: 'Backend server is not running on port 5000',
              })
            )
          })
        },
      },
    },
  },
  plugins: [react(),
  tailwindcss()],
})
