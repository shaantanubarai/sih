import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
  Sun,
  Moon,
  Monitor,
  CheckCircle2,
  Shield,
  Lock,
  User,
  Sliders,
  Sparkles,
  Globe,
  Bell,
  HardDrive,
  Eye,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { user } = useAuth();
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [saveToast, setSaveToast] = useState(false);

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
  };

  const themeOptions: Array<{
    id: ThemeMode;
    name: string;
    description: string;
    icon: React.ElementType;
    previewBg: string;
    previewCard: string;
    previewText: string;
    previewBorder: string;
  }> = [
    {
      id: 'light',
      name: 'Light Theme',
      description: 'Clean, high-contrast light mode optimized for daytime office and courtroom use.',
      icon: Sun,
      previewBg: 'bg-slate-100',
      previewCard: 'bg-white',
      previewText: 'text-slate-800',
      previewBorder: 'border-slate-300',
    },
    {
      id: 'dark',
      name: 'Dark Theme',
      description: 'Tactical, high-security dark interface for reduced glare and night operations.',
      icon: Moon,
      previewBg: 'bg-slate-950',
      previewCard: 'bg-slate-900',
      previewText: 'text-slate-200',
      previewBorder: 'border-slate-800',
    },
    {
      id: 'system',
      name: 'System Default',
      description: 'Automatically synchronizes with your device operating system theme setting.',
      icon: Monitor,
      previewBg: 'bg-gradient-to-r from-slate-100 to-slate-950',
      previewCard: 'bg-slate-800',
      previewText: 'text-slate-200',
      previewBorder: 'border-slate-700',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>System Preferences & Settings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure application theme, interface accessibility, and operational defaults
          </p>
        </div>

        {saveToast && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/80 dark:border-emerald-800/80 dark:text-emerald-300 text-xs rounded-xl shadow-md animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>Preferences saved</span>
          </div>
        )}
      </div>

      {/* 1. Theme & Appearance Selection */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Appearance & Color Theme</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Active mode: <span className="font-semibold text-blue-600 dark:text-blue-400 capitalize">{resolvedTheme}</span>
              {theme === 'system' && ' (synchronized with OS)'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((opt) => {
            const isSelected = theme === opt.id;
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleThemeChange(opt.id)}
                className={`text-left p-4 rounded-xl border-2 transition relative flex flex-col justify-between gap-3 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/20 shadow-md'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-950/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{opt.name}</span>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    {opt.description}
                  </p>
                </div>

                {/* Mini Preview Box */}
                <div className={`p-2.5 rounded-lg border ${opt.previewBg} ${opt.previewBorder} mt-1`}>
                  <div className={`p-2 rounded ${opt.previewCard} shadow-sm flex items-center justify-between`}>
                    <div className="space-y-1">
                      <div className={`w-12 h-1.5 rounded ${opt.previewText === 'text-slate-800' ? 'bg-slate-700' : 'bg-slate-300'}`} />
                      <div className={`w-8 h-1 rounded ${opt.previewText === 'text-slate-800' ? 'bg-slate-400' : 'bg-slate-600'}`} />
                    </div>
                    <span className="w-3 h-3 rounded-full bg-teal-500" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Language & Judicial Standardization */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>Language & Judicial Localization</span>
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800">
            SYSTEM LOCKED
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
              Application Language: English (Official Judicial Format)
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              The entire application is standardized in authentic legal English for formal courtroom filings, FIR documentation, and judicial proceedings under BNS, BNSS, and BSA 2023.
            </p>
          </div>
          <span className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-900 whitespace-nowrap">
            English (India)
          </span>
        </div>
      </div>

      {/* 3. Display Density & Interface Scale */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm dark:shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
            <Eye className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Display Density & Layout Spacing</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <button
            type="button"
            onClick={() => setDensity('comfortable')}
            className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
              density === 'comfortable'
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <span className="font-semibold block text-slate-800 dark:text-slate-200">Comfortable (Standard)</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Generous padding for laptops and monitors</span>
            </div>
            {density === 'comfortable' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => setDensity('compact')}
            className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
              density === 'compact'
                ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/20 text-slate-900 dark:text-slate-100'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div>
              <span className="font-semibold block text-slate-800 dark:text-slate-200">Compact</span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">High data density for high-volume record auditing</span>
            </div>
            {density === 'compact' && <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
          </button>
        </div>
      </div>

      {/* 4. Security & Account Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          to="/settings/security"
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl shadow-sm dark:shadow-xl transition flex items-center gap-3.5 group"
        >
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-900 text-blue-600 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
              Security & Credential Controls
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Password management, session timeout, and token rotation
            </span>
          </div>
        </Link>

        <Link
          to="/profile"
          className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 rounded-2xl shadow-sm dark:shadow-xl transition flex items-center gap-3.5 group"
        >
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-900 text-teal-600 dark:text-teal-400 group-hover:bg-teal-100 dark:group-hover:bg-teal-900/60 transition">
            <User className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block group-hover:text-teal-600 dark:group-hover:text-teal-400 transition">
              Officer Identity & Profile
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Departmental badge: {user?.employee_id || 'DEMO-OFFICER'} ({user?.role?.replace(/_/g, ' ')})
            </span>
          </div>
        </Link>
      </div>

      {/* 5. Statutory Compliance Banner */}
      <div className="p-4 bg-slate-50 dark:bg-navy-950/60 border border-slate-200 dark:border-navy-900 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <span>Statutory Compliance Architecture: <b>BNS 72/73</b>, <b>BNSS 105</b>, <b>BNSS 193</b>, and <b>BSA 63</b> active.</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">MHA-NCRB-2026-BUILD</span>
      </div>
    </div>
  );
};
