import React, { useState } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  ShieldCheck,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  KeyRound,
  AlertCircle,
  QrCode,
  Search,
  BookOpen,
  Sun,
  Moon,
  Sliders,
  Command,
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface TopbarProps {
  onMenuToggle: () => void;
  onOpenCommandPalette?: () => void;
  onOpenUserGuide?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onMenuToggle,
  onOpenCommandPalette,
  onOpenUserGuide,
}) => {
  const { user, logout, switchDemoRole } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex flex-col bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-sm dark:shadow-none">
      {/* Classification & Disclaimer Banner - Permanent Deep Tactical Bar */}
      <div className="bg-[#080d14] px-4 py-1 flex items-center justify-between text-[11px] font-mono tracking-wider border-b border-slate-800 text-slate-300">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-amber-400 font-bold uppercase">MHA • NCRB Women Safety Division</span>
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden md:inline text-teal-300 font-medium">National Digital Forensics Grid</span>
          <span className="hidden lg:inline text-slate-600">|</span>
          <span className="hidden lg:inline text-slate-400">BSA 2023 Statutory Standards</span>
        </div>
        <div className="flex items-center space-x-2 text-right">
          <Link
            to="/verify"
            className="text-[10px] text-blue-300 hover:text-blue-200 bg-blue-950/90 px-2 py-0.5 rounded border border-blue-500/40 transition flex items-center gap-1 font-sans font-semibold"
            title="Public Judicial QR Verification Portal"
          >
            <QrCode className="w-2.5 h-2.5" />
            Public /verify
          </Link>
          <Link
            to="/blockchain"
            className="text-[10px] text-teal-300 hover:text-teal-200 bg-teal-950/90 px-2 py-0.5 rounded border border-teal-500/40 transition flex items-center gap-1 font-sans font-semibold"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Blockchain Ledger
          </Link>
          <span className="text-slate-400 font-mono text-[10px] hidden sm:inline">POA-ACTIVE</span>
        </div>
      </div>

      {/* Main Topbar */}
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 gap-2 sm:gap-4">
        {/* Left: Brand & Mobile Menu */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onMenuToggle}
            aria-label="Toggle navigation menu"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg lg:hidden transition"
          >
            <Menu className="w-5 h-5" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 text-slate-900 dark:text-slate-100 font-semibold tracking-tight">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-900/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="leading-tight">
              <span className="text-sm font-bold tracking-normal block text-slate-900 dark:text-slate-100">SECURE LEGAL DMS</span>
              <span className="text-[10px] text-teal-700 dark:text-teal-400 font-medium hidden sm:block">NCRB Evidence & Investigation Portal</span>
            </div>
          </Link>
        </div>

        {/* Center: Command Palette Trigger Button (Ctrl+K) */}
        <div className="flex-1 max-w-md hidden md:block">
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-950/70 hover:bg-slate-100 dark:hover:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-xs transition shadow-sm dark:shadow-inner"
          >
            <div className="flex items-center gap-2 truncate">
              <Search className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <span className="truncate">Quick search cases, documents, exhibits...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 flex-shrink-0 shadow-sm">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right side: Quick Search Icon (mobile) + Theme Toggle + User Guide + Settings + Role Switcher + User info */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Mobile search trigger */}
          <button
            type="button"
            onClick={onOpenCommandPalette}
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg md:hidden transition"
            title="Search (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </button>

          {/* Theme Mode Toggle (Light / Dark) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 transition shadow-sm"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Theme`}
            aria-label={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {/* Settings Link */}
          <Link
            to="/settings"
            className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            title="System Preferences & Settings"
            aria-label="System Preferences & Settings"
          >
            <Sliders className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </Link>

          {/* User Guide & Officer SOP Button */}
          {onOpenUserGuide && (
            <button
              type="button"
              onClick={onOpenUserGuide}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 transition"
              title="Open Officer User Manual & Standard Operating Procedure"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="hidden lg:inline">User Guide</span>
              <span className="lg:hidden">SOP</span>
            </button>
          )}

          {/* Quick Demo Role Switcher with Authority Badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsSwitcherOpen(!isSwitcherOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-200 rounded-lg border border-slate-300 dark:border-slate-700 transition shadow-sm"
              title="Switch active departmental clearance"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden xl:inline">Role:</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 truncate max-w-[100px] sm:max-w-[130px]">
                {user?.role.replace(/_/g, ' ')}
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-mono bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold border border-blue-200 dark:border-blue-800">
                Lvl {user?.role === 'SYSTEM_ADMIN' ? 100 : user?.role === 'INVESTIGATING_OFFICER' ? 80 : user?.role === 'LEGAL_OFFICER' || user?.role === 'PROSECUTOR' ? 60 : user?.role === 'COURT_USER' || user?.role === 'AUDITOR' ? 40 : 10}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" />
            </button>

            {isSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-2 z-50 animate-fade-in">
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                    DEPARTMENTAL CLEARANCE
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">5 Tiers</span>
                </div>
                <div className="max-h-72 overflow-y-auto py-1 divide-y divide-slate-150 dark:divide-slate-800/50">
                  {DEMO_ACCOUNTS.map((acc) => {
                    const isSelected = user?.role === acc.role;
                    const lvl = acc.role === 'SYSTEM_ADMIN' ? 100 : acc.role === 'INVESTIGATING_OFFICER' ? 80 : acc.role === 'LEGAL_OFFICER' || acc.role === 'PROSECUTOR' ? 60 : acc.role === 'COURT_USER' || acc.role === 'AUDITOR' ? 40 : 10;
                    return (
                      <button
                        key={acc.role}
                        type="button"
                        onClick={() => {
                          setIsSwitcherOpen(false);
                          switchDemoRole(acc);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-slate-100 dark:hover:bg-slate-800 transition ${
                          isSelected
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="font-semibold flex items-center justify-between">
                          <span>{acc.label}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Level {lvl}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">{acc.email}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User profile info */}
          <Link
            to="/profile"
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition"
            title="View Profile"
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="hidden 2xl:block text-left text-xs leading-tight">
              <div className="font-medium text-slate-900 dark:text-slate-200 truncate max-w-[130px]">{user?.full_name}</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400">{user?.employee_id}</div>
            </div>
          </Link>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            aria-label="Log out"
            title="Log out of secure session"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
