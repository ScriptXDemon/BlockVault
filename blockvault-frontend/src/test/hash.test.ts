import { keccak256 } from 'ethereum-cryptography/keccak';

function hashBuffer(buf: Buffer): string {
  const hash = keccak256(new Uint8Array(buf));
  return '0x' + Buffer.from(hash).toString('hex');
}

test('hashBuffer deterministic', () => {
  const buf1 = Buffer.from('hello');
  const buf2 = Buffer.from('hello');
  const h1 = hashBuffer(buf1);
  const h2 = hashBuffer(buf2);
  expect(h1).toBe(h2);
  expect(h1.startsWith('0x')).toBe(true);
});
