// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./Verifier.sol"; // Compression verifier
// A second verifier contract address will be provided for transformations (redaction etc.)

interface IVerifier {
    function verifyProof(
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[] calldata input
    ) external view returns (bool);
}

contract VaultRegistry {
    // user => fileHash => cid
    mapping(address => mapping(bytes32 => string)) private _fileRegistry;
    event FileAdded(address indexed user, bytes32 indexed fileHash, string cid);
    Verifier public verifier; // compression / base
    IVerifier public transformVerifier; // transformations (may be same initially)

    // parentRoot => list of child roots (simple append-only adjacency)
    mapping(bytes32 => bytes32[]) private _children;
    // child => parent (single lineage)
    mapping(bytes32 => bytes32) private _parent;
    event TransformationRegistered(address indexed user, bytes32 indexed rootO, bytes32 indexed rootT, string cidT);

    error EmptyCID();
    error AlreadyRegistered();
    error ZeroHash();

    constructor(address verifierAddress) {
        verifier = Verifier(verifierAddress);
        transformVerifier = IVerifier(verifierAddress); // default until set
    }

    function setTransformVerifier(address v) external {
        // NOTE: In production restrict (e.g. Ownable). For now open for iteration.
        transformVerifier = IVerifier(v);
    }

    function addFile(bytes32 fileHash, string calldata cid) external {
        if (fileHash == bytes32(0)) revert ZeroHash();
        if (bytes(cid).length == 0) revert EmptyCID();
        if (bytes(_fileRegistry[msg.sender][fileHash]).length != 0) revert AlreadyRegistered();
        _fileRegistry[msg.sender][fileHash] = cid;
        emit FileAdded(msg.sender, fileHash, cid);
    }

    function getFile(address user, bytes32 fileHash) external view returns (string memory) {
        return _fileRegistry[user][fileHash];
    }

    function registerVerifiablyCompressedFile(
        bytes32 rootO,
        string calldata cidC,
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) external {
        require(verifier.verifyProof(a, b, c, input), "Invalid ZK proof");
        require(bytes(cidC).length != 0, "Empty CID");
        require(bytes(_fileRegistry[msg.sender][rootO]).length == 0, "AlreadyRegistered");
        _fileRegistry[msg.sender][rootO] = cidC;
        emit FileAdded(msg.sender, rootO, cidC);
    }

    // Register a derived (transformed) file with ZK proof linking original rootO to new rootT
    function registerTransformation(
        bytes32 rootO,
        bytes32 rootT,
        string calldata cidT,
        uint[2] calldata a,
        uint[2][2] calldata b,
        uint[2] calldata c,
        uint[] calldata input
    ) external {
        require(bytes(_fileRegistry[msg.sender][rootO]).length != 0, "ParentMissing");
        require(bytes(_fileRegistry[msg.sender][rootT]).length == 0, "AlreadyRegistered");
        require(bytes(cidT).length != 0, "Empty CID");
        require(transformVerifier.verifyProof(a, b, c, input), "InvalidTransformProof");
        _fileRegistry[msg.sender][rootT] = cidT;
        _parent[rootT] = rootO;
        _children[rootO].push(rootT);
        emit TransformationRegistered(msg.sender, rootO, rootT, cidT);
    }

    function parentOf(bytes32 child) external view returns (bytes32) {
        return _parent[child];
    }

    function childrenOf(bytes32 parent) external view returns (bytes32[] memory) {
        return _children[parent];
    }
}
