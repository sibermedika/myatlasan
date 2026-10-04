import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      dedupe: ['react', 'react-dom', 'three'],
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Prebundle the lazy 3D viewer with the same React runtime as the editor.
    // Discovering loaders after the page mounts can replace optimized chunks mid-session.
    optimizeDeps: {
      force: true,
      entries: ['index.html', 'src/components/ThreeDCanvas.tsx'],
      include: [
        'react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime',
        'lucide-react', 'fflate', 'three',
        'three/examples/jsm/controls/OrbitControls.js',
        ...['GLTF', 'DRACO', 'FBX', 'OBJ', 'MTL', 'STL', 'TDS'].map(name => `three/examples/jsm/loaders/${name}Loader.js`),
      ],
    },
    server: {
      proxy: { '/api': { target: 'http://127.0.0.1:3031', changeOrigin: false } },
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: {
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || '0.0.0.0',
      allowedHosts: true as const,
    },
  };
});
