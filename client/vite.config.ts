import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  const proxyTarget = process.env.VITE_API_PROXY_TARGET || process.env.VITE_API_URL || '';
  const proxy = proxyTarget
    ? {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      }
    : undefined;

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy,
    },
  };
});
