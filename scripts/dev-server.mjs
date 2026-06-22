import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const useDist = process.argv.includes('--dist');
const baseDir = path.join(root, useDist ? 'dist' : 'src');
const port = Number(process.env.WASL_WEB_PORT || 4173);

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon'
};

function sanitize(urlPath) {
  const cleaned = (urlPath || '/').split('?')[0];
  const normalized = path.normalize(cleaned).replace(/^\.\.(\/|\\|$)/, '');
  return normalized === '/' ? '/index.html' : normalized;
}

const server = http.createServer(async (req, res) => {
  const rel = sanitize(req.url);
  const filePath = path.join(baseDir, rel);

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      const index = path.join(filePath, 'index.html');
      const content = await fs.readFile(index);
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(content);
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'content-type': types[ext] || 'application/octet-stream' });
    res.end(content);
  } catch {
    try {
      const fallback = await fs.readFile(path.join(baseDir, 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      res.end(fallback);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  }
});

server.listen(port, () => {
  console.log(`[wasl-web] Serving ${useDist ? 'dist' : 'src'} at http://localhost:${port}`);
});
