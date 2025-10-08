// Merkle root calculation for file chunks (SHA256)
import { sha256 } from 'ethereum-cryptography/sha256';

export function chunkFile(data: Uint8Array, chunkSize: number): Uint8Array[] {
  const chunks = [];
  for (let i = 0; i < data.length; i += chunkSize) {
    chunks.push(data.slice(i, i + chunkSize));
  }
  return chunks;
}

export function merkleRoot(chunks: Uint8Array[]): Uint8Array {
  let level = chunks.map(chunk => sha256(chunk));
  while (level.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < level.length; i += 2) {
      if (i + 1 < level.length) {
        next.push(sha256(Buffer.concat([level[i], level[i + 1]])));
      } else {
        next.push(level[i]);
      }
    }
    level = next;
  }
  return level[0];
}
