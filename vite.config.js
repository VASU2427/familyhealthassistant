import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            req.url = '/app.html';
          }
          next();
        });
      },
      closeBundle() {
        const distApp = path.resolve(__dirname, 'dist/app.html');
        const distIndex = path.resolve(__dirname, 'dist/index.html');
        if (fs.existsSync(distApp)) {
          fs.copyFileSync(distApp, distIndex);
          try {
            fs.unlinkSync(distApp);
          } catch (e) {
            console.warn('Could not delete dist/app.html:', e);
          }
        }
      }
    }
  ],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'app.html')
      }
    }
  }
})
