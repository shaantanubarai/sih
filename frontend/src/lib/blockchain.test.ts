import { describe, it, expect } from 'vitest';
import {
  buildMerkleTree,
  getMerkleProof,
  verifyMerkleProof,
  INITIAL_BLOCKS,
  sha256Hex,
} from './blockchain';

describe('Blockchain & Merkle Tree Evidentiary Verification', () => {
  it('computes consistent SHA-256 digests', async () => {
    const hash = await sha256Hex('test-evidence');
    expect(hash).toHaveLength(64);
    expect(typeof hash).toBe('string');
  });

  it('builds a valid Merkle tree and generates mathematical inclusion proofs', async () => {
    const sampleHashes = [
      '1111111111111111111111111111111111111111111111111111111111111111',
      '2222222222222222222222222222222222222222222222222222222222222222',
      '3333333333333333333333333333333333333333333333333333333333333333',
    ];

    const tree = await buildMerkleTree(sampleHashes);
    expect(tree.length).toBeGreaterThan(1);
    const root = tree[tree.length - 1][0];
    expect(root).toHaveLength(64);

    // Verify inclusion proof for leaf 0
    const proof0 = getMerkleProof(tree, 0);
    const isValid0 = await verifyMerkleProof(sampleHashes[0], proof0, root);
    expect(isValid0).toBe(true);

    // Verify inclusion proof for leaf 1
    const proof1 = getMerkleProof(tree, 1);
    const isValid1 = await verifyMerkleProof(sampleHashes[1], proof1, root);
    expect(isValid1).toBe(true);
  });

  it('fails verification when an evidence hash is tampered with', async () => {
    const sampleHashes = [
      'aaaa000000000000000000000000000000000000000000000000000000000001',
      'bbbb000000000000000000000000000000000000000000000000000000000002',
    ];

    const tree = await buildMerkleTree(sampleHashes);
    const root = tree[tree.length - 1][0];
    const proof = getMerkleProof(tree, 0);

    // Tampered modified hash
    const tamperedHash = 'ffff000000000000000000000000000000000000000000000000000000000000';
    const isTamperValid = await verifyMerkleProof(tamperedHash, proof, root);
    expect(isTamperValid).toBe(false);
  });

  it('verifies initial notarized blocks have valid structures', () => {
    expect(INITIAL_BLOCKS.length).toBeGreaterThanOrEqual(3);
    for (const block of INITIAL_BLOCKS) {
      expect(block.blockNumber).toBeGreaterThan(1000);
      expect(block.merkleRoot).toHaveLength(64);
      expect(block.transactions.length).toBeGreaterThan(0);
      for (const tx of block.transactions) {
        expect(tx.sha256Hash).toHaveLength(64);
        expect(tx.performedBy).toBeDefined();
      }
    }
  });
});
