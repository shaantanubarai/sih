/**
 * Merkle Tree and Blockchain Ledger Utilities for Evidentiary Integrity
 * Adheres to National Legal Evidence Integrity Standards (Theme: Blockchain & Cybersecurity)
 */

export interface BlockTx {
  txId: string;
  documentId: string;
  documentTitle: string;
  caseNumber: string;
  sha256Hash: string;
  action: 'EVIDENCE_INTAKE' | 'VERSION_COMMIT' | 'CUSTODY_TRANSFER' | 'BSA_CERTIFICATE_ISSUED';
  timestamp: string;
  performedBy: string;
}

export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface BlockRecord {
  blockNumber: number;
  timestamp: string;
  prevHash: string;
  merkleRoot: string;
  hash: string;
  nonce: number;
  transactions: BlockTx[];
}

export async function sha256Hex(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPair(left: string, right: string): Promise<string> {
  return sha256Hex(left + right);
}

export async function buildMerkleTree(hashes: string[]): Promise<string[][]> {
  if (hashes.length === 0) {
    return [['0'.repeat(64)]];
  }

  let currentLevel = [...hashes];
  const treeLevels: string[][] = [currentLevel];

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
      const parent = await hashPair(left, right);
      nextLevel.push(parent);
    }
    treeLevels.push(nextLevel);
    currentLevel = nextLevel;
  }

  return treeLevels;
}

export function getMerkleProof(treeLevels: string[][], leafIndex: number): MerkleProofStep[] {
  const proof: MerkleProofStep[] = [];
  let index = leafIndex;

  for (let level = 0; level < treeLevels.length - 1; level++) {
    const currentLevel = treeLevels[level];
    const isRightNode = index % 2 === 1;
    const siblingIndex = isRightNode ? index - 1 : index + 1;

    if (siblingIndex < currentLevel.length) {
      proof.push({
        position: isRightNode ? 'left' : 'right',
        hash: currentLevel[siblingIndex],
      });
    } else {
      proof.push({
        position: 'right',
        hash: currentLevel[index],
      });
    }

    index = Math.floor(index / 2);
  }

  return proof;
}

export async function verifyMerkleProof(
  leafHash: string,
  proof: MerkleProofStep[],
  expectedRoot: string
): Promise<boolean> {
  let computedHash = leafHash;

  for (const step of proof) {
    if (step.position === 'left') {
      computedHash = await hashPair(step.hash, computedHash);
    } else {
      computedHash = await hashPair(computedHash, step.hash);
    }
  }

  return computedHash.toLowerCase() === expectedRoot.toLowerCase();
}

