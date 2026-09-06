import React from 'react';
import { Classification } from '@/types';
import { Shield, ShieldAlert, Lock, Eye } from 'lucide-react';

interface ClassificationBadgeProps {
  classification: Classification | string;
  className?: string;
}

export const ClassificationBadge: React.FC<ClassificationBadgeProps> = ({
  classification,
  className = '',
}) => {
  const norm = String(classification).toUpperCase();

  switch (norm) {
    case 'RESTRICTED':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700 shadow-sm ${className}`}
          title="Restricted: Highly sensitive investigation or national security document"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          RESTRICTED
        </span>
      );
    case 'CONFIDENTIAL':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/90 dark:text-amber-300 dark:border-amber-700 ${className}`}
          title="Confidential: Department internal legal/case document"
        >
          <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          CONFIDENTIAL
        </span>
      );
    case 'INTERNAL':
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800 ${className}`}
          title="Internal: Departmental staff access"
        >
          <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          INTERNAL
        </span>
      );
    case 'PUBLIC':
    default:
      return (
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 ${className}`}
          title="Public: Authorized for public disclosure"
        >
          <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          PUBLIC
        </span>
      );
  }
};
