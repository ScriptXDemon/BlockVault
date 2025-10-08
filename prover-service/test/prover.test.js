import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { buildApp } from '../src/app.js';

process.env.STUB_PROOFS = '1';

const { app } = buildApp();

test('health endpoint', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('compression proof stub success', async () => {
  const res = await request(app)
    .post('/prove/compression')
    .field('root', '0xabc')
    .field('original_size', '100')
    .field('compressed_size', '80');
  assert.equal(res.status, 200);
  assert.ok(res.body.proof);
});

test('compression proof missing root', async () => {
  const res = await request(app).post('/prove/compression');
  assert.equal(res.status, 400);
});
