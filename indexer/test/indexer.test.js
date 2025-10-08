import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const { app } = buildApp();

test('health ok', async () => {
  const res = await request(app).get('/health');
  assert.equal(res.status, 200);
  assert.equal(res.body.status, 'ok');
});

test('empty user queries', async () => {
  const addr = '0xabc';
  const files = await request(app).get(`/user/${addr}/files`);
  assert.equal(files.status, 200);
  assert.deepEqual(files.body, []);
  const transforms = await request(app).get(`/user/${addr}/transformations`);
  assert.equal(transforms.status, 200);
  assert.deepEqual(transforms.body, []);
});
