// ZKAC registration UI for verifiably compressed file
import React, { useState, ChangeEvent } from 'react';
import { merkleRoot, chunkFile } from '../../lib/merkle';
import { generateProof } from '../../lib/snarkjs';
import { registerVerifiablyCompressedFile, getVaultRegistry } from '../../eth/zkacRegistry';

export default function ZKACRegister() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState('');

  async function handleRegister() {
    if (!file) return;
    setStatus('Processing...');
    const data = new Uint8Array(await file.arrayBuffer());
    const chunks = chunkFile(data, 65536); // 64KB chunks
    const root = merkleRoot(chunks);
    // Prepare input for circuit
    const input = {
      root: '0x' + Array.from(root).map(b => b.toString(16).padStart(2, '0')).join(''),
      original_size: data.length,
      compressed_size: data.length // TODO: use actual compressed size
    };
    // Generate proof
    try {
      const { proof, publicSignals } = await generateProof(
        '/zkac/compression.wasm',
        '/zkac/compression.zkey',
        input
      );
      // Get contract instance (replace with actual address/provider)
      const contract = getVaultRegistry(
        process.env.NEXT_PUBLIC_VAULT_REGISTRY_ADDRESS || '',
        window.ethereum
      );
      // Submit to contract
      await registerVerifiablyCompressedFile(
        contract,
        publicSignals[0], // rootO
        'ipfsCid', // TODO: get actual CID
        proof,
        publicSignals
      );
      setStatus('Registered!');
    } catch (e) {
      setStatus('Error: ' + (e instanceof Error ? e.message : String(e)));
    }
  }

  return (
    <div>
      <h2>ZK Attested Compression Registration</h2>
      <input type="file" onChange={(e: ChangeEvent<HTMLInputElement>) => setFile(e.target.files?.[0] || null)} />
      <button onClick={handleRegister} disabled={!file}>Register</button>
      <div>{status}</div>
    </div>
  );
}
