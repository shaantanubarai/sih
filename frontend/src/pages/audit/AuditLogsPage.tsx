import React, { useState, useEffect } from 'react';
import { auditService } from '@/services/audit.service';
import { AuditLog } from '@/types';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { SearchInput } from '@/components/common/SearchInput';
import { ChainVerificationBanner } from '@/components/audit/ChainVerificationBanner';
import { AuditDetailModal } from '@/components/audit/AuditDetailModal';
import { History, Shield, Hash, ArrowRight, Filter } from 'lucide-react';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedEvent, setSelectedEvent] = useState<AuditLog | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await auditService.listAuditLogs(page, pageSize);
      setLogs(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, pageSize]);

  const filteredLogs = logs.filter((log) => {
    if (actionFilter && !log.action.toLowerCase().includes(actionFilter.toLowerCase())) return false;
    if (entityFilter && !log.entity_type.toLowerCase().includes(entityFilter.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <History className="w-5 h-5 text-amber-400" />
          <span>Immutable Audit Ledger</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Cryptographically chained, tamper-evident audit history of all document, case, and permission events
        </p>
      </div>

      {/* Cryptographic Ledger Verification Banner */}
      <ChainVerificationBanner />

      {/* Filters */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px]">
          <SearchInput
            value={actionFilter}
            onChange={setActionFilter}
            placeholder="Filter by action (e.g. DOCUMENT_VIEW, CASE_CREATE)..."
          />
        </div>

        <div className="w-48">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
          >
            <option value="">All Entity Types</option>
            <option value="document">Document</option>
            <option value="document_version">Document Version</option>
            <option value="case">Case</option>
            <option value="case_member">Case Member</option>
            <option value="evidence">Evidence</option>
            <option value="custody_transfer">Custody Transfer</option>
            <option value="comment">Comment</option>
            <option value="signature">Signature</option>
            <option value="share_link">Share Link</option>
            <option value="user">User</option>
            <option value="department">Department</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      {isLoading ? (
        <LoadingSkeleton type="table" />
      ) : filteredLogs.length === 0 ? (
        <EmptyState
          title="No audit events found"
          description="No audit events matched your search filter."
          icon={History}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">Hash Digest</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-850/60 transition cursor-pointer"
                    onClick={() => setSelectedEvent(log)}
                  >
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-200 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="py-3 px-4 uppercase text-slate-400 font-mono whitespace-nowrap">
                      {log.entity_type}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {log.actor_user_id ? `${log.actor_user_id.substring(0, 8)}...` : 'System'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 whitespace-nowrap">
                      {log.ip_address || 'Local'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 truncate max-w-[140px]">
                      {log.event_hash}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(log)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Audit Detail Modal */}
      <AuditDetailModal
        isOpen={!!selectedEvent}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
    </div>
  );
};
