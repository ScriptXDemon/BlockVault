# BlockVault Prover Service

Prototype offloaded proof generation microservice (Phase 4 performance work).

## Endpoints

POST /prove/compression
Body (application/x-www-form-urlencoded or JSON):
- root: hex commitment
- original_size: number
- compressed_size: number

POST /prove/redaction
- rootO: original root
- rootT: transformed root

GET /health

## Environment Variables

| Variable | Default | Purpose |
| -------- | ------- | ------- |
| PORT | 7000 | Listen port |
| COMPRESSION_WASM | build/compression_js/compression.wasm | Path to compression circuit wasm |
| COMPRESSION_ZKEY | build/compression_final.zkey | Path to compression zkey |
| REDACTION_WASM | build/redaction_js/redaction.wasm | Path to redaction circuit wasm |
| REDACTION_ZKEY | build/redaction_final.zkey | Path to redaction zkey |
| LOG_LEVEL | info | pino log level |

## Run

```bash
npm install
npm run dev
```

## Notes
- Serial queue prevents CPU contention; replace with a job queue + worker pool (GPU) for real scale.
- Add authentication / rate limiting before exposing publicly.
- Consider using WebSockets or job IDs for polling longer jobs.
