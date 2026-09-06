import React from 'react';
import { CustodyTransfer } from '@/types';
import { ArrowRight, MapPin, Clock, FileText, CheckCircle2 } from 'lucide-react';

interface CustodyTimelineProps {
  transfers: CustodyTransfer[];
}

export const CustodyTimeline: React.FC<CustodyTimelineProps> = ({ transfers }) => {
  if (transfers.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
        No custody transfer events logged yet. Evidence remains with the collecting officer.
      </div>
    );
  }

  return (
    <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
      {transfers.map((transfer, index) => (
        <div key={transfer.id} className="relative group">
          {/* Node */}
          <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-slate-800 border-2 border-blue-500 ring-4 ring-slate-950 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          </div>

          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 font-semibold text-slate-200">
                <span className="text-slate-400 font-normal">Transfer #{index + 1}:</span>
                <span className="font-mono text-blue-400">{transfer.from_user_id.substring(0, 8)}...</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-mono text-emerald-400">{transfer.to_user_id.substring(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>{transfer.transferred_at ? new Date(transfer.transferred_at).toLocaleString() : ''}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block">Reason:</span>
                <span className="text-slate-200 font-medium">{transfer.reason}</span>
              </div>

              {transfer.location && (
                <div>
                  <span className="text-slate-500 block flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Location:
                  </span>
                  <span className="text-slate-200">{transfer.location}</span>
                </div>
              )}

              {transfer.notes && (
                <div className="sm:col-span-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <span className="text-slate-500 block text-[11px] mb-0.5">Custody Notes:</span>
                  <span className="text-slate-300 italic">{transfer.notes}</span>
                </div>
              )}

              {transfer.digital_signature_reference && (
                <div className="sm:col-span-2 flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Signature Ref: {transfer.digital_signature_reference}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
