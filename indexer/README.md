# BlockVault Indexer

Lightweight event indexer providing fast REST endpoints for user file & transformation listings.

## Endpoints
GET /health
GET /user/:address/files
GET /user/:address/transformations

## Env Vars
| Name | Purpose |
| ---- | ------- |
| RPC_URL | JSON-RPC endpoint for chain |
| VAULT_REGISTRY_ADDRESS | Deployed registry contract |
| VAULT_REGISTRY_ABI | Path to ABI JSON (optional) |
| LOG_LEVEL | pino log level |
| PORT | Listen port (default 7100) |

## Run
```bash
npm install
npm run dev
```

## Notes
- In-memory only (stateless). Use a persistent DB (Postgres) for production plus backfill on startup.
- For production: add pagination, cursors, and chain reorg handling (compare block numbers, confirm after N blocks).
- Could be replaced by The Graph subgraph later; keep shape stable.
