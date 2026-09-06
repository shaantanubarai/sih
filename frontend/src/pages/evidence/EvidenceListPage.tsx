import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { casesService } from '@/services/cases.service';
import { evidenceService } from '@/services/evidence.service';
import { EvidenceItem } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { SearchInput } from '@/components/common/SearchInput';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { SpotSeizureMemoModal } from '@/components/evidence/SpotSeizureMemoModal';
import { Package, ArrowRight, ShieldCheck, User, Plus, FileSpreadsheet, Camera } from 'lucide-react';
import { Case } from '@/types';
import { useAuth } from '@/context/AuthContext';

export const EvidenceListPage: React.FC = () => {
  const { canSpotSeizure, canLogEvidence, isReadOnlyUser } = useAuth();
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showSpotSeizureModal, setShowSpotSeizureModal] = useState(false);

  useEffect(() => {
    const fetchAllEvidence = async () => {
      setIsLoading(true);
      try {
        // Fetch visible cases first, then collect evidence items from visible cases
        const casesRes = await casesService.listCases({ page: 1, page_size: 50 });
        setCases(casesRes.items);
        const evidencePromises = casesRes.items.map((c) =>
          evidenceService.listCaseEvidence(c.id, 1, 50).catch(() => ({ items: [] }))
        );
        const evidenceResults = await Promise.all(evidencePromises);
        const merged = evidenceResults.flatMap((r) => r.items);
        setEvidenceList(merged);
      } catch (err) {
        console.error('Failed to load evidence:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllEvidence();
  }, []);

  const filtered = evidenceList.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.evidence_number.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      (item.location_collected && item.location_collected.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>Chain of Custody & Evidence Register</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Physical and digital evidence logs, custodial tracking, and transfer records
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canSpotSeizure && (
            <button
              type="button"
              onClick={() => setShowSpotSeizureModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-emerald-950/40 transition border border-emerald-400/30"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Spot Seizure Memo (Sec 105 BNSS)</span>
            </button>
          )}

          {canLogEvidence() && (
            <Link
              to="/evidence/upload"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ingest Evidence</span>
            </Link>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search evidence #, description, or locker location..."
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton type="table" />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No evidence items found"
          description="No evidence records matched your search or have been logged in your assigned cases."
          icon={Package}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Evidence #</th>
                  <th className="py-3.5 px-4">Description</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Current Custodian</th>
                  <th className="py-3.5 px-4">Collected Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((ev) => (
                  <tr
                    key={ev.id}
                    className="hover:bg-slate-850/60 transition cursor-pointer"
                    onClick={() => (window.location.href = `/evidence/${ev.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {ev.evidence_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-200 max-w-sm truncate">
                      {ev.description}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={ev.status} type="evidence" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                      {ev.current_custodian ? `${ev.current_custodian.substring(0, 8)}...` : 'Unknown'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(ev.collected_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <Link
                        to={`/evidence/${ev.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition"
                      >
                        <span>Custody History</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Spot Seizure Memo Modal (Section 105 BNSS) */}
      <SpotSeizureMemoModal
        cases={cases}
        isOpen={showSpotSeizureModal}
        onClose={() => setShowSpotSeizureModal(false)}
        onEvidenceCreated={(newEv) => setEvidenceList((prev) => [newEv, ...prev])}
      />
    </div>
  );
};