export const INITIAL_BLOCKS: BlockRecord[] = [
  {
    blockNumber: 1042,
    timestamp: '2026-09-02T14:30:00.000Z',
    prevHash: '00000000000000000001a4e58b9f7c22d1e43b829fa67c130d2f8e12ab345678',
    merkleRoot: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    hash: '00000000000000000002b8d91c4f6a73e51a2c940eb78d241e3a9f23bc456789',
    nonce: 849102,
    transactions: [
      {
        txId: '0x8f11a4e23c0b11894d7621c',
        documentId: 'DEMO-DOC-001',
        documentTitle: 'CCTV Footage Still - Front Gate Cam 04',
        caseNumber: 'NCRB-WS-2026-0189',
        sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        action: 'EVIDENCE_INTAKE',
        timestamp: '2026-09-02T14:10:00.000Z',
        performedBy: 'IO Inspector Rajesh Sharma (EMP-IO-01)',
      },
      {
        txId: '0x9a32c5f11d9a22781b8543d',
        documentId: 'DEMO-DOC-002',
        documentTitle: 'FIR No. 104/2026 - PS Connaught Place (Zero FIR)',
        caseNumber: 'NCRB-WS-2026-0189',
        sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        action: 'VERSION_COMMIT',
        timestamp: '2026-09-02T14:22:00.000Z',
        performedBy: 'Sub-Inspector Ananya Roy (EMP-IO-02)',
      },
    ],
  },
  {
    blockNumber: 1043,
    timestamp: '2026-09-04T09:15:00.000Z',
    prevHash: '00000000000000000002b8d91c4f6a73e51a2c940eb78d241e3a9f23bc456789',
    merkleRoot: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    hash: '00000000000000000003c9ea2d5e7b84f62b3da51fc89e352f4b0a34cd567890',
    nonce: 1948201,
    transactions: [
      {
        txId: '0x3c71e98bb4d132641a9954a',
        documentId: 'DEMO-DOC-003',
        documentTitle: 'FSL Forensic Disk Extraction Report - Hard Drive Samsung 1TB',
        caseNumber: 'NCRB-WS-2026-0189',
        sha256Hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        action: 'EVIDENCE_INTAKE',
        timestamp: '2026-09-04T08:50:00.000Z',
        performedBy: 'Senior Scientific Officer Dr. Meenakshi Sundaram',
      },
      {
        txId: '0x4d82f09cc5e243752b0065b',
        documentId: 'DEMO-DOC-004',
        documentTitle: 'Witness Statement under Section 161 BNSS - Smt. Priyadarshini (Protected)',
        caseNumber: 'NCRB-WS-2026-0189',
        sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        action: 'VERSION_COMMIT',
        timestamp: '2026-09-04T09:05:00.000Z',
        performedBy: 'IO Inspector Rajesh Sharma (EMP-IO-01)',
      },
    ],
  },
  {
    blockNumber: 1044,
    timestamp: '2026-09-05T16:00:00.000Z',
    prevHash: '00000000000000000003c9ea2d5e7b84f62b3da51fc89e352f4b0a34cd567890',
    merkleRoot: '7d3a241b9e823485c2194f09a18451b63792cbde1456a297e04f039a01625e51',
    hash: '00000000000000000004dafb3e6f8c95a73c4eb62ad90f463a5c1b45de678901',
    nonce: 3204918,
    transactions: [
      {
        txId: '0x5e93a1add6f354863c1176c',
        documentId: 'DEMO-DOC-005',
        documentTitle: 'Section 63 BSA Digital Evidence Admissibility Certificate',
        caseNumber: 'NCRB-WS-2026-0189',
        sha256Hash: '7d3a241b9e823485c2194f09a18451b63792cbde1456a297e04f039a01625e51',
        action: 'BSA_CERTIFICATE_ISSUED',
        timestamp: '2026-09-05T15:45:00.000Z',
        performedBy: 'Public Prosecutor Adv. Vikramaditya Verma',
      },
    ],
  },
];

export interface VerificationResult {
  found: boolean;
  block?: BlockRecord;
  transaction?: BlockTx;
  merkleProof?: MerkleProofStep[];
  proofValid?: boolean;
  computedRoot?: string;
  error?: string;
}

export async function findBlockTransaction(query: string): Promise<VerificationResult> {
  const clean = query.trim().toLowerCase();
  if (!clean) {
    return { found: false, error: 'Please enter a valid SHA-256 digest or transaction identifier.' };
  }

  for (const block of INITIAL_BLOCKS) {
    for (let i = 0; i < block.transactions.length; i++) {
      const tx = block.transactions[i];
      if (
        tx.sha256Hash.toLowerCase() === clean ||
        tx.txId.toLowerCase() === clean ||
        tx.documentId.toLowerCase() === clean ||
        clean.includes(tx.sha256Hash.toLowerCase().slice(0, 16)) ||
        tx.sha256Hash.toLowerCase().includes(clean)
      ) {
        // Build merkle tree for this block to extract proof
        const hashes = block.transactions.map((t) => t.sha256Hash);
        const tree = await buildMerkleTree(hashes);
        const proof = getMerkleProof(tree, i);
        const proofValid = await verifyMerkleProof(tx.sha256Hash, proof, block.merkleRoot);

        return {
          found: true,
          block,
          transaction: tx,
          merkleProof: proof,
          proofValid,
          computedRoot: block.merkleRoot,
        };
      }
    }
  }

  return {
    found: false,
    error: 'No cryptographically notarized block was found matching this digest on the NCRB Ledger.',
  };
}
