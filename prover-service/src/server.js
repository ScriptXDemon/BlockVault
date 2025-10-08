import pino from 'pino';
import { buildApp } from './app.js';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const { app } = buildApp();
const port = process.env.PORT || 7000;
app.listen(port, () => log.info({ port }, 'prover service listening'));

