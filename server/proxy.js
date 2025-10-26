#!/usr/bin/env node
import express from 'express';
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.STEAM_API_KEY;
if (!API_KEY) {
  console.error('Error: STEAM_API_KEY not set in environment. Set it in .env or export it.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5179;

// Proxy route: /steam/* -> https://api.steampowered.com/* (appends key)
app.use('/steam/*', async (req, res) => {
  try {
    const path = req.path.replace(/^\/steam/, '');
    const url = new URL(`https://api.steampowered.com${path}`);

    // Copy original query params
    Object.entries(req.query || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));
    // Add key if missing
    if (!url.searchParams.get('key')) url.searchParams.set('key', API_KEY);

  const resp = await fetch(url.toString());
    const body = await resp.arrayBuffer();
    res.status(resp.status);
    // copy headers
    resp.headers.forEach((v, k) => {
      res.setHeader(k, v);
    });
    res.send(Buffer.from(body));
  } catch (err) {
    console.error('Proxy error', err);
    res.status(500).send({ error: 'proxy_error' });
  }
});

app.listen(PORT, () => {
  console.log(`Steam proxy listening at http://localhost:${PORT} — forwarding /steam/* to Steam API (key from env)`);
});
