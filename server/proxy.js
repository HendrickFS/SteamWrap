import express from 'express';
import dotenv from 'dotenv';
import { createCanvas, loadImage } from 'canvas';

dotenv.config();

const app = express();
app.use(express.json({ limit: '2mb' }));
const PORT = process.env.PORT || process.env.PROXY_PORT || 3001;

// Simple image proxy endpoint to fetch an image and return it with permissive CORS.
// Usage: GET /api/proxy?url=<encoded-url>
app.get('/api/proxy', async (req, res) => {
  const url = req.query.url;
  if (!url || typeof url !== 'string') return res.status(400).send('missing url');

  try {
    if (!/^https?:\/\//i.test(url)) return res.status(400).send('invalid url');
    const resp = await fetch(url);
    if (!resp.ok) return res.status(502).send('upstream failed');

    const contentType = resp.headers.get('content-type') || 'application/octet-stream';
    const buffer = Buffer.from(await resp.arrayBuffer());

    // Allow cross-origin from anywhere so the browser can read pixels from the proxied image
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (err) {
    console.error('proxy error', err);
    res.status(500).send('proxy error');
  }
});

// POST /api/generate-image
// Accepts JSON body: { report: { ... }, options?: { preset?: 'phone'|'social', width?: number, height?: number } }
// Returns image/png
app.post('/api/generate-image', async (req, res) => {
  try {
    const { report, options } = req.body || {};
    if (!report) return res.status(400).send('missing report');

    // Basic sizing
    const preset = options?.preset || 'phone';
    const width = options?.width ?? (preset === 'social' ? 1200 : 1080);
    const height = options?.height ?? (preset === 'social' ? 630 : 1920);

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0f1724';
    ctx.fillRect(0, 0, width, height);

    // Title
    ctx.fillStyle = '#fff';
    ctx.font = '700 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('2 Weeks Steam Wrap', width / 2, 120);

    // Draw avatar if present (fetch via server-side)
    const profileY = 150;
    const avatarSize = Math.floor(width * 0.18);
    const avatarX = Math.floor((width - avatarSize) / 2);
    if (report.steamAvatar) {
      try {
        const resp = await fetch(report.steamAvatar);
        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer());
          const img = await loadImage(buf);
          // circular clip
          ctx.save();
          ctx.beginPath();
          ctx.arc(avatarX + avatarSize / 2, profileY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(img, avatarX, profileY, avatarSize, avatarSize);
          ctx.restore();
        }
      } catch (e) {
        console.warn('avatar fetch failed', e);
      }
    }

    // Name
    ctx.fillStyle = '#fff';
    ctx.font = '700 28px Arial';
    ctx.fillText(report.steamName || report.steamId || 'Steam User', width / 2, profileY + avatarSize + 50);

    // Stats row
    const statsY = profileY + avatarSize + 90;
    const statXStart = 80;
    const statW = Math.floor((width - statXStart * 2) / 3);
    const stats = [
      { label: 'Total Playtime', value: `${report.totalHours ?? 0} hrs` },
      { label: 'Most Played', value: report.mostPlayedGame ?? 'N/A' },
      { label: 'Achievements', value: `${report.totalAchievements ?? 0}` },
    ];
    ctx.font = '600 20px Arial';
    ctx.textAlign = 'left';
    for (let i = 0; i < stats.length; i++) {
      const s = stats[i];
      const x = statXStart + i * statW;
      ctx.fillStyle = '#fff';
      ctx.fillText(s.value, x + 10, statsY);
      ctx.font = '400 12px Arial';
      ctx.fillStyle = '#9ca3af';
      ctx.fillText(s.label, x + 10, statsY + 18);
      ctx.font = '600 20px Arial';
    }

    // Top games list
    const listY = statsY + 60;
    const listPadding = 80;
    const games = report.topGames || [];
    const iconSize = 56;
    for (let i = 0; i < Math.min(6, games.length); i++) {
      const g = games[i];
      const y = listY + i * 90;
      // icon fetch
      if (g.icon) {
        try {
          const resp = await fetch(g.icon);
          if (resp.ok) {
            const buf = Buffer.from(await resp.arrayBuffer());
            const img = await loadImage(buf);
            // draw rounded icon
            ctx.save();
            ctx.beginPath();
            ctx.rect(listPadding, y + 8, iconSize, iconSize);
            ctx.clip();
            ctx.drawImage(img, listPadding, y + 8, iconSize, iconSize);
            ctx.restore();
          }
        } catch (e) {
          // ignore icon errors
        }
      }

      // name and bars
      const nameX = listPadding + iconSize + 12;
      ctx.fillStyle = '#fff';
      ctx.font = '600 16px Arial';
      ctx.fillText(g.name || 'Unknown', nameX, y + 28);

      // playtime/achievement bars
      const barX = nameX;
      const barY = y + 36;
      const barW = width - listPadding - 160 - iconSize;
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(barX, barY, barW, 8);
      ctx.fillStyle = '#3b82f6';
      const fill = Math.max(4, Math.floor(((g.completion ?? 0) / 100) * barW));
      ctx.fillRect(barX, barY, fill, 8);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '400 12px Arial';
      ctx.fillText(`${g.hours ?? 0} hrs`, barX + barW + 8, barY + 7);
      ctx.fillText(`${Math.round(g.completion ?? 0)}%`, barX + barW + 60, barY + 7);
    }

    const out = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(out);
  } catch (err) {
    console.error('generate-image error', err);
    res.status(500).send('generate error');
  }
});

// Optional Steam API proxy that appends the server-side key (if provided in .env as STEAM_API_KEY).
// Usage: GET /steam/<path>?<query>
const STEAM_API_KEY = process.env.VITE_STEAM_API_KEY;
if (STEAM_API_KEY) {
  app.use('/steam/*', async (req, res) => {
    try {
      const path = req.path.replace(/^\/steam/, '');
      const url = new URL(`https://api.steampowered.com${path}`);

      // Copy original query params
      Object.entries(req.query || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
      // Add key if missing
      if (!url.searchParams.get('key')) url.searchParams.set('key', STEAM_API_KEY);

      const resp = await fetch(url.toString());
      const body = await resp.arrayBuffer();
      res.status(resp.status);
      // copy headers
      resp.headers.forEach((v, k) => {
        res.setHeader(k, v);
      });
      res.send(Buffer.from(body));
    } catch (err) {
      console.error('Steam proxy error', err);
      res.status(500).send({ error: 'proxy_error' });
    }
  });
} else {
  console.log('STEAM_API_KEY not set: /steam/* proxy disabled');
}

app.listen(PORT, () => {
  console.log(`Proxy server listening on http://localhost:${PORT}`);
});
