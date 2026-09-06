import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '@/context/AuthContext';
import {
  Search,
  Briefcase,
  FileText,
  Package,
  Blocks,
  ShieldCheck,
  Sparkles,
  Camera,
  QrCode,
  BookOpen,
  ArrowRight,
  UserCheck,
  History,
  X,
  Keyboard,
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'Actions' | 'Cases' | 'Exhibits' | 'Navigation' | 'Roles';
  icon: React.ElementType;
  badge?: string;
  onSelect: () => void;
}

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUserGuide?: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onOpenUserGuide,
}) => {
  const navigate = useNavigate();
  const { switchDemoRole } = useAuth();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const allCommands: CommandItem[] = useMemo(
    () => [
      // Quick Actions
      {
        id: 'action-verify',
        title: 'Public Judicial QR Verification Portal',
        subtitle: 'Validate evidence hashes on blockchain without logging in (Sec 63 BSA)',
        category: 'Actions',
        icon: QrCode,
        badge: 'PUBLIC',
        onSelect: () => navigate('/verify'),
      },
      {
        id: 'action-seizure',
        title: 'Spot Seizure Memo (Section 105 BNSS)',
        subtitle: 'Prepare tamper-sealed crime scene memo with GPS geotagging & Panch witnesses',
        category: 'Actions',
        icon: Camera,
        badge: 'BNSS 105',
        onSelect: () => navigate('/evidence'),
      },
      {
        id: 'action-ai',
        title: 'Legal AI Co-Pilot & Prosecution Brief',
        subtitle: '5-point executive brief, contradiction detector & BNS section tagging',
        category: 'Actions',
        icon: Sparkles,
        badge: 'AI ASSIST',
        onSelect: () => navigate('/cases/33333333-cccc-4ccc-8ccc-000000000001'),
      },
      {
        id: 'action-guide',
        title: 'Open User Guide & Officer Standard Operating Procedure',
        subtitle: 'Interactive plain-English manual for police, lawyers, and judges',
        category: 'Actions',
        icon: BookOpen,
        badge: 'MANUAL',
        onSelect: () => {
          if (onOpenUserGuide) onOpenUserGuide();
        },
      },
      {
        id: 'action-blockchain',
        title: 'Blockchain Consortium Ledger & Tamper Defense',
        subtitle: 'Inspect immutable blocks #1042-#1044, Merkle proofs, and simulate tamper attacks',
        category: 'Actions',
        icon: Blocks,
        badge: 'POA CONSENSUS',
        onSelect: () => navigate('/blockchain'),
      },

      // Cases
      {
        id: 'case-priority',
        title: 'Case NCRB-WS-2026-0189',
        subtitle: 'Cyber Harassment & Extortion Syndicate (Priority Fast-Track)',
        category: 'Cases',
        icon: Briefcase,
        badge: 'CRITICAL',
        onSelect: () => navigate('/cases/33333333-cccc-4ccc-8ccc-000000000001'),
      },
      {
        id: 'case-pocso',
        title: 'Case NCRB-WS-2026-0190',
        subtitle: 'Digital Impersonation & Online Defamation Ring',
        category: 'Cases',
        icon: Briefcase,
        badge: 'OPEN',
        onSelect: () => navigate('/cases'),
      },

      // Exhibits & Documents
      {
        id: 'exhibit-cctv',
        title: 'Exhibit CCTV Footage Still (Cam 04)',
        subtitle: 'Sealed on Block #1042 • SHA-256: 9f86d081884c... (Connaught Place)',
        category: 'Exhibits',
        icon: FileText,
        badge: 'SEC 63 BSA',
        onSelect: () => navigate('/verify?hash=9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08'),
      },
      {
        id: 'exhibit-fir',
        title: 'FIR No. 104/2026 - PS Connaught Place',
        subtitle: 'Zero FIR registered under Section 173 BNSS with PII auto-masking',
        category: 'Exhibits',
        icon: ShieldCheck,
        badge: 'CONFIDENTIAL',
        onSelect: () => navigate('/documents'),
      },

      // Navigation
      {
        id: 'nav-dashboard',
        title: 'Operations Dashboard',
        subtitle: 'Real-time case stats, statutory BNSS clocks, and tamper health',
        category: 'Navigation',
        icon: Briefcase,
        onSelect: () => navigate('/dashboard'),
      },
      {
        id: 'nav-evidence',
        title: 'Evidence Register & Chain of Custody',
        subtitle: 'Track physical lockers, digital hashes, and custodian transfers',
        category: 'Navigation',
        icon: Package,
        onSelect: () => navigate('/evidence'),
      },
      {
        id: 'nav-audit',
        title: 'Immutable Audit Trail & Ledger Logs',
        subtitle: 'Full forensic logs of every access, view, and verification event',
        category: 'Navigation',
        icon: History,
        onSelect: () => navigate('/audit-logs'),
      },

      // Stakeholder Personas
      {
        id: 'role-officer',
        title: 'Switch Persona: Investigating Officer (IO)',
        subtitle: 'Inspector Rajesh Sharma (NCRB Women Safety Division)',
        category: 'Roles',
        icon: UserCheck,
        badge: 'CID / IO',
        onSelect: () => {
          const acc = DEMO_ACCOUNTS.find((a) => a.role === 'INVESTIGATING_OFFICER');
          if (acc) switchDemoRole(acc);
        },
      },
      {
        id: 'role-prosecutor',
        title: 'Switch Persona: Public Prosecutor',
        subtitle: 'Adv. Vikramaditya Verma (Prosecution & Court Filing Wing)',
        category: 'Roles',
        icon: UserCheck,
        badge: 'LAW / COURT',
        onSelect: () => {
          const acc = DEMO_ACCOUNTS.find((a) => a.role === 'PROSECUTOR');
          if (acc) switchDemoRole(acc);
        },
      },
      {
        id: 'role-magistrate',
        title: 'Switch Persona: Judicial Magistrate / Court',
        subtitle: 'Hon’ble District Court (BSA Digital Evidence Admission)',
        category: 'Roles',
        icon: UserCheck,
        badge: 'JUDICIARY',
        onSelect: () => {
          const acc = DEMO_ACCOUNTS.find((a) => a.role === 'COURT_USER');
          if (acc) switchDemoRole(acc);
        },
      },
    ],
    [navigate, switchDemoRole, onOpenUserGuide]
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return allCommands;
    const q = query.toLowerCase();
    return allCommands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q) ||
        (c.badge && c.badge.toLowerCase().includes(q))
    );
  }, [allCommands, query]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < filtered.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : filtered.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].onSelect();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 bg-slate-950/40">
          <Search className="w-5 h-5 text-blue-400 flex-shrink-0 mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command, case, evidence exhibit, or role..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-white rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="ml-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-800/40">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <Search className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-50" />
              <p>No matching commands, exhibits, or cases found for "{query}".</p>
              <p className="mt-1 text-slate-600">Try searching "CCTV", "AI", "Seizure", "Verify", or "Magistrate".</p>
            </div>
          ) : (
            filtered.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    item.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40'
                      : 'hover:bg-slate-800/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold truncate">{item.title}</span>
                        {item.badge && (
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                              isSelected
                                ? 'bg-white/25 text-white'
                                : 'bg-slate-800 text-teal-400 border border-teal-800/50'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p
                          className={`text-[11px] truncate ${
                            isSelected ? 'text-blue-100' : 'text-slate-400'
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0 text-[10px] opacity-70">
                    <span className="hidden sm:inline font-mono">{item.category}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px]">↑</kbd>
              <kbd className="px-1 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px]">↓</kbd>
              Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-[9px]">↵</kbd>
              Select
            </span>
          </div>
          <div className="flex items-center gap-1 text-teal-400">
            <Keyboard className="w-3.5 h-3.5" />
            <span>National System Command Palette</span>
          </div>
        </div>
      </div>
    </div>
  );
};
