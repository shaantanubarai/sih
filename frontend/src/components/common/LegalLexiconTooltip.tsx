import React, { useState } from 'react';
import { HelpCircle, X, Scale, ExternalLink, ShieldCheck } from 'lucide-react';

export type LegalTerm =
  | 'BSA_63'
  | 'BNSS_105'
  | 'BNSS_193'
  | 'BNS_72'
  | 'SHA_256'
  | 'MERKLE_TREE'
  | 'CHAIN_OF_CUSTODY';

interface TermData {
  title: string;
  badge: string;
  statute: string;
  explanation: string;
  significance: string;
}

const TERMS: Record<LegalTerm, TermData> = {
  BSA_63: {
    title: 'Admissibility of Electronic Records',
    badge: 'Statutory Mandate',
    statute: 'Section 63, Bharatiya Sakshya Adhiniyam, 2023 (formerly Sec 65B IEA)',
    explanation:
      'Any electronic record, digital printout, or computer output can only be admitted as evidence in Indian courts if accompanied by an official certificate confirming lawful custody, system integrity, and hash verification.',
    significance: 'Prevents forged digital documents from being submitted into judicial proceedings.',
  },
  BNSS_105: {
    title: 'Audio-Video Recording of Search & Seizure',
    badge: 'Mandatory Compliance',
    statute: 'Section 105, Bharatiya Nagarik Suraksha Sanhita, 2023',
    explanation:
      'Requires Investigating Officers to record digital crime scene searches and seizures via audio-video electronic means and execute a spot seizure memo attested by at least two independent local Panch witnesses.',
    significance: 'Eliminates allegations of evidence planting or unauthorized device tampering.',
  },
  BNSS_193: {
    title: 'Statutory 60/90 Day Charge Sheet Clock',
    badge: 'Investigation Deadline',
    statute: 'Section 193, Bharatiya Nagarik Suraksha Sanhita, 2023',
    explanation:
      'Mandates completion of police investigation within 60 days (for offenses punishable up to 10 years) or 90 days (heinous crimes / life imprisonment). Failure allows the accused statutory default bail.',
    significance: 'Keeps police investigations disciplined, fast-tracked, and accountable.',
  },
  BNS_72: {
    title: 'Auto-Masking PII of Victims of Sexual Crimes',
    badge: 'Privacy Protection',
    statute: 'Section 72, Bharatiya Nyaya Sanhita, 2023',
    explanation:
      'Strictly prohibits publishing or disclosing the name or identity of any victim of sexual offenses. Our DMS auto-masks names, addresses, and contact numbers in shared documents.',
    significance: 'Safeguards the dignity and constitutional right to privacy of women and minors.',
  },
  SHA_256: {
    title: 'Cryptographic SHA-256 Digest',
    badge: 'Mathematical Fingerprint',
    statute: 'ISO/IEC 10118-3 & IT Act 2000',
    explanation:
      'A 256-bit unique cryptographic hash calculated from the binary bits of a file. If even a single comma or pixel is modified, the hash changes completely (avalanche effect).',
    significance: 'Proves to the Court that the digital evidence is 100% bit-exact and unaltered.',
  },
  MERKLE_TREE: {
    title: 'Merkle Tree Inclusion Proof',
    badge: 'Consensus Proof',
    statute: 'Cryptographic Tree Protocol',
    explanation:
      'A hierarchical tree of cryptographic hashes where leaf nodes are evidence transactions and the root is anchored to the block header. Allows instant proof of record inclusion without revealing other private case files.',
    significance: 'Provides lightweight mathematical proof of record existence on the immutable ledger.',
  },
  CHAIN_OF_CUSTODY: {
    title: 'Chain of Custody (Sec 105 & Sec 63)',
    badge: 'Custodial Integrity',
    statute: 'Statutory Custody Tracking',
    explanation:
      'Chronological immutable log showing who collected the evidence, who received it, reasons for transfer, physical locker location, and digital signatures at each stage.',
    significance: 'Guarantees the item presented in Court is the exact item seized at the crime spot.',
  },
};

interface LegalLexiconTooltipProps {
  term: LegalTerm;
  children?: React.ReactNode;
}

export const LegalLexiconTooltip: React.FC<LegalLexiconTooltipProps> = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data = TERMS[term];

  if (!data) return <>{children}</>;

  return (
    <span className="relative inline-flex items-center align-middle">
      {children}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        title={`What is ${data.statute}? Click for plain English explanation`}
        className="ml-1 inline-flex items-center text-slate-400 hover:text-amber-400 focus:outline-none transition p-0.5"
        aria-label={`Explain ${data.title}`}
      >
        <HelpCircle className="w-3.5 h-3.5" />
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
        >
          <div
            className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 text-left text-slate-100 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-950/80 border border-amber-800/60 rounded-xl text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                    {data.badge}
                  </span>
                  <h4 className="text-sm font-bold text-slate-100">{data.title}</h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Statute citation */}
            <div className="text-[11px] font-mono text-teal-300 bg-teal-950/50 p-2 rounded-lg border border-teal-900/60 mb-3">
              ⚖️ {data.statute}
            </div>

            {/* Explanation */}
            <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
              <div>
                <strong className="text-slate-100 block mb-1">What this means in plain words:</strong>
                <p>{data.explanation}</p>
              </div>

              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-400">
                <strong className="text-emerald-400 block mb-0.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Why this matters in Court:
                </strong>
                <p>{data.significance}</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-md"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </span>
  );
};
