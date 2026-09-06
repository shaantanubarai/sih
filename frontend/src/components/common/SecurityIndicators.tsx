import React from 'react';
import { FileCheck2, Lock, ShieldAlert, ShieldCheck, EyeOff } from 'lucide-react';
import { Classification } from '@/types';
import { cn } from '@/lib/cn';

export interface SecurityIndicatorsProps {
  encrypted?: boolean;
  encryptionLabel?: string;
  classification?: Classification | string;
  accessLabel?: string;
  auditState?: 'attested' | 'pending' | 'break';
  hash?: string;
  className?: string;
  compact?: boolean;
}

const accessByClass: Record<string, string> = {
  RESTRICTED: 'Need-to-know · named roles only',
  CONFIDENTIAL: 'Case members · download logged',
  INTERNAL: 'Department staff',
  PUBLIC: 'Authorized disclosure',
};

export const SecurityIndicators: React.FC<SecurityIndicatorsProps> = ({
  encrypted = true,
  encryptionLabel = 'AES-256 at rest · TLS in transit',
  classification = 'CONFIDENTIAL',
  accessLabel,
  auditState = 'attested',
  hash,
  className,
  compact = false,
}) => {
  const cls = String(classification).toUpperCase();
  const access = accessLabel ?? accessByClass[cls] ?? 'Role-gated';

  const audit =
    auditState === 'attested'
      ? { label: 'Audit chain intact', icon: ShieldCheck, tone: 'text-teal-300' }
      : auditState === 'pending'
        ? { label: 'Audit write pending', icon: ShieldAlert, tone: 'text-amber-300' }
        : { label: 'Integrity alert', icon: ShieldAlert, tone: 'text-rose-300' };

  const AuditIcon = audit.icon;

  return (
    <div
      role="group"
      aria-label="Security posture"
      className={cn(
        'flex flex-wrap items-center gap-2',
        compact ? 'text-[10px]' : 'text-xs',
        className
      )}
    >
      <span
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-2 py-1',
          encrypted
            ? 'border-teal-800/80 bg-teal-950/50 text-teal-200'
            : 'border-rose-800 bg-rose-950/50 text-rose-200'
        )}
      >
        <Lock className="h-3.5 w-3.5" aria-hidden />
        <span className="font-medium">{encrypted ? 'Encrypted' : 'Unencrypted'}</span>
        {!compact && <span className="hidden text-teal-400/80 sm:inline">· {encryptionLabel}</span>}
      </span>

      <span className="inline-flex items-center gap-1.5 rounded-md border border-navy-700 bg-navy-900/70 px-2 py-1 text-slate-200">
        <EyeOff className="h-3.5 w-3.5 text-navy-300" aria-hidden />
        <span>
          <span className="sr-only">Access restriction: </span>
          {access}
        </span>
      </span>

      <span className={cn('inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2 py-1', audit.tone)}>
        <AuditIcon className="h-3.5 w-3.5" aria-hidden />
        <span>{audit.label}</span>
      </span>

      {hash && (
        <span className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-slate-700 bg-slate-950 px-2 py-1 font-mono text-[10px] text-slate-400">
          <FileCheck2 className="h-3.5 w-3.5 shrink-0 text-teal-400" aria-hidden />
          <span className="truncate" title={hash}>
            SHA-256 {hash}
          </span>
        </span>
      )}
    </div>
  );
};
