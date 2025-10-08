import express from 'express';
import cors from 'cors';
import pino from 'pino';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });

export function buildApp() {
  const app = express();
  app.use(cors());

  const filesByUser = new Map();
  const transformationsByUser = new Map();

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/user/:address/files', (req, res) => {
    res.json(filesByUser.get(req.params.address.toLowerCase()) || []);
  });
  app.get('/user/:address/transformations', (req, res) => {
    res.json(transformationsByUser.get(req.params.address.toLowerCase()) || []);
  });

  return { app, stores: { filesByUser, transformationsByUser } };
}
