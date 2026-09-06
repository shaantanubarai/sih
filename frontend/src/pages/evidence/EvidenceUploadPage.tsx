import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { casesService } from '@/services/cases.service';
import { documentsService } from '@/services/documents.service';
import { evidenceService } from '@/services/evidence.service';
import { Case } from '@/types';
import { FileUploadDropzone } from '@/components/documents/FileUploadDropzone';
import { SecurityIndicators } from '@/components/common/SecurityIndicators';
import { SpotSeizureMemoModal } from '@/components/evidence/SpotSeizureMemoModal';
import { sha256File, formatHash } from '@/lib/crypto';
import { Loader2, ShieldCheck, Camera } from 'lucide-react';

export const EvidenceUploadPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [cases, setCases] = useState<Case[]>([]);
  const [caseId, setCaseId] = useState(params.get('caseId') || '');
  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [hashing, setHashing] = useState(false);
  const [evidenceNumber, setEvidenceNumber] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSeizureModal, setShowSeizureModal] = useState(false);

  useEffect(() => {
    void casesService.listCases({ page: 1, page_size: 50 }).then((res) => {
      setCases(res.items);
      if (!caseId && res.items[0]) setCaseId(res.items[0].id);
    });
  }, []);

  const onFile = async (selected: File) => {
    setFile(selected);
    setTitle(selected.name.replace(/\.[^.]+$/, ''));
    setHashing(true);
    try {
      setHash(await sha256File(selected));
    } finally {
      setHashing(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !file || !evidenceNumber || !description) {
      setError('Case, file, evidence number, and description are required.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const uploaded = await documentsService.createDocument(caseId, {
        file,
        document_number: `DOC-${evidenceNumber}`,
        title: title || file.name,
        document_type: 'EVIDENCE_RECORD',
        description,
        classification: 'RESTRICTED',
        is_evidence: true,
        tags: 'evidence,intake',
        change_reason: 'Evidence intake',
      });
      const ev = await evidenceService.createEvidence(caseId, {
        evidence_number: evidenceNumber,
        description: `${description} · client hash ${hash ?? 'pending'}`,
        document_id: uploaded.document.id,
        collected_at: new Date().toISOString(),
        location_collected: location || undefined,
      });
      navigate(`/evidence/${ev.id}`);
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message || 'Intake failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Evidence Intake & Forensic Vault</h1>
          <p className="mt-1 text-xs text-slate-400">
            Files are hashed in the browser before upload. The SHA-256 digest is stored with the evidence record.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowSeizureModal(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-lg text-xs font-semibold shadow border border-emerald-400/30 whitespace-nowrap"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Spot Seizure Memo (BNSS 105)</span>
        </button>
      </div>
      <SecurityIndicators classification="RESTRICTED" accessLabel="Investigators and legal officers" />

      <form onSubmit={submit} className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-6">
        {error && (
          <p className="rounded-lg border border-rose-900 bg-rose-950/50 px-3 py-2 text-xs text-rose-200" role="alert">
            {error}
          </p>
        )}
        <label className="block text-xs font-medium text-slate-300">
          Case
          <select
            required
            value={caseId}
            onChange={(e) => setCaseId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.case_number} — {c.title}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium text-slate-300">
          Evidence number
          <input
            required
            value={evidenceNumber}
            onChange={(e) => setEvidenceNumber(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            placeholder="EVD-004"
          />
        </label>
        <label className="block text-xs font-medium text-slate-300">
          Description
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            rows={3}
          />
        </label>
        <label className="block text-xs font-medium text-slate-300">
          Collection location
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          />
        </label>
        <FileUploadDropzone
          onFileSelected={(f) => void onFile(f)}
          acceptedTypes={[
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/svg+xml',
            'image/tiff',
            'text/plain',
            'audio/wav',
            'audio/mpeg',
            'video/mp4',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ]}
        />
        <div className="rounded-xl border border-teal-900/80 bg-teal-950/30 p-3 text-xs text-teal-100">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="h-4 w-4" />
            Tamper hash
          </div>
          <p className="mt-1 font-mono text-[11px] text-teal-200/90">
            {hashing ? 'Computing SHA-256…' : hash ? formatHash(hash, 16) : 'Select a file to compute digest'}
          </p>
          {hash && <p className="mt-1 break-all font-mono text-[10px] text-slate-400">{hash}</p>}
        </div>
        <button
          type="submit"
          disabled={busy || !file}
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          Seal and register
        </button>
      </form>

      {/* Spot Seizure Memo Modal */}
      <SpotSeizureMemoModal
        cases={cases}
        currentCaseId={caseId}
        isOpen={showSeizureModal}
        onClose={() => setShowSeizureModal(false)}
        onEvidenceCreated={(newEv) => navigate(`/evidence/${newEv.id}`)}
      />
    </div>
  );
};
