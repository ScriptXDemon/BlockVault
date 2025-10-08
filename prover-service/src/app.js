import express from 'express';
import cors from 'cors';
import pino from 'pino';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as snarkjs from 'snarkjs';

const upload = multer({ storage: multer.memoryStorage() });
const log = pino({ level: process.env.LOG_LEVEL || 'info' });

export function buildApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '25mb' }));

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  let queue = Promise.resolve();

  async function generateProof(wasmPath, zkeyPath, input) {
    if (process.env.STUB_PROOFS) {
      return { proof: { a: [0,0], b: [[0,0],[0,0]], c: [0,0] }, publicSignals: Object.values(input) };
    }
    await fs.readFile(wasmPath); // existence check
    await fs.readFile(zkeyPath);
    return snarkjs.groth16.fullProve(input, wasmPath, zkeyPath);
  }

  app.post('/prove/compression', upload.none(), async (req, res) => {
    const { root, original_size, compressed_size } = req.body;
    if (!root) return res.status(400).json({ error: 'missing root' });
    const job = async () => {
      try {
        const input = { root, original_size: Number(original_size)||0, compressed_size: Number(compressed_size)||0 };
        const { proof, publicSignals } = await generateProof(
          process.env.COMPRESSION_WASM || 'build/compression_js/compression.wasm',
          process.env.COMPRESSION_ZKEY || 'build/compression_final.zkey',
          input
        );
        return { proof, publicSignals };
      } catch (e) { log.error(e, 'compression proof failed'); throw e; }
    };
    queue = queue.then(job);
    try { const result = await queue; res.json(result); }
    catch (err) { res.status(500).json({ error: err.message || String(err) }); }
  });

  app.post('/prove/redaction', upload.none(), async (req, res) => {
    const { rootO, rootT } = req.body;
    if (!rootO || !rootT) return res.status(400).json({ error: 'missing roots' });
    const job = async () => {
      try {
        const input = { rootO, rootT };
        const { proof, publicSignals } = await generateProof(
          process.env.REDACTION_WASM || 'build/redaction_js/redaction.wasm',
          process.env.REDACTION_ZKEY || 'build/redaction_final.zkey',
          input
        );
        return { proof, publicSignals };
      } catch (e) { log.error(e, 'redaction proof failed'); throw e; }
    };
    queue = queue.then(job);
    try { const result = await queue; res.json(result); }
    catch (err) { res.status(500).json({ error: err.message || String(err) }); }
  });

  app.get('/health', (_req, res) => res.json({ status: 'ok' }));

  return { app };
}
