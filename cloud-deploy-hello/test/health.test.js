const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

function makeApp() {
  const app = express();

  app.get('/', (req, res) => {
    res.status(200).type('text/plain; charset=utf-8').send('Hello World');
  });

  app.get('/health', (req, res) => {
    res.status(200).type('text/plain; charset=utf-8').send('status ok');
  });

  return app;
}

function listen(app) {
  return new Promise((resolve) => {
    const server = http.createServer(app).listen(0, '127.0.0.1', () => resolve(server));
  });
}

function get(server, path) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port, path, method: 'GET' }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.end();
  });
}

test('GET / returns 200 Hello World', async () => {
  const app = makeApp();
  const server = await listen(app);
  try {
    const r = await get(server, '/');
    assert.equal(r.status, 200);
    assert.equal(r.body, 'Hello World');
  } finally {
    server.close();
  }
});

test('GET /health returns 200 status ok', async () => {
  const app = makeApp();
  const server = await listen(app);
  try {
    const r = await get(server, '/health');
    assert.equal(r.status, 200);
    assert.equal(r.body, 'status ok');
  } finally {
    server.close();
  }
});