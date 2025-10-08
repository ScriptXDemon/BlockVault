// snarkjs wrapper for proof generation (browser)
// Assumes snarkjs is loaded via CDN or npm
import * as snarkjs from 'snarkjs';

export async function generateProof(wasmUrl: string, zkeyUrl: string, input: any) {
  // Fetch wasm and zkey
  const [wasmResp, zkeyResp] = await Promise.all([
    fetch(wasmUrl),
    fetch(zkeyUrl)
  ]);
  const wasm = await wasmResp.arrayBuffer();
  const zkey = await zkeyResp.arrayBuffer();
  // Generate witness and proof
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    input,
    new Uint8Array(wasm),
    new Uint8Array(zkey)
  );
  return { proof, publicSignals };
}
