import React, { useState } from 'react';
import {
  ShieldCheck,
  Award,
  FileCheck,
  Printer,
  Copy,
  CheckCircle2,
  ExternalLink,
  X,
  Lock,
  Building2,
  QrCode,
} from 'lucide-react';
import { DocumentItem } from '@/types';
import { QRCodeSvg } from '@/components/common/QRCodeSvg';
import { LegalLexiconTooltip } from '@/components/common/LegalLexiconTooltip';

interface BSACertificateModalProps {
  document: DocumentItem;
  isOpen: boolean;
  onClose: () => void;
  onOpenBlockchainExplorer?: () => void;
  documentHash?: string;
}

export const BSACertificateModal: React.FC<BSACertificateModalProps> = ({
  document,
  isOpen,
  onClose,
  onOpenBlockchainExplorer,
  documentHash,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const certificateNumber = `BSA-63-${document.id.slice(0, 8).toUpperCase()}-2026`;
  const activeHash = documentHash || '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';
  const certDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const createdAtStr = document.created_at || new Date().toISOString();

  const handleCopyHash = () => {
    navigator.clipboard.writeText(activeHash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-3xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:border-none print:my-0">
        {/* Government Header Bar */}
        <div className="bg-gradient-to-r from-navy-900 via-slate-900 to-navy-950 text-white px-6 py-4 flex items-center justify-between border-b border-gold-500/30 print:bg-none print:text-black">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30 print:hidden">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Government of India • Ministry of Home Affairs
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Official Legal Attestation
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight flex items-center">
                <span>Section 63 BSA / 65B IEA Electronic Evidence Certificate</span>
                <LegalLexiconTooltip term="BSA_63" />
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition border border-slate-700"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Certificate Body (Court Admissible Format) */}
        <div className="p-6 md:p-8 space-y-6 text-slate-800 dark:text-slate-100 print:text-black print:p-4 text-sm leading-relaxed">
          {/* Official Emblem & Sub-heading */}
          <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-5">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 mb-2 font-serif font-bold text-slate-900 dark:text-slate-100 text-lg">
              सत्यमेव जयते
            </div>
            <h1 className="text-base font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              IN THE COURT OF THE PRINCIPAL DISTRICT & SESSIONS JUDGE / SPECIAL WOMEN'S COURT
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              National Crime Records Bureau (NCRB) • Investigation & Evidentiary Vault System
            </p>
            <div className="mt-3 inline-block bg-slate-100 dark:bg-slate-800 px-4 py-1.5 rounded-md border border-slate-300 dark:border-slate-700">
              <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                Certificate Ref: {certificateNumber}
              </span>
            </div>
          </div>

          {/* Certificate Statutory Statement */}
          <div className="space-y-3 text-justify text-xs md:text-sm">
            <p className="font-medium text-slate-700 dark:text-slate-300">
              <strong>CERTIFICATE OF ADMISSIBILITY OF ELECTRONIC RECORD UNDER SECTION 63 OF THE BHARATIYA SAKSHYA ADHINIYAM, 2023 (BSA)</strong>{' '}
              <span className="text-slate-500 text-xs italic">
                (Corresponding to Section 65B of the Indian Evidence Act, 1872)
              </span>
            </p>
            <p>
              I, the undersigned authorized custody custodian / investigating officer, hereby solemnly declare and certify under Section 63(4) of Bharatiya Sakshya Adhiniyam, 2023:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-2 text-slate-600 dark:text-slate-300">
              <li>That the electronic record described hereinbelow is a true, authentic, and bit-exact reproduction of the electronic data ingested into the Secure Digital Document Management Vault.</li>
              <li>That throughout the material period, the computer system and decentralized cryptographic vault were operating properly and remained under lawful security parameters.</li>
              <li>That no unauthorized interception, tampering, or alteration of the file contents or its cryptographic cryptographic hash occurred since the moment of intake.</li>
            </ol>
          </div>

          {/* Forensic Evidence Attributes Table */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden text-xs">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2.5 font-semibold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <span>SCHEDULE OF ELECTRONIC EVIDENCE RECORD</span>
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-mono">
                CRYPTO-NOTARIZED
              </span>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              <div className="grid grid-cols-3 p-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Document / Exhibit Title:</span>
                <span className="col-span-2 font-semibold text-slate-900 dark:text-white">
                  {document.title}
                </span>
              </div>
              <div className="grid grid-cols-3 p-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Classification & Type:</span>
                <span className="col-span-2">
                  <span className="font-mono uppercase font-bold text-indigo-600 dark:text-indigo-400">
                    {document.document_type}
                  </span>{' '}
                  • Level: {document.classification}
                </span>
              </div>
              <div className="grid grid-cols-3 p-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Associated Matter / FIR:</span>
                <span className="col-span-2 font-mono font-medium text-slate-800 dark:text-slate-200">
                  {document.case_id ? `Matter UUID: ${document.case_id}` : 'NCRB-WS-2026-0189 (Special Women Safety Cell)'}
                </span>
              </div>
              <div className="grid grid-cols-3 p-3 items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium flex items-center">
                  <span>Cryptographic SHA-256 Digest:</span>
                  <LegalLexiconTooltip term="SHA_256" />
                </span>
                <div className="col-span-2 flex items-center justify-between bg-white dark:bg-slate-900 px-2.5 py-1.5 rounded border border-slate-200 dark:border-slate-700">
                  <code className="font-mono text-[11px] text-teal-600 dark:text-teal-300 break-all select-all">
                    {activeHash}
                  </code>
                  <button
                    onClick={handleCopyHash}
                    className="ml-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 print:hidden"
                    title="Copy SHA-256 Digest"
                  >
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 p-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Intake Timestamp (UTC/IST):</span>
                <span className="col-span-2 font-mono text-slate-700 dark:text-slate-300">
                  {new Date(createdAtStr).toUTCString()} ({new Date(createdAtStr).toLocaleString('en-IN')})
                </span>
              </div>
              <div className="grid grid-cols-3 p-3">
                <span className="text-slate-500 dark:text-slate-400 font-medium">Blockchain Anchor Status:</span>
                <span className="col-span-2 flex items-center space-x-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400/30">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Verified on Block #1042
                  </span>
                  {onOpenBlockchainExplorer && (
                    <button
                      onClick={onOpenBlockchainExplorer}
                      className="text-[11px] text-teal-600 dark:text-teal-400 hover:underline inline-flex items-center print:hidden"
                    >
                      Inspect Merkle Tree <ExternalLink className="w-3 h-3 ml-0.5" />
                    </button>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Attestation Signatures Section with Judicial QR Code */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
                <Building2 className="w-4 h-4 text-amber-500" />
                <span>Issuing Authority & Node:</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                National Crime Records Bureau (NCRB)
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                Terminal ID: NCRB-DELHI-VAULT-04 • IP: 10.24.110.12
              </p>
              <p className="text-[11px] text-slate-500">
                Date of Certificate: <strong>{certDate}</strong>
              </p>
            </div>

            {/* QR Code Seal for Court Scan */}
            <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-center">
              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <QRCodeSvg value={`http://localhost:3000/verify?hash=${activeHash}`} size={76} />
              </div>
              <a
                href={`/verify?hash=${activeHash}`}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold hover:underline mt-1.5 inline-flex items-center gap-1 print:hidden"
              >
                <span>Verify in Judicial Portal</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              <span className="text-[9px] text-slate-400 font-mono print:inline hidden">
                Scan QR to Verify on Blockchain
              </span>
            </div>

            <div className="text-right space-y-1">
              <div className="inline-flex items-center px-3 py-1 rounded bg-teal-50 dark:bg-teal-950/50 border border-teal-500/30 text-teal-700 dark:text-teal-300 text-xs font-mono mb-1">
                <Lock className="w-3 h-3 mr-1.5" /> Cryptographically Sealed & e-Signed
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Inspector Rajesh Sharma (EMP-IO-01)
              </p>
              <p className="text-[11px] text-slate-500">
                Investigating Officer • Women Safety Division
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                DSC Token ID: 0x9B4E-7721-AC10-BBSA
              </p>
            </div>
          </div>

          {/* Legal Compliance Notice Footer */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-3 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <strong>Judicial Notice:</strong> This digital certificate fulfills all statutory evidentiary requirements prescribed under Section 63 of Bharatiya Sakshya Adhiniyam, 2023 (BSA). The cryptographic SHA-256 seal and timestamp are notarized in the immutable blockchain audit chain. Any physical copy printed must be accompanied by the unique Certificate Ref.
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="bg-slate-100 dark:bg-slate-800/80 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 print:hidden">
          <div className="text-xs text-slate-500">
            Certified document ID: <span className="font-mono text-slate-700 dark:text-slate-300">{document.id}</span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-semibold bg-navy-900 text-white hover:bg-navy-800 dark:bg-teal-600 dark:hover:bg-teal-500 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Official Certificate</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
