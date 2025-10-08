// In-memory mock IPFS for local dev
const store: Record<string, Uint8Array> = {};

export function uploadMockIPFS(data: Uint8Array, filename: string): string {
  const cid = 'bafy' + Math.random().toString(16).slice(2);
  store[cid] = data;
  return cid;
}

export function getMockIPFS(cid: string): Uint8Array | undefined {
  return store[cid];
}
