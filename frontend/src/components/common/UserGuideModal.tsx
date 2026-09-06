import React, { useState } from 'react';
import {
  BookOpen,
  X,
  ShieldCheck,
  Scale,
  Camera,
  Sparkles,
  QrCode,
  FileCheck,
  Clock,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Layers,
  Printer,
  FileText,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'quickstart' | 'officer' | 'prosecutor' | 'court' | 'technology'>('quickstart');

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[90vh] text-slate-100 animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-950 border border-blue-800/80 rounded-xl text-blue-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">
                  Officer User Manual & Standard Operating Procedure (SOP)
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-teal-950 text-teal-300 border border-teal-800">
                  MHA • NCRB NATIONAL DIRECTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Standard Operating Procedure for Law Enforcement, Prosecution, and the Judiciary
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/30 px-6 gap-2 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'quickstart', label: '🚀 2-Minute Quickstart' },
            { id: 'officer', label: '👮 Investigating Officer (IO)' },
            { id: 'prosecutor', label: '⚖️ Public Prosecutor' },
            { id: 'court', label: '🏛️ Judicial Magistrate' },
            { id: 'technology', label: '🔒 Tech Explained in Plain English' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-3 border-b-2 whitespace-nowrap transition ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-950/20'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-300 leading-relaxed max-h-[65vh]">
          {/* TAB 1: QUICKSTART */}
          {activeTab === 'quickstart' && (
            <div className="space-y-5">
              <div className="p-4 bg-blue-950/40 border border-blue-800/40 rounded-xl space-y-2">
                <h4 className="font-bold text-blue-200 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  What is this system built for?
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  In India, electronic evidence (CCTV footage, WhatsApp chats, CDRs, digital voice notes) is frequently
                  challenged in Court due to claims of tampering, delay in filing, or broken chain of custody.
                  This software provides an <strong>end-to-end tamper-proof digital vault</strong> built under the newly
                  enacted criminal laws:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 text-[11px] font-mono">
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-700">
                    <span className="text-amber-400 font-bold block">Sec 63 BSA, 2023</span>
                    <span>Electronic Evidence Certificate with embedded QR</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-700">
                    <span className="text-emerald-400 font-bold block">Sec 105 BNSS, 2023</span>
                    <span>Audio-Video Seizure Memo & Panch witness sign</span>
                  </div>
                  <div className="p-2 bg-slate-900/80 rounded border border-slate-700">
                    <span className="text-blue-400 font-bold block">Sec 193 BNSS, 2023</span>
                    <span>60-Day Investigation & Charge Sheet statutory clock</span>
                  </div>
                </div>
              </div>

              {/* 3 Step Demo Walkthrough */}
              <div>
                <h4 className="font-bold text-slate-100 text-sm mb-3">How to evaluate or demonstrate this in 3 clicks:</h4>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      1
                    </span>
                    <div>
                      <strong className="text-slate-100 block text-xs">Verify Public Evidence Portal without login:</strong>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Visit{' '}
                        <Link to="/verify" onClick={onClose} className="text-blue-400 hover:underline font-mono">
                          /verify
                        </Link>{' '}
                        or scan any certificate QR code. Click "CCTV Footage Still (Block #1042)" to see instant mathematical confirmation and Merkle tree inclusion proof. Click "Tampered Digest" to see instant tamper detection.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      2
                    </span>
                    <div>
                      <strong className="text-slate-100 block text-xs">Test Legal AI Co-Pilot on Priority Case:</strong>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Navigate to Case{' '}
                        <Link to="/cases/33333333-cccc-4ccc-8ccc-000000000001" onClick={onClose} className="text-blue-400 hover:underline font-mono">
                          NCRB-WS-2026-0189
                        </Link>{' '}
                        and click the glowing <strong>"Legal AI Co-Pilot"</strong> button to see the 5-point brief, the Contradiction Detector (busting false alibis via CCTV timestamps), and BNS sections.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                      3
                    </span>
                    <div>
                      <strong className="text-slate-100 block text-xs">Simulate Crime Scene Seizure Memo:</strong>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Go to{' '}
                        <Link to="/evidence" onClick={onClose} className="text-blue-400 hover:underline font-mono">
                          Evidence Register
                        </Link>{' '}
                        and click <strong>"Spot Seizure Memo (Sec 105 BNSS)"</strong>. Capture GPS coordinates, enter tamper bag barcodes, and generate an official printable Panchnama.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INVESTIGATING OFFICER */}
          {activeTab === 'officer' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/50 rounded-xl">
                <h4 className="font-bold text-emerald-300 text-sm flex items-center gap-2">
                  <Camera className="w-4 h-4 text-emerald-400" />
                  Standard Operating Procedure for Investigating Officers (IO)
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Follow these steps from the moment a crime is reported to charge sheet submission:
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Step 1: FIR Registration & Case Creation</h5>
                  <p className="text-slate-400">
                    Register the case under appropriate BNS sections. For crimes against women or minors, the portal automatically activates fast-track statutory monitoring under Section 193 BNSS.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Step 2: Crime Spot Digital Device Seizure (Sec 105 BNSS)</h5>
                  <p className="text-slate-400">
                    When seizing mobile phones, laptops, or pen drives at the crime scene, open <strong>Spot Seizure Memo (Sec 105 BNSS)</strong>. Click "Fetch GPS" to lock coordinates, place the device in a Faraday bag, record the tamper-evident bag barcode, and take signatures of two local Panch witnesses.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Step 3: Evidence Ingestion & Cryptographic Hashing</h5>
                  <p className="text-slate-400">
                    Upload digital forensics reports or CCTV recordings. The system computes a mathematical SHA-256 fingerprint in your browser before upload, ensuring zero risk of modification.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Step 4: AI Contradiction Analysis & BNS Section Tagging</h5>
                  <p className="text-slate-400">
                    Click <strong>"Legal AI Co-Pilot"</strong> inside the case. The AI reads all uploaded witness statements and cross-checks them against CCTV timestamps and CDR logs to highlight suspect contradictions and suggest charge sheet penal sections.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROSECUTOR */}
          {activeTab === 'prosecutor' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-950/40 border border-blue-800/50 rounded-xl">
                <h4 className="font-bold text-blue-300 text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-blue-400" />
                  Prosecution Guide & Charge Sheet Preparation
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Tools to ensure water-tight court filings with zero procedural lapses:
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Monitoring the 60-Day Section 193 BNSS Clock</h5>
                  <p className="text-slate-400">
                    Indian law mandates charge sheet filing within 60 days (90 days for heinous crimes). The header statutory clock shows the exact days elapsed and sends proactive alerts when day 45 or 55 is reached.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Generating Section 63 BSA Court Certificates</h5>
                  <p className="text-slate-400">
                    In the Document Viewer, click <strong>"Section 63 BSA Certificate"</strong> to automatically draft a court-admissible certificate. The certificate includes the exact custodian name, device serial number, SHA-256 hash, and a judicial verification QR code.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Auto-Masking Victim Identity (BNS Section 72)</h5>
                  <p className="text-slate-400">
                    When sharing case files with defense counsel or court clerks, click <strong>"Auto-Mask PII (BNS 72)"</strong>. The system automatically redacts victim names, phone numbers, and addresses to comply with statutory privacy rules.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: COURT / MAGISTRATE */}
          {activeTab === 'court' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-950/40 border border-amber-800/50 rounded-xl">
                <h4 className="font-bold text-amber-300 text-sm flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-amber-400" />
                  Judicial Verification & Digital Evidence Admission (Hon'ble Courts)
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  How Judges and Magistrates verify electronic evidence in Court:
                </p>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Instant QR Code Verification without Logins</h5>
                  <p className="text-slate-400">
                    The Court Master or Judge simply scans the QR code on the printed Section 63 BSA certificate or visits <code>http://localhost:3000/verify</code>. No login or password is required.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Decentralized Merkle Tree Inclusion Check</h5>
                  <p className="text-slate-400">
                    The portal queries the consortium blockchain ledger (NCRB, State Police, FSL, Court nodes). If the hash matches, an emerald confirmation appears citing <strong>Section 63(4) BSA, 2023</strong>.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <h5 className="font-semibold text-white mb-1">Defeating Defense Tampering Arguments</h5>
                  <p className="text-slate-400">
                    If defense counsel alleges that a CCTV clip or audio recording was edited after seizure, the Magistrate can compare the file's current SHA-256 hash. Even a 1-byte alteration triggers a red <strong>CRITICAL TAMPER ALERT</strong>, proving indisputable integrity.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TECH EXPLAINED SIMPLY */}
          {activeTab === 'technology' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-950/40 border border-teal-800/50 rounded-xl">
                <h4 className="font-bold text-teal-300 text-sm flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-400" />
                  Complex Technology Explained for Non-Coders
                </h4>
                <p className="text-xs text-slate-300 mt-1">
                  Everything you need to know about the cybersecurity architecture without technical jargon:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-amber-400 block font-semibold">1. What is a SHA-256 Hash?</strong>
                  <p className="text-slate-400 leading-relaxed">
                    Think of it as a <strong>digital DNA or biometric fingerprint</strong> of a file. A 10GB video or a 1-page FIR gets converted into a 64-character code. If anyone changes even a single pixel in the video, the code completely changes, exposing the modification immediately.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-emerald-400 block font-semibold">2. What is the Blockchain Ledger?</strong>
                  <p className="text-slate-400 leading-relaxed">
                    Think of it as a <strong>digital notary book</strong> shared between NCRB, Delhi Police, Central Forensic Lab, and the High Court. Once a hash is stamped into a block, no single person (not even an administrator or hacker) can alter or delete the history.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-blue-400 block font-semibold">3. What is a Merkle Tree?</strong>
                  <p className="text-slate-400 leading-relaxed">
                    It is a mathematical tree structure that bundles hundreds of evidence files into one single summary root. It lets the Court prove that a specific CCTV clip belongs to the block <strong>without exposing the other confidential case files</strong> inside the block.
                  </p>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                  <strong className="text-purple-400 block font-semibold">4. What is Proof-of-Authority (PoA)?</strong>
                  <p className="text-slate-400 leading-relaxed">
                    Unlike cryptocurrency mining that wastes huge electricity, PoA is a fast, permissioned consensus algorithm where only verified government nodes (NCRB, FSL, Judicial Secretariat) can sign and validate evidence blocks in real-time.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono text-[11px]">
            Press <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-[10px]">Ctrl+K</kbd> anywhere for Quick Palette
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg transition shadow-md shadow-blue-900/30"
          >
            Close Guide & Explore Portal
          </button>
        </div>
      </div>
    </div>
  );
};
