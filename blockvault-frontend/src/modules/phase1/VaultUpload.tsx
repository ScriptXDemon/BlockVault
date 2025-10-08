import React, { useState } from 'react';
import { hashFile } from '../../lib/hash';
import { compressZstd } from '../../lib/zstd';
import { uploadToIPFS } from '../../lib/ipfs';
import { ethers } from 'ethers';
import { getVaultRegistry, addFile } from '../../eth/vaultRegistry';

const VAULT_REGISTRY_ADDRESS = import.meta.env.VITE_VAULT_REGISTRY_ADDRESS;
const IPFS_API_URL = import.meta.env.VITE_IPFS_API_URL;
const IPFS_API_TOKEN = import.meta.env.VITE_IPFS_API_TOKEN;

export default function VaultUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  const [txHash, setTxHash] = useState<string>('');
  const [cid, setCid] = useState<string>('');
  const [fileHash, setFileHash] = useState<string>('');

  async function handleUpload() {
    if (!file) return;
    setStatus('Hashing...');
    const hash = await hashFile(file);
    setFileHash(hash);
  setStatus('Compressing (Zstandard)...');
  const compressed = await compressZstd(file);
  setStatus('Uploading to IPFS...');
  const cidVal = await uploadToIPFS(compressed, file.name + '.zst', IPFS_API_URL, IPFS_API_TOKEN);
    setCid(cidVal);
    setStatus('Waiting for wallet...');
    // Connect wallet
    //@ts-ignore
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const contract = getVaultRegistry(VAULT_REGISTRY_ADDRESS, signer);
    setStatus('Submitting transaction...');
    const tx = await addFile(contract, hash, cidVal);
    setTxHash(tx);
    setStatus('Done!');
  }

  return (
    <div>
      <h2>Vault Upload (Phase 1)</h2>
      <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
      <button disabled={!file} onClick={handleUpload}>Upload</button>
      <div>Status: {status}</div>
      {fileHash && <div>File Hash: {fileHash}</div>}
      {cid && <div>CID: {cid}</div>}
      {txHash && <div>Tx Hash: {txHash}</div>}
    </div>
  );
}
