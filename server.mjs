import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const distPath = path.join(__dirname, 'dist');

// Healthcheck endpoint for Cloud orchestrators (Kubernetes / Cloud Run / AWS ECS / Load Balancer)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    app: 'AnatoVerse Medika',
    environment: process.env.NODE_ENV || 'production',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve compiled static assets
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
      // Long-term immutable caching for 3D assets, fonts, and images
      if (filePath.match(/\.(glb|gltf|fbx|obj|3ds|woff2?|png|jpg|jpeg|webp|svg)$/i)) {
        res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
      }
    }
  }));

  // SPA fallback for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(503).send(`
      <!DOCTYPE html>
      <html lang="id">
        <head>
          <meta charset="utf-8" />
          <title>AnatoVerse - Build Diperlukan</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #e2e8f0; }
            .card { background: #1e293b; padding: 2.5rem; border-radius: 1rem; max-width: 480px; text-align: center; border: 1px solid #334155; }
            code { background: #0f172a; padding: 0.2rem 0.5rem; border-radius: 0.25rem; color: #38bdf8; font-family: monospace; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Direktori dist/ Belum Ditemukan</h2>
            <p>Aplikasi dalam mode server produksi, silakan bangun aset aplikasi terlebih dahulu dengan perintah:</p>
            <p><code>npm run build</code></p>
            <p style="font-size: 0.85rem; color: #94a3b8; margin-top: 1rem;">Setelah proses build selesai, muat ulang halaman ini.</p>
          </div>
        </body>
      </html>
    `);
  });
}

app.listen(PORT, HOST, () => {
  console.log(`[AnatoVerse Server] Berjalan di http://${HOST}:${PORT}`);
  console.log(`[AnatoVerse Server] Health Check: http://${HOST}:${PORT}/api/health`);
});
