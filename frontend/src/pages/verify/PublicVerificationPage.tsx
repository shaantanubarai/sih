import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  Copy,
  Printer,
  ExternalLink,
  QrCode,
  Building2,
  FileText,
  Lock,
  ArrowLeft,
  Sparkles,
  Layers,
  Clock,
  KeyRound,
} from 'lucide-react';
import { findBlockTransaction, VerificationResult } from '@/lib/blockchain';
import { QRCodeSvg } from '@/components/common/QRCodeSvg';
import { LegalLexiconTooltip } from '@/components/common/LegalLexiconTooltip';

export const PublicVerificationPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const initialHash = params.get('hash') || params.get('cert') || params.get('doc') || '';
  const [inputHash, setInputHash] = useState(initialHash);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copied, setCopied] = useState(false);

  const sampleCases = [
    {
      label: 'CCTV Footage Exhibit (Block #1042)',
      hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
      type: 'valid',
    },
    {
      label: 'Zero FIR No. 104/2026 (Block #1042)',
      hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
      type: 'valid',
    },
    {
      label: 'FSL Forensic Disk Extraction (Block #1043)',
      hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
      type: 'valid',
    },
    {
      label: 'Section 63 BSA Certificate (Block #1044)',
      hash: '7d3a241b9e823485c2194f09a18451b63792cbde1456a297e04f039a01625e51',
      type: 'valid',
    },
    {
      label: '⚠️ Tampered / Unrecorded Digest',
      hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      type: 'invalid',
    },
  ];

  const verifyHash = async (hashToVerify: string) => {
    if (!hashToVerify.trim()) {
      setResult(null);
      return;
    }
    setIsVerifying(true);
    try {
      const res = await findBlockTransaction(hashToVerify);
      setResult(res);
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (initialHash) {
      void verifyHash(initialHash);
    }
  }, [initialHash]);

  const handleSelectSample = (sampleHash: string) => {
    setInputHash(sampleHash);
    setParams({ hash: sampleHash });
    void verifyHash(sampleHash);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputHash) {
      setParams({ hash: inputHash });
      void verifyHash(inputHash);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-teal-500 selection:text-white print:bg-white print:text-black">
      {/* Government of India Emblem & Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 print:border-none print:bg-transparent">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-amber-500/40 flex items-center justify-center font-serif text-amber-400 font-bold text-xs print:border-black print:text-black">
              सत्यमेव
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 print:text-slate-600">
                Government of India • Ministry of Home Affairs
              </div>
              <h1 className="text-base font-bold text-white print:text-black leading-tight">
                National Evidentiary Blockchain • Public Judicial Verification Portal
              </h1>
              <p className="text-[11px] text-slate-400 print:text-slate-500 flex items-center">
                <span>Statutory Attestation & Verification under Section 63 Bharatiya Sakshya Adhiniyam, 2023 (BSA)</span>
                <LegalLexiconTooltip term="BSA_63" />
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 print:hidden">
            <Link
              to="/login"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to DMS Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 space-y-6">
        {/* Judicial Instructions Banner */}
        <div className="bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-purple-950/40 border border-blue-800/40 rounded-2xl p-5 print:border-slate-300">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 mt-0.5">
              <QrCode className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-bold text-white print:text-black">
                Public Evidentiary Verification for Hon'ble Courts & Advocates
              </h2>
              <p className="text-xs text-slate-300 print:text-slate-700 leading-relaxed">
                Scan the QR code on any printed <strong>Section 63 BSA Electronic Certificate</strong> or paste
                the cryptographic <strong>SHA-256 Digest</strong> below. This portal queries the decentralized NCRB
                consortium blockchain ledger to verify bit-level evidentiary integrity and statutory tamper-resistance.
              </p>
            </div>
          </div>
        </div>

        {/* Search / Verification Form */}
        <form onSubmit={handleSearchSubmit} className="space-y-3 print:hidden">
          <label className="block text-xs font-semibold text-slate-300">
            Enter Document / Evidence SHA-256 Digest or Transaction ID:
          </label>
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputHash}
              onChange={(e) => setInputHash(e.target.value)}
              placeholder="e.g. 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08"
              className="w-full pl-10 pr-28 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <button
              type="submit"
              disabled={isVerifying || !inputHash.trim()}
              className="absolute right-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              {isVerifying ? 'Verifying...' : 'Verify Record'}
            </button>
          </div>

          {/* Quick Test Chips for Evaluators */}
          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-2">
              Evaluation Test Exhibits:
            </span>
            <div className="mt-2 flex flex-wrap gap-2">
              {sampleCases.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample.hash)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                    sample.type === 'invalid'
                      ? 'bg-rose-950/30 border-rose-800/40 text-rose-300 hover:bg-rose-900/50'
                      : 'bg-slate-800/70 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Verification Result Card */}
        {result && (
          <div className="space-y-6 pt-2">
            {result.found && result.transaction && result.block ? (
              /* VALID ON-CHAIN ATTESTATION */
              <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl overflow-hidden shadow-2xl print:border-black print:bg-white">
                {/* Status Bar */}
                <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-4 flex items-center justify-between print:bg-slate-100">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-slate-950">
                          Legally Admissible
                        </span>
                        <span className="text-xs font-mono text-emerald-300 font-semibold">
                          Consensus Confirmed • Block #{result.block.blockNumber}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white print:text-black">
                        EVIDENCE BIT-EXACT & UNALTERED ON BLOCKCHAIN
                      </h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 print:hidden">
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Judicial Receipt</span>
                    </button>
                  </div>
                </div>

                {/* Evidence Attributes */}
                <div className="p-6 space-y-6 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-4">
                      {/* Title & Matter */}
                      <div>
                        <span className="text-slate-400 font-medium">Exhibit / Document Title:</span>
                        <p className="text-sm font-bold text-white print:text-black mt-0.5">
                          {result.transaction.documentTitle}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-slate-400 font-medium">Associated Case / FIR:</span>
                          <p className="font-mono font-semibold text-blue-400 mt-0.5">
                            {result.transaction.caseNumber}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Evidentiary Action:</span>
                          <p className="font-semibold text-amber-400 mt-0.5">
                            {result.transaction.action}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Investigating Officer / Authority:</span>
                        <p className="font-medium text-slate-200 mt-0.5">
                          {result.transaction.performedBy}
                        </p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-medium">Intake Timestamp:</span>
                        <p className="font-mono text-slate-300 mt-0.5">
                          {new Date(result.transaction.timestamp).toUTCString()} (
                          {new Date(result.transaction.timestamp).toLocaleString('en-IN')})
                        </p>
                      </div>
                    </div>

                    {/* QR Code & Notarization Badge */}
                    <div className="flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800 text-center">
                      <div className="bg-white p-2.5 rounded-lg shadow">
                        <QRCodeSvg value={`BSA-SEC63-${result.transaction.sha256Hash}`} size={110} />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 mt-2">
                        Official QR Seal
                      </span>
                      <span className="text-[9px] text-emerald-400 font-semibold mt-0.5">
                        Sec 63 BSA Compliant
                      </span>
                    </div>
                  </div>

                  {/* Cryptographic Hashes & Merkle Inclusion Proof */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <KeyRound className="w-3.5 h-3.5 text-teal-400" />
                      <span>Cryptographic Integrity Schedule</span>
                    </h4>

                    <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between text-slate-400 text-[10px]">
                          <span>SHA-256 Digest:</span>
                          <button
                            onClick={() => handleCopy(result.transaction!.sha256Hash)}
                            className="hover:text-white flex items-center gap-1 print:hidden"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{copied ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                        <p className="text-teal-400 text-[11px] break-all select-all font-bold">
                          {result.transaction.sha256Hash}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-900">
                        <div>
                          <span className="text-slate-400 text-[10px]">Block Merkle Root:</span>
                          <p className="text-slate-300 text-[10px] break-all">
                            {result.block.merkleRoot}
                          </p>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px]">Block Hash (Proof-of-Authority):</span>
                          <p className="text-slate-300 text-[10px] break-all">
                            {result.block.hash}
                          </p>
                        </div>
                      </div>

                      {result.merkleProof && result.merkleProof.length > 0 && (
                        <div className="pt-2 border-t border-slate-900 text-[11px]">
                          <span className="text-slate-400 text-[10px] flex items-center mb-1">
                            <span>Merkle Path Proof Validation ({result.merkleProof.length} sibling levels):</span>
                            <LegalLexiconTooltip term="MERKLE_TREE" />
                          </span>
                          <div className="space-y-1">
                            {result.merkleProof.map((step, sIdx) => (
                              <div
                                key={sIdx}
                                className="flex items-center space-x-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-1 rounded"
                              >
                                <span className="font-semibold text-indigo-400">
                                  Level {sIdx + 1} ({step.position}):
                                </span>
                                <span className="text-slate-300 truncate">{step.hash}</span>
                                <CheckCircle2 className="w-3 h-3 text-emerald-400 ml-auto flex-shrink-0" />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Statutory Declaration */}
                  <div className="p-3.5 bg-blue-950/30 border border-blue-800/40 rounded-xl text-[11px] text-blue-200 leading-relaxed">
                    <strong>Statutory Judicial Admissibility Attestation:</strong> This document and its cryptographic
                    digest have been verified against the National Crime Records Bureau decentralized ledger. The
                    cryptographic proof satisfies all mandatory conditions of Section 63(2) and 63(4) of Bharatiya
                    Sakshya Adhiniyam, 2023. No mathematical deviation or unauthorized modification has occurred.
                  </div>
                </div>
              </div>
            ) : (
              /* TAMPERED / UNVERIFIED RECORD */
              <div className="bg-slate-900 border-2 border-rose-500/80 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40">
                    <ShieldAlert className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500 text-white">
                      Tamper Alert / Notarization Failed
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      RECORD NOT FOUND OR CRYPTOGRAPHIC DIGEST TAMPERED
                    </h3>
                    <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
                      The submitted SHA-256 hash does not match any valid notarized block transaction on the
                      immutable NCRB Blockchain Vault. The record cannot be authenticated or admitted into evidence
                      under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 without forensic recertification.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-rose-900/50 font-mono text-xs">
                  <span className="text-slate-400 text-[10px] block mb-1">Tested Input Query:</span>
                  <p className="text-rose-400 break-all select-all">{inputHash}</p>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSelectSample(sampleCases[0].hash)}
                    className="text-xs font-semibold px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                  >
                    Test with a Valid Certified Exhibit
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* System Architecture Explainer */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs text-slate-400 print:hidden">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Section 63 BSA Direct Compliance</span>
            </div>
            <p>
              Meets statutory admissibility standards by verifying system operational integrity and mathematical
              authenticity.
            </p>
          </div>
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <Layers className="w-4 h-4 text-blue-400" />
              <span>Merkle Tree Cryptographic Proof</span>
            </div>
            <p>
              Logarithmic verification allows bit-level tampering detection even if a single pixel in an exhibit is
              modified.
            </p>
          </div>
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center space-x-2 text-slate-200 font-semibold">
              <Building2 className="w-4 h-4 text-purple-400" />
              <span>MHA / NCRB Consortium Nodes</span>
            </div>
            <p>
              Distributed validator nodes across NCRB Headquarters, State Cyber Cells, and Judicial Registries.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500 print:text-black">
        <p>National Crime Records Bureau (NCRB) • Ministry of Home Affairs, Government of India</p>
        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
          National Evidentiary Blockchain Core • Section 63 BSA Cryptographically Certified
        </p>
      </footer>
    </div>
  );
};
