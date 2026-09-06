import React from 'react';
import { Link } from 'react-router-dom';
import { Case } from '@/types';
import { StatusBadge } from '../common/StatusBadge';
import { Briefcase, Calendar, User, ArrowRight } from 'lucide-react';

interface CaseCardProps {
  caseItem: Case;
}

export const CaseCard: React.FC<CaseCardProps> = ({ caseItem }) => {
  return (
    <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition flex flex-col justify-between group">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="font-mono text-xs font-semibold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-900/60">
            {caseItem.case_number}
          </span>
          <div className="flex items-center gap-1.5">
            <StatusBadge status={caseItem.priority} type="priority" />
            <StatusBadge status={caseItem.status} />
          </div>
        </div>

        <h3 className="text-base font-semibold text-slate-100 group-hover:text-blue-400 transition line-clamp-1">
          {caseItem.title}
        </h3>

        <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
          {caseItem.description || 'No description provided.'}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Briefcase className="w-3.5 h-3.5 text-slate-500" />
            {caseItem.case_type.replace(/_/g, ' ')}
          </span>
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            {caseItem.created_at ? new Date(caseItem.created_at).toLocaleDateString() : 'N/A'}
          </span>
        </div>

        <Link
          to={`/cases/${caseItem.id}`}
          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium transition"
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
