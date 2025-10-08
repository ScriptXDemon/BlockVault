const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VaultRegistry", () => {
  let registry; let mock; let owner; let other;

  beforeEach(async () => {
    [owner, other] = await ethers.getSigners();
    const Mock = await ethers.getContractFactory("MockVerifier");
    mock = await Mock.deploy();
    await mock.waitForDeployment();
    const Vault = await ethers.getContractFactory("VaultRegistry");
    registry = await Vault.deploy(await mock.getAddress());
    await registry.waitForDeployment();
  });

  function bytes32Of(str) {
    return ethers.keccak256(ethers.toUtf8Bytes(str));
  }

  const dummyProof = { a: [0,0], b: [[0,0],[0,0]], c:[0,0], input: [] };

  it("adds a file", async () => {
    const hash = bytes32Of("file1");
    await expect(registry.addFile(hash, "cid-1"))
      .to.emit(registry, 'FileAdded')
      .withArgs(owner.address, hash, "cid-1");
    const stored = await registry.getFile(owner.address, hash);
    expect(stored).to.equal("cid-1");
  });

  it("reverts on duplicate file", async () => {
    const h = bytes32Of("dup");
    await registry.addFile(h, "cid-x");
    await expect(registry.addFile(h, "cid-x"))
      .to.be.revertedWithCustomError(registry, 'AlreadyRegistered');
  });

  it("reverts on zero hash", async () => {
    await expect(registry.addFile(ethers.ZeroHash, "cid"))
      .to.be.revertedWithCustomError(registry, 'ZeroHash');
  });

  it("registers verifiably compressed file (mock proof)", async () => {
    const root = bytes32Of("rootO");
    await expect(registry.registerVerifiablyCompressedFile(
      root,
      "cid-comp",
      dummyProof.a,
      dummyProof.b,
      dummyProof.c,
      dummyProof.input
    )).to.emit(registry, 'FileAdded').withArgs(owner.address, root, "cid-comp");
  });

  it("registers a transformation", async () => {
    const rootO = bytes32Of("rootO");
    const rootT = bytes32Of("rootT");
    // parent via compressed registration
    await registry.registerVerifiablyCompressedFile(
      rootO,
      "cid-parent",
      dummyProof.a,
      dummyProof.b,
      dummyProof.c,
      dummyProof.input
    );
    await expect(registry.registerTransformation(
      rootO,
      rootT,
      "cid-child",
      dummyProof.a,
      dummyProof.b,
      dummyProof.c,
      dummyProof.input
    )).to.emit(registry, 'TransformationRegistered')
      .withArgs(owner.address, rootO, rootT, "cid-child");
    const parent = await registry.parentOf(rootT);
    expect(parent).to.equal(rootO);
    const children = await registry.childrenOf(rootO);
    expect(children).to.include(rootT);
  });

  it("reverts transformation if parent missing", async () => {
    const rootO = bytes32Of("p-missing");
    const rootT = bytes32Of("t-missing");
    await expect(registry.registerTransformation(
      rootO, rootT, "cid", dummyProof.a, dummyProof.b, dummyProof.c, dummyProof.input
    )).to.be.revertedWith("ParentMissing");
  });
});
