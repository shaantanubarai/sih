import React, { useState } from 'react';
import { evidenceService } from '@/services/evidence.service';
import { EvidenceItem } from '@/types';
import { X, ArrowRightLeft, AlertTriangle, Loader2 } from 'lucide-react';

interface CustodyTransferModalProps {
  isOpen: boolean;
  evidence: EvidenceItem;
  onClose: () => void;
  onSuccess: () => void;
}

export const CustodyTransferModal: React.FC<CustodyTransferModalProps> = ({
  isOpen,
  evidence,
  onClose,
  onSuccess,
}) => {
  const [toUserId, setToUserId] = useState('');
  const [reason, setReason] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed) {
      alert('You must confirm the chain of custody attestation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await evidenceService.transferCustody(evidence.id, {
        to_user_id: toUserId.trim(),
        reason: reason.trim(),
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
        digital_signature_reference: `SIG-${Date.now().toString(36).toUpperCase()}`,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Custody transfer failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="transfer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 id="transfer-modal-title" className="text-base font-semibold text-slate-100">
                Log Custody Transfer
              </h3>
              <p className="text-xs text-slate-400">Evidence #{evidence.evidence_number}</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Recipient Officer / Lab Custodian UUID *
            </label>
            <input
              type="text"
              required
              value={toUserId}
              onChange={(e) => setToUserId(e.target.value)}
              placeholder="e.g. 00000000-0000-0000-0000-000000000000"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Transfer Reason *
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Forensic analysis at State Cyber Lab"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Transfer Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Forensic Science Laboratory, Room 204"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Additional Custody Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Packaging condition, seal numbers, chain verification notes..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {/* Attestation Checkbox */}
          <div className="p-3 bg-amber-950/40 border border-amber-900/60 rounded-xl flex items-start gap-2.5">
            <input
              type="checkbox"
              id="custody-attest"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="custody-attest" className="text-[11px] text-amber-200/90 leading-tight select-none">
              <span className="font-semibold block text-amber-300">Custodial Attestation:</span>
              I certify that physical/digital custody of this item is formally transferred to the recipient above and will be recorded in the tamper-evident audit ledger.
            </label>
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !confirmed}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition shadow-md shadow-blue-900/30"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRightLeft className="w-3.5 h-3.5" />}
              <span>Execute Transfer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
