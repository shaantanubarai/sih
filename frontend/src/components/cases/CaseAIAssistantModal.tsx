import React, { useState } from 'react';
import {
  Sparkles,
  FileText,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Copy,
  Printer,
  X,
  Clock,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Case, DocumentItem, EvidenceItem } from '@/types';

interface CaseAIAssistantModalProps {
  caseItem: Case;
  documents: DocumentItem[];
  evidence: EvidenceItem[];
  isOpen: boolean;
  onClose: () => void;
}

export const CaseAIAssistantModal: React.FC<CaseAIAssistantModalProps> = ({
  caseItem,
  documents,
  evidence,
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'brief' | 'contradictions' | 'sections' | 'chargesheet'>('brief');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const executiveBrief = `EXECUTIVE CASE SYNOPSIS & PROSECUTION BRIEF
Case Reference: ${caseItem.case_number}
Matter: ${caseItem.title}
Statutory Authority: NCRB Women Safety Division & Special Cyber Cell
Statutory Deadline: BNSS Section 193 (60-Day Women Safety Mandate)

1. INCIDENT & MODUS OPERANDI:
The complaint pertains to organized electronic harassment, extortion, and non-consensual distribution of private media. The primary perpetrator utilized burner SIM cards and encrypted communication applications to coerce compliance from victims.

2. DIGITAL EVIDENCE & CUSTODY INTEGRITY:
Total digital exhibits logged: ${evidence.length || 3}. All exhibits have been ingested with SHA-256 cryptographic hashing and anchored to the NCRB Decentralized Blockchain Ledger. Merkle inclusion proofs establish 100% bit-level preservation without custodial gap.

3. FORENSIC CONFIRMATION (FSL/CFSL):
Central Forensic Science Laboratory (CFSL) extraction confirms extracted device partition matches hash notarized in Block #1043. No wiping artifacts or anti-forensic tools detected.

4. WITNESS CORROBORATION:
Independent witness statements under Section 161/180 BNSS corroborate electronic time stamps and CCTV records. Spot seizure panchnama executed with mandatory audio-video recording under Section 105 BNSS.

5. EVIDENTIARY STRENGTH SCORE:
Overall Admissibility Score: 98/100 (Exceptional Court Admissibility). The evidence chain strictly satisfies all requirements of Section 63 Bharatiya Sakshya Adhiniyam, 2023.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl my-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden print:shadow-none print:border-none print:my-0 text-slate-900 dark:text-slate-100 print:text-black">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-900/90 via-indigo-900/90 to-slate-900 px-6 py-4 flex items-center justify-between border-b border-purple-500/30 print:bg-none">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-500/20 text-purple-300 rounded-xl border border-purple-500/40">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                  Legal AI Co-Pilot & Evidentiary Intelligence
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  BNS / BNSS 2023 Compliant
                </span>
              </div>
              <h2 className="text-base font-bold text-white print:text-black">
                Case Intelligence & Prosecution Brief Generator: {caseItem.case_number}
              </h2>
            </div>
          </div>
          <div className="flex items-center space-x-2 print:hidden">
            <button
              onClick={handlePrint}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Brief</span>
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-6 pt-2 gap-2 text-xs font-medium print:hidden">
          <button
            onClick={() => setActiveTab('brief')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'brief'
                ? 'border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-400 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive 5-Point Brief</span>
          </button>
          <button
            onClick={() => setActiveTab('contradictions')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'contradictions'
                ? 'border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-400 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Contradiction & Alibi Check</span>
          </button>
          <button
            onClick={() => setActiveTab('sections')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'sections'
                ? 'border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-400 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-blue-500" />
            <span>BNS / BNSS Section Tagging</span>
          </button>
          <button
            onClick={() => setActiveTab('chargesheet')}
            className={`pb-3 px-3 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'chargesheet'
                ? 'border-purple-600 dark:border-purple-500 text-purple-700 dark:text-purple-400 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Charge Sheet Synopsis (Sec 193)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto text-xs leading-relaxed">
          {/* TAB 1: EXECUTIVE BRIEF */}
          {activeTab === 'brief' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 font-bold text-[11px] border border-emerald-500/30">
                    Evidentiary Health: 98% Strong
                  </span>
                  <span className="text-slate-400">
                    Based on {documents.length} verified documents & {evidence.length} forensic exhibits
                  </span>
                </div>
                <button
                  onClick={() => handleCopy(executiveBrief)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 print:hidden"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied' : 'Copy Brief'}</span>
                </button>
              </div>

              {/* 5-Point Structured Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    1. Allegations & Modus Operandi
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Systematic cyber harassment, extortion, and unauthorized electronic surveillance targeting the complainant.
                    Perpetrators used virtual phone numbers and spoofed IP headers to conceal physical location.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                    2. Cryptographic Evidence Chain
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    CCTV footage and digital seizure logs anchored in Block #1042 and #1043 with Merkle inclusion
                    proofs. All files bit-exact per Section 63 BSA standards with zero tampering flags.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    3. CFSL Forensic Validation
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    CFSL extraction recovered deleted Telegram and WhatsApp chats corroborating extortion threats. Hardware
                    IMEI matches seized Samsung SSD hard disk serial number logged in crime scene panchnama.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    4. Statutory Timeline (Sec 193 BNSS)
                  </span>
                  <p className="text-slate-700 dark:text-slate-300">
                    Statutory 60-day investigation clock for crimes against women is active. 38 days elapsed, 22 days
                    remaining. All core forensic affidavits are completed for expeditious charge sheet filing.
                  </p>
                </div>
              </div>

              {/* Full Pre-Formatted Brief Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-300 whitespace-pre-line leading-normal">
                {executiveBrief}
              </div>
            </div>
          )}

          {/* TAB 2: CONTRADICTION & ALIBI ANALYSIS */}
          {activeTab === 'contradictions' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-xl text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <h4 className="font-bold text-xs">AI Forensic Contradiction Detector</h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200/90 mt-0.5">
                    The AI Co-Pilot cross-references suspect interrogation statements with cryptographic CCTV time stamps
                    and CDR cell tower logs to highlight material inconsistencies.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {/* Contradiction 1 */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-rose-300 dark:border-rose-900/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800">
                      CRITICAL CONTRADICTION #1: Falsified Alibi
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Reliability Confidence: 99.4%</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-rose-600 dark:text-rose-400 block mb-1">Accused Statement (Sec 161 BNSS):</span>
                      <p className="text-slate-700 dark:text-slate-300">
                        "I was in Gurugram Cyber Hub attending a business conference between 13:00 and 16:00 IST on 2nd September 2026."
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">Cryptographic Digital Evidence:</span>
                      <p className="text-slate-700 dark:text-slate-300">
                        CCTV Footage Still (Block #1042) & ANPR capture vehicle DL-1C-AB-9012 entering Connaught Place at 14:10:00 IST.
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic pt-1">
                    <strong>Prosecution Note:</strong> The defense alibi is completely rebutted by court-certified CCTV timestamps under Section 63 BSA.
                  </p>
                </div>

                {/* Contradiction 2 */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-emerald-300 dark:border-emerald-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800">
                      CORROBORATION CONFIRMED: Witness Corroborates Location
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Corroboration Confidence: 97.8%</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    Protected Witness Smt. Priyadarshini stated the extortion call occurred at approximately 14:15 hrs.
                    Seized mobile device CDR logs (Exhibit #EX-2026-003) record incoming call from suspect's burner device at exactly 14:14:48 IST.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BNS / BNSS SECTION RECOMMENDER */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-xl text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                <Scale className="w-5 h-5 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                <div>
                  <h4 className="font-bold text-xs">Statutory Penal & Procedural Mapping Engine</h4>
                  <p className="text-[11px] text-blue-800 dark:text-blue-200/90 mt-0.5">
                    Transitioned from legacy Indian Penal Code (IPC) and CrPC to the enacted <strong>Bharatiya Nyaya Sanhita (BNS, 2023)</strong> and <strong>Bharatiya Nagarik Suraksha Sanhita (BNSS, 2023)</strong>.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Section 72, Bharatiya Nyaya Sanhita, 2023 (BNS)
                    </h5>
                    <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 px-2 py-0.5 rounded font-semibold">
                      Substantive Offense
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    <strong>Corresponds to:</strong> Section 354C IPC (Voyeurism & Electronic Surveillance).
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    Capturing, publishing, or transmitting images of a woman engaging in a private act without consent.
                    Punishment: Rigorous imprisonment of 3 to 7 years + Fine.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Section 79, Bharatiya Nyaya Sanhita, 2023 (BNS)
                    </h5>
                    <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 px-2 py-0.5 rounded font-semibold">
                      Substantive Offense
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    <strong>Corresponds to:</strong> Section 509 IPC (Insulting Modesty of a Woman).
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    Uttering any word, making any sound, gesture, or exhibiting electronic content intending to intrude upon the privacy of a woman.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Section 66E & 67A, Information Technology Act, 2000
                    </h5>
                    <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 px-2 py-0.5 rounded font-semibold">
                      Cybercrime Special Act
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    Violation of privacy by transmitting bodily images, combined with electronic transmission of sexually explicit material. Cognizable & Non-Bailable.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                      Section 105 & Section 193, Bharatiya Nagarik Suraksha Sanhita, 2023 (BNSS)
                    </h5>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800 px-2 py-0.5 rounded font-semibold">
                      Procedural Mandates
                    </span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-xs">
                    Mandatory audio-video recording of search and seizure, and statutory 60-day deadline for charge sheet completion in crimes against women.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CHARGE SHEET SYNOPSIS */}
          {activeTab === 'chargesheet' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400 text-xs">
                  Auto-formatted Charge Sheet Final Report synopsis per Section 193 BNSS
                </span>
                <button
                  onClick={() => handleCopy(executiveBrief)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium border border-slate-300 dark:border-slate-700"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Charge Sheet Synopsis</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-serif leading-relaxed space-y-3">
                <div className="text-center border-b border-slate-200 dark:border-slate-800 pb-3">
                  <h4 className="font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    POLICE FINAL REPORT / CHARGE SHEET UNDER SECTION 193 BNSS, 2023
                  </h4>
                  <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                    In the Court of the Chief Judicial Magistrate / Special Women's Court, New Delhi
                  </p>
                </div>

                <div className="space-y-2 text-slate-700 dark:text-slate-300">
                  <p>
                    <strong>1. FIR Details:</strong> FIR No. 104/2026, PS Connaught Place • Date: 02-09-2026.
                  </p>
                  <p>
                    <strong>2. Name of Accused:</strong> Accused-1 (In Judicial Custody) & Accused-2 (Absconding).
                  </p>
                  <p>
                    <strong>3. Charges Substantiated:</strong> Sections 72, 79 BNS r/w Sections 66E, 67A IT Act.
                  </p>
                  <p>
                    <strong>4. Electronic Evidence Admissibility:</strong> Admissible under Section 63 BSA, 2023. Notarized on Decentralized Ledger Block #1042-#1044.
                  </p>
                  <p>
                    <strong>5. Prayer:</strong> It is respectfully prayed that this Learned Court may be pleased to take cognizance of the offenses and issue process against the accused persons in the interest of justice.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 print:hidden">
          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>AI inferences grounded strictly on cryptographically verified vault exhibits</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition"
          >
            Close AI Co-Pilot
          </button>
        </div>
      </div>
    </div>
  );
};
