import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './frontend', // Serve files from frontend directory
  publicDir: 'public',
  server: {
    port: 5173, // Default Vite port to avoid conflicts
    open: true, // Automatically open browser
    proxy: {
      // Proxy API requests to the backend server
      '/api': {
        target: 'http://localhost:3001', // Backend will run on port 3001
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          // Ensure Authorization header is preserved during proxy
          proxy.on('proxyReq', (proxyReq, req, res) => {
            if (req.headers.authorization) {
              proxyReq.setHeader('authorization', req.headers.authorization);
            }
          });
        }
      },
    },
  },
  build: {
    outDir: '../dist', // Output directory
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'frontend/index.html'),
        citizen: resolve(__dirname, 'frontend/citizen.html'),
        worker: resolve(__dirname, 'frontend/worker.html'),
        admin: resolve(__dirname, 'frontend/admin.html'),
        login: resolve(__dirname, 'frontend/login.html'),
        register: resolve(__dirname, 'frontend/register.html'),
      },
    },
  },
});