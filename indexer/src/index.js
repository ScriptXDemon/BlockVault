import pino from 'pino';
import { buildApp } from './app.js';
import { ethers } from 'ethers';
import fs from 'fs';

const log = pino({ level: process.env.LOG_LEVEL || 'info' });
const { app, stores } = buildApp();

async function main() {
  const rpc = process.env.RPC_URL;
  const registry = process.env.VAULT_REGISTRY_ADDRESS;
  if (!rpc || !registry) {
    log.warn('Indexer disabled (missing RPC_URL or VAULT_REGISTRY_ADDRESS)');
    return;
  }
  const provider = new ethers.JsonRpcProvider(rpc);
  const abi = JSON.parse(fs.readFileSync(process.env.VAULT_REGISTRY_ABI || 'blockvault-frontend/src/abi/VaultRegistry.json')).abi;
  const contract = new ethers.Contract(registry, abi, provider);
  contract.on('FileAdded', (user, fileHash, cid, event) => {
    if (!stores.filesByUser.has(user.toLowerCase())) stores.filesByUser.set(user.toLowerCase(), []);
    stores.filesByUser.get(user.toLowerCase()).push({ fileHash, cid, tx: event.log.transactionHash });
    log.debug({ user, fileHash, cid }, 'FileAdded indexed');
  });
  contract.on('TransformationRegistered', (user, rootO, rootT, cidT, event) => {
    if (!stores.transformationsByUser.has(user.toLowerCase())) stores.transformationsByUser.set(user.toLowerCase(), []);
    stores.transformationsByUser.get(user.toLowerCase()).push({ rootO, rootT, cidT, tx: event.log.transactionHash });
    log.debug({ user, rootO, rootT }, 'TransformationRegistered indexed');
  });
  log.info('Indexer listening to contract events');
}
main().catch(e => log.error(e));

const port = process.env.PORT || 7100;
app.listen(port, () => log.info({ port }, 'indexer service listening'));

