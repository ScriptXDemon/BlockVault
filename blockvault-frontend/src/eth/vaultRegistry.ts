// VaultRegistry contract interaction
import { ethers } from 'ethers';
import VaultRegistryAbi from '../abi/VaultRegistry.json';

export function getVaultRegistry(address: string, provider: ethers.Provider | ethers.Signer) {
  return new ethers.Contract(address, VaultRegistryAbi.abi, provider);
}

export async function addFile(
  contract: ethers.Contract,
  fileHash: string,
  cid: string
): Promise<string> {
  const tx = await contract.addFile(fileHash, cid);
  const receipt = await tx.wait();
  return receipt.transactionHash;
}

export async function getFile(
  contract: ethers.Contract,
  user: string,
  fileHash: string
): Promise<string> {
  return contract.getFile(user, fileHash);
}
