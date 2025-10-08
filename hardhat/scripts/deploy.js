const hre = require("hardhat");

async function main() {
  const MockVerifier = await hre.ethers.getContractFactory("MockVerifier");
  const mockVerifier = await MockVerifier.deploy();
    await mockVerifier.waitForDeployment();
    const mockVerifierAddress = await mockVerifier.getAddress();
    console.log("MockVerifier deployed to:", mockVerifierAddress);

  const VaultRegistry = await hre.ethers.getContractFactory("VaultRegistry");
    const registry = await VaultRegistry.deploy(mockVerifierAddress);
  await registry.waitForDeployment();
    const registryAddress = await registry.getAddress();
    console.log("VaultRegistry deployed to:", registryAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
