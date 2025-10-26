import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(() => {
  const steamProxyTarget = process.env.STEAM_PROXY_TARGET || 'https://api.steampowered.com';
  return {
    plugins: [react()],
    server: {
      // Proxy /steam-api to Steam Web API (or to a local proxy) to avoid CORS in development.
      proxy: {
        '/steam-api': {
          target: steamProxyTarget,
          changeOrigin: true,
          secure: steamProxyTarget.startsWith('https'),
          rewrite: (path) => path.replace(/^\/steam-api/, ''),
        },
        // Proxy /api/proxy to the local node proxy (if you run `npm run start:proxy`)
        '/api/proxy': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
