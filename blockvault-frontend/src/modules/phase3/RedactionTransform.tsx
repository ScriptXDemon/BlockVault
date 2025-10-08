import React, { useState } from 'react';
import { merkleRoot, chunkFile } from '../../lib/merkle';
import { generateProof } from '../../lib/snarkjs';
import { getVaultRegistry } from '../../eth/zkacRegistry';
import VaultRegistryAbi from '../../abi/VaultRegistry.json';
import { uploadMockIPFS } from '../../lib/mockIpfs';
import { ethers } from 'ethers';

// Simple text redaction demo (client-side) producing new rootT by removing selected ranges
export default function RedactionTransform() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [redactedText, setRedactedText] = useState('');
  const [intervals, setIntervals] = useState<Array<[number, number]>>([]);
  const [status, setStatus] = useState('');

  function computeIntervals(original: string, redacted: string): Array<[number, number]> {
    // Naive diff: assumes redacted only removes substrings.
    // Real implementation: robust diff algorithm, maps to byte offsets.
    const intervals: Array<[number, number]> = [];
    let i = 0, j = 0;
    while (i < original.length && j < redacted.length) {
      if (original[i] === redacted[j]) { i++; j++; continue; }
      // start of removal
      const start = i;
      while (i < original.length && (j >= redacted.length || original[i] !== redacted[j])) i++;
      intervals.push([start, i]);
    }
    if (i < original.length) intervals.push([i, original.length]);
    return intervals;
  }

  async function handleRedact() {
    if (!originalFile) return;
    setStatus('Reading original...');
    const originalStr = await originalFile.text();
    setStatus('Computing removal intervals...');
    const ivals = computeIntervals(originalStr, redactedText);
    setIntervals(ivals);

    // Build transformed bytes
    setStatus('Building transformed file...');
    let transformed = '';
    let cursor = 0;
    for (const [s, e] of ivals) {
      transformed += originalStr.slice(cursor, s);
      cursor = e;
    }
    transformed += originalStr.slice(cursor);

    const encOriginal = new TextEncoder().encode(originalStr);
    const encTransformed = new TextEncoder().encode(transformed);

    setStatus('Merkle roots...');
    const rootO = merkleRoot(chunkFile(encOriginal, 65536));
    const rootT = merkleRoot(chunkFile(encTransformed, 65536));

    // Placeholder proof (circuit currently stubbed to equality) — will use redaction circuit eventually
    const input = {
      rootO: '0x' + Array.from(rootO).map(b => b.toString(16).padStart(2,'0')).join(''),
      rootT: '0x' + Array.from(rootT).map(b => b.toString(16).padStart(2,'0')).join('')
    };

    try {
      setStatus('Generating proof...');
      const { proof, publicSignals } = await generateProof('/zkac/redaction.wasm', '/zkac/redaction.zkey', input);

      setStatus('Uploading transformed (mock IPFS)...');
      const cidT = uploadMockIPFS(encTransformed, 'redacted.txt');

      setStatus('Submitting transaction...');
      //@ts-ignore
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(
        import.meta.env.VITE_VAULT_REGISTRY_ADDRESS,
        VaultRegistryAbi.abi,
        signer
      );
      // Actual call (stub proof):
      // await contract.registerTransformation(rootO, rootT, cidT, proof.a, proof.b, proof.c, publicSignals);
      console.log('Would submit registerTransformation with', { rootO: input.rootO, rootT: input.rootT, cidT, proof, publicSignals });
      setStatus('Done (simulated).');
    } catch (err) {
      setStatus('Error: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <div>
      <h2>Redaction Transformation (Phase 3 Prototype)</h2>
      <textarea placeholder="Original file preview (auto from upload)" readOnly value={''} />
      <textarea placeholder="Paste redacted version here" value={redactedText} onChange={e => setRedactedText(e.target.value)} />
      <input type="file" accept="text/plain" onChange={e => setOriginalFile(e.target.files?.[0] || null)} />
      <button disabled={!originalFile || !redactedText} onClick={handleRedact}>Generate Proof & Register</button>
      <div>Status: {status}</div>
      {intervals.length > 0 && <div>Intervals: {intervals.map(i=>`[${i[0]},${i[1]}]`).join(', ')}</div>}
    </div>
  );
}
