import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { loadEnvFile } from './load-env.mjs';

loadEnvFile();

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');
const preferredPort = Number(process.env.PORT || 3000);

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

async function handleInstagramFeed(res) {
  try {
    const { default: handler } = await import(
      `file://${join(rootDir, 'api', 'instagram-feed.js').replace(/\\/g, '/')}`
    );

    const mockRes = {
      statusCode: 200,
      headers: {},
      setHeader(key, value) {
        this.headers[key.toLowerCase()] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = JSON.stringify(body);
      },
    };

    await handler({}, mockRes);
    res.writeHead(mockRes.statusCode, mockRes.headers);
    res.end(mockRes.body);
  } catch (error) {
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ username: 'borattisanatorio', posts: [], error: error.message }));
  }
}

function createAppServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

    if (url.pathname === '/api/instagram-feed') {
      await handleInstagramFeed(res);
      return;
    }

    try {
      const relativePath = url.pathname === '/' ? '/index.html' : url.pathname;
      const filePath = join(srcDir, decodeURIComponent(relativePath));
      const file = await readFile(filePath);
      const ext = extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      res.end(file);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
    }
  });
}

function startServer(attemptPort) {
  const server = createAppServer();

  return new Promise((resolve, reject) => {
    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.warn(`Port ${attemptPort} in use, trying ${attemptPort + 1}...`);
        resolve(startServer(attemptPort + 1));
        return;
      }

      reject(error);
    });

    server.listen(attemptPort, () => {
      console.log(`Serving ${srcDir} at http://localhost:${attemptPort}`);
      resolve(attemptPort);
    });
  });
}

startServer(preferredPort).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
