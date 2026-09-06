import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { evidenceService } from '@/services/evidence.service';
import { EvidenceItem, CustodyTransfer } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { CustodyTimeline } from '@/components/evidence/CustodyTimeline';
import { CustodyTransferModal } from '@/components/evidence/CustodyTransferModal';
import {
  Package,
  ArrowLeft,
  ArrowRightLeft,
  Calendar,
  MapPin,
  User,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const EvidenceDetailPage: React.FC = () => {
  const { evidenceId } = useParams<{ evidenceId: string }>();
  const navigate = useNavigate();
  const { canTransferCustody, isReadOnlyUser } = useAuth();

  const [evidence, setEvidence] = useState<EvidenceItem | null>(null);
  const [transfers, setTransfers] = useState<CustodyTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const fetchEvidenceData = async () => {
    if (!evidenceId) return;
    setIsLoading(true);
    try {
      const [evItem, histRes] = await Promise.all([
        evidenceService.getEvidence(evidenceId),
        evidenceService.getCustodyHistory(evidenceId),
      ]);
      setEvidence(evItem);
      setTransfers(histRes.items);
    } catch (err: any) {
      if (err?.response?.status === 403) {
        navigate('/unauthorized', { replace: true });
      } else {
        console.error('Failed to load evidence:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceData();
  }, [evidenceId]);

  if (isLoading) return <LoadingSkeleton type="detail" />;
  if (!evidence) return <div>Evidence record not found.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link to="/evidence" className="text-slate-400 hover:text-slate-200">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-900">
              {evidence.evidence_number}
            </span>
            <StatusBadge status={evidence.status} type="evidence" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">Chain of Custody Record</h1>
        </div>

        {canTransferCustody() && (
          <button
            type="button"
            onClick={() => setShowTransferModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-blue-900/30"
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>Transfer Custody</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Custody Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Verifiable Chain of Custody History</span>
            </h3>

            <CustodyTimeline transfers={transfers} />
          </div>
        </div>

        {/* Right: Item Particulars */}
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
              Evidence Particulars
            </h3>

            <div>
              <span className="text-slate-500 block">Item Description:</span>
              <p className="text-slate-200 mt-1 leading-relaxed">{evidence.description}</p>
            </div>

            <div>
              <span className="text-slate-500 block">Current Custodian:</span>
              <span className="font-mono text-emerald-400 font-semibold">{evidence.current_custodian}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Initial Collector UUID:</span>
              <span className="font-mono text-slate-300">{evidence.collected_by}</span>
            </div>

            <div>
              <span className="text-slate-500 block">Collection Date:</span>
              <span className="text-slate-300">{new Date(evidence.collected_at).toLocaleString()}</span>
            </div>

            {evidence.location_collected && (
              <div>
                <span className="text-slate-500 block">Location Collected:</span>
                <span className="text-slate-200">{evidence.location_collected}</span>
              </div>
            )}

            <div>
              <span className="text-slate-500 block">Case Association:</span>
              <Link to={`/cases/${evidence.case_id}`} className="text-blue-400 hover:underline font-mono">
                {evidence.case_id}
              </Link>
            </div>

            {evidence.document_id && (
              <div>
                <span className="text-slate-500 block">Linked Document Record:</span>
                <Link to={`/documents/${evidence.document_id}`} className="text-indigo-400 hover:underline font-mono">
                  {evidence.document_id}
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <CustodyTransferModal
        isOpen={showTransferModal}
        evidence={evidence}
        onClose={() => setShowTransferModal(false)}
        onSuccess={fetchEvidenceData}
      />
    </div>
  );
};
