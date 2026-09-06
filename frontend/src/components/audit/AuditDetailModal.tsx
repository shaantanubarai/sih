import React from 'react';
import { AuditLog } from '@/types';
import { X, History, Hash, ShieldCheck, User, Globe, Clock, Layers } from 'lucide-react';

interface AuditDetailModalProps {
  isOpen: boolean;
  event: AuditLog | null;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  isOpen,
  event,
  onClose,
}) => {
  if (!isOpen || !event) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 id="audit-detail-title" className="text-base font-semibold text-slate-100">
                Audit Event Record
              </h3>
              <p className="text-xs font-mono text-blue-400">{event.event_id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {/* Main properties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Action:
              </span>
              <span className="font-semibold text-slate-200">{event.action}</span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Timestamp:
              </span>
              <span className="text-slate-200">
                {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <User className="w-3.5 h-3.5" /> Actor User ID:
              </span>
              <span className="font-mono text-slate-300 truncate block">
                {event.actor_user_id || 'System Process'}
              </span>
            </div>

            <div>
              <span className="text-slate-500 block flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> Client IP:
              </span>
              <span className="font-mono text-slate-300">{event.ip_address || 'Internal Network'}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Target Entity Type:</span>
              <span className="text-slate-200 uppercase font-mono">{event.entity_type}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Entity ID:</span>
              <span className="font-mono text-slate-300 truncate block">
                {event.entity_id || 'N/A'}
              </span>
            </div>

            {event.case_id && (
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Associated Case ID:</span>
                <span className="font-mono text-blue-400">{event.case_id}</span>
              </div>
            )}
          </div>

          {/* Cryptographic Hashes */}
          <div className="space-y-2">
            <h4 className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-emerald-400" />
              Cryptographic Chaining Proof
            </h4>

            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2 font-mono">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase">Previous Event Hash (Link)</span>
                <span className="text-slate-400 break-all">{event.previous_event_hash}</span>
              </div>
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-emerald-500 block uppercase">Current Event Hash</span>
                <span className="text-emerald-300 break-all">{event.event_hash}</span>
              </div>
            </div>
          </div>

          {/* Metadata JSON */}
          {event.metadata_json && Object.keys(event.metadata_json).length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-slate-300 uppercase tracking-wider">
                Event Payload Metadata
              </h4>
              <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                {JSON.stringify(event.metadata_json, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
