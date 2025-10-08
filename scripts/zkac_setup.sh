#!/bin/bash
# ZKAC trusted setup and compilation script
set -e
CIRCUIT=circuits/compression.circom
BUILD=circuits/build
mkdir -p $BUILD

# Compile circuit
circom $CIRCUIT --r1cs --wasm --sym -o $BUILD

# Powers of Tau (universal setup)
if [ ! -f $BUILD/pot12_final.ptau ]; then
  snarkjs powersoftau new bn128 12 $BUILD/pot12_0000.ptau -v
  snarkjs powersoftau contribute $BUILD/pot12_0000.ptau $BUILD/pot12_0001.ptau --name="First contribution" -v
  snarkjs powersoftau prepare phase2 $BUILD/pot12_0001.ptau $BUILD/pot12_final.ptau -v
fi

# Generate zkey
snarkjs groth16 setup $BUILD/compression.r1cs $BUILD/pot12_final.ptau $BUILD/compression_0000.zkey
snarkjs zkey contribute $BUILD/compression_0000.zkey $BUILD/compression_final.zkey --name="1st Contributor" -v
snarkjs zkey export verificationkey $BUILD/compression_final.zkey $BUILD/verification_key.json

# Export Solidity verifier
snarkjs zkey export solidityverifier $BUILD/compression_final.zkey $BUILD/Verifier.sol

echo "ZKAC setup complete. Verifier.sol and keys are in $BUILD."
