import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import handler from '../api/availability.js';
import { mockAvailability } from '../lib/mock.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = Number(process.env.PORT || 3000);
const mock = process.env.MOCK === '1';
const types = {
  '.html': 'text/html; charset=utf-8',
  '.csv': 'text/csv; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8'
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (url.pathname === '/api/availability') {
    if (req.method === 'POST') {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 1024 * 1024) {
          res.writeHead(413, { 'content-type': 'application/json' });
          res.end(JSON.stringify({ error: 'bad_request', detail: 'Request body too large' }));
          return;
        }
        chunks.push(chunk);
      }
      try {
        req.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
      } catch {
        req.jsonError = true;
      }
    }
    if (mock) req.getAvailability = mockAvailability;
    return handler(req, res);
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405);
    return res.end();
  }
  let pathname;
  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  if (pathname === '/') pathname = '/index.html';
  const filename = path.resolve(root, `.${pathname}`);
  if (filename !== root && !filename.startsWith(`${root}${path.sep}`)) {
    res.writeHead(403);
    return res.end();
  }
  try {
    const content = await readFile(filename);
    res.writeHead(200, { 'content-type': types[path.extname(filename)] || 'application/octet-stream' });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(port, () => console.log(`Dev server listening on http://localhost:${port}${mock ? ' (mock)' : ''}`));
