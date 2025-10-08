// (Removed) Legacy compression helper replaced by zstd in zstd.ts. Placeholder kept to avoid import errors.
export async function compressFile(_file: File): Promise<Uint8Array> {
  const buf = await _file.arrayBuffer();
  return new Uint8Array(buf); // no-op
}
