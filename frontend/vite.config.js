import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendTarget = env.VITE_API_URL?.replace(/\/+$/, '') || 'http://localhost:5003';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      open: true,
      allowedHosts: ['codenexus.geetauniversity.edu.in', 'localhost', '127.0.0.1'],
      proxy: {
        '/api': {
          target: backendTarget,
          changeOrigin: true,
          secure: false,
        },
        '/socket.io': {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
        },
        '/practice': {
          target: backendTarget,
          ws: true,
          changeOrigin: true,
        },
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 5173,
      allowedHosts: ['codenexus.geetauniversity.edu.in', 'localhost', '127.0.0.1'],
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@monaco-editor') || id.includes('monaco-editor')) {
                return 'vendor-monaco';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-recharts';
              }
              if (id.includes('jspdf') || id.includes('xlsx') || id.includes('jszip') || id.includes('file-saver')) {
                return 'vendor-export-tools';
              }
              if (id.includes('lucide-react') || id.includes('@fortawesome')) {
                return 'vendor-icons';
              }
              if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('react/') || id.includes('react-markdown')) {
                return 'vendor-react-core';
              }
            }
          },
        },
      },
    },
  };
});
