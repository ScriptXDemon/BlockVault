// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract MockVerifier {
    function verifyProof(
        uint[2] calldata /*a*/,
        uint[2][2] calldata /*b*/,
        uint[2] calldata /*c*/,
        uint[] calldata /*input*/
    ) external pure returns (bool) {
        return true; // Always accepts
    }
}
