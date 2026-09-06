import React from 'react';
import { Clock, AlertTriangle, ShieldAlert, CheckCircle2, Calendar, Scale } from 'lucide-react';
import { LegalLexiconTooltip } from '@/components/common/LegalLexiconTooltip';

interface StatutoryTimelineTrackerProps {
  caseCreatedAt: string;
  isHeinousOrWomenSafety?: boolean;
  crimeType?: string;
  caseNumber?: string;
}

export const StatutoryTimelineTracker: React.FC<StatutoryTimelineTrackerProps> = ({
  caseCreatedAt,
  isHeinousOrWomenSafety = true,
  crimeType = 'Women Safety & POCSO Fast-Track',
  caseNumber = 'NCRB-WS-2026-0189',
}) => {
  // Statutory limits: 60 days for women safety / POCSO fast-track, 90 days for major heinous crimes
  const statutoryLimitDays = isHeinousOrWomenSafety ? 60 : 90;

  const createdDate = new Date(caseCreatedAt);
  const today = new Date();
  const diffTime = Math.abs(today.getTime() - createdDate.getTime());
  const elapsedDays = Math.min(Math.ceil(diffTime / (1000 * 60 * 60 * 24)), statutoryLimitDays);
  const remainingDays = Math.max(statutoryLimitDays - elapsedDays, 0);
  const percentageElapsed = Math.min(Math.round((elapsedDays / statutoryLimitDays) * 100), 100);

  let statusColor = 'emerald';
  let statusText = 'Within Statutory Period';
  if (remainingDays <= 10) {
    statusColor = 'red';
    statusText = 'Critical: Filing Deadline Imminent (Risk of Default Bail)';
  } else if (remainingDays <= 25) {
    statusColor = 'amber';
    statusText = 'Approaching Final Form Deadline';
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-500/10 text-amber-500 dark:bg-amber-500/20 rounded-xl">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center">
                <span>Statutory BNSS Sec 193 Compliance</span>
                <LegalLexiconTooltip term="BNSS_193" />
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Case: {caseNumber}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Investigation Lifecycle & Charge Sheet Statutory Clock
            </h3>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-slate-500">Category:</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
            {crimeType}
          </span>
        </div>
      </div>

      {/* Progress & Countdown Metric */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-slate-400 block font-medium">Days Elapsed:</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
            {elapsedDays} of {statutoryLimitDays} Days
          </span>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="text-slate-400 block font-medium">Statutory Limit Deadline:</span>
          <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
            {remainingDays} Days Remaining
          </span>
        </div>

        <div className={`p-3 rounded-xl border ${
          statusColor === 'red'
            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
            : statusColor === 'amber'
            ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300'
            : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
        }`}>
          <span className="block font-medium text-[11px] opacity-80">Compliance Mandate:</span>
          <span className="text-xs font-bold mt-0.5 flex items-center">
            {statusColor === 'red' ? (
              <ShieldAlert className="w-3.5 h-3.5 mr-1" />
            ) : statusColor === 'amber' ? (
              <AlertTriangle className="w-3.5 h-3.5 mr-1" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            )}
            {statusText}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[11px] text-slate-500 font-medium">
          <span>FIR Registration</span>
          <span>{percentageElapsed}% of Statutory Time Used</span>
          <span>Mandatory Charge Sheet Filing (Day {statutoryLimitDays})</span>
        </div>
        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              statusColor === 'red'
                ? 'bg-red-500'
                : statusColor === 'amber'
                ? 'bg-amber-500'
                : 'bg-teal-500'
            }`}
            style={{ width: `${percentageElapsed}%` }}
          />
        </div>
      </div>

      <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span>
          Under <strong>Section 193 BNSS</strong>, default bail triggers automatically if the final police report is not filed before the expiry of the statutory period.
        </span>
        <span className="text-[10px] font-mono text-teal-600 dark:text-teal-400 font-semibold uppercase">
          Auto-Alert IO & SHO
        </span>
      </div>
    </div>
  );
};
