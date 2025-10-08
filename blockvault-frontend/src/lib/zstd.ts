// Zstandard compression using zstd-codec WASM
import { ZstdCodec } from 'zstd-codec';

let zstd: any = null;

export async function compressZstd(file: File): Promise<Uint8Array> {
  if (!zstd) {
    zstd = await new Promise<any>(resolve => {
      ZstdCodec.run((zstd: any) => resolve(zstd));
    });
  }
  const buf = await file.arrayBuffer();
  const simple = new zstd.Simple();
  const compressed = simple.compress(new Uint8Array(buf));
  return compressed;
}
