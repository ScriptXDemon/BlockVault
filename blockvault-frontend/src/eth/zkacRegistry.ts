// ZKAC registration contract interaction
import { ethers } from 'ethers';
import VaultRegistryAbi from '../abi/VaultRegistry.json';

export function getVaultRegistry(address: string, provider: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(address, VaultRegistryAbi.abi, provider);
}

export async function registerVerifiablyCompressedFile(
  contract: ethers.Contract,
  rootO: string,
  cidC: string,
  proof: any,
  publicSignals: any
): Promise<string> {
  // proof: { a, b, c }, publicSignals: [rootO, ...]
  const tx = await contract.registerVerifiablyCompressedFile(
    rootO,
    cidC,
    proof.a,
    proof.b,
    proof.c,
    publicSignals
  );
  const receipt = await tx.wait();
  return receipt.transactionHash;
}
