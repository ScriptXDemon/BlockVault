// SPDX-License-Identifier: MIT
// This file will be overwritten by snarkjs export solidityverifier
// after running zkac_setup.sh
pragma solidity ^0.8.20;

contract Verifier {
    // snarkjs will generate the actual verifier code here
    function verifyProof(
        uint[2] memory a,
        uint[2][2] memory b,
        uint[2] memory c,
        uint[] memory input
    ) public view returns (bool r) {
        // Implementation will be generated
        return false;
    }
}
