// Keccak256 hashing for file buffers
import { keccak256 } from 'ethereum-cryptography/keccak';

export async function hashFile(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = keccak256(new Uint8Array(buf));
  return '0x' + Buffer.from(hash).toString('hex');
}
