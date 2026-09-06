import React, { useState } from 'react';
import { DocumentItem, DocumentVersion, IntegrityVerificationResult } from '@/types';
import { documentsService } from '@/services/documents.service';
import { signaturesService } from '@/services/signatures.service';
import { StatusBadge } from '../common/StatusBadge';
import {
  FileCheck2,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Copy,
  PenTool,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface VersionTimelineProps {
  document: DocumentItem;
  versions: DocumentVersion[];
  onPreviewVersion: (version: DocumentVersion) => void;
  onRefresh: () => void;
}

export const VersionTimeline: React.FC<VersionTimelineProps> = ({
  document,
  versions,
  onPreviewVersion,
  onRefresh,
}) => {
  const { canSignDocument, canDownloadDocument } = useAuth();
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [signingId, setSigningId] = useState<string | null>(null);
  const [integrityResults, setIntegrityResults] = useState<Record<string, IntegrityVerificationResult>>({});
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [signingSuccess, setSigningSuccess] = useState<string | null>(null);

  const handleVerify = async (version: DocumentVersion) => {
    setVerifyingId(version.id);
    try {
      const res = await documentsService.verifyIntegrity(document.id, version.id);
      setIntegrityResults((prev) => ({ ...prev, [version.id]: res }));
    } catch {
      alert('Integrity verification failed.');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleSign = async (version: DocumentVersion) => {
    setSigningId(version.id);
    setSigningSuccess(null);
    try {
      await signaturesService.signVersion(document.id, version.id);
      setSigningSuccess(`Version ${version.version_number} digitally signed.`);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Signing failed.');
    } finally {
      setSigningId(null);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleDownload = async (version: DocumentVersion) => {
    try {
      const { data, filename } = await documentsService.downloadDocument(document.id, version.id);
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed.');
    }
  };

  return (
    <div className="space-y-4">
      {signingSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>{signingSuccess}</span>
        </div>
      )}

      <div className="relative border-l-2 border-slate-800 ml-4 pl-6 space-y-6">
        {versions.map((version) => {
          const isCurrent = version.id === document.current_version_id;
          const integrity = integrityResults[version.id];

          return (
            <div key={version.id} className="relative group">
              {/* Timeline marker */}
              <div
                className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  isCurrent
                    ? 'bg-blue-600 border-blue-400 ring-4 ring-blue-950'
                    : 'bg-slate-800 border-slate-600'
                }`}
              />

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 hover:border-slate-700 transition">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-100">
                      Version {version.version_number}
                    </span>
                    {isCurrent && (
                      <span className="px-2 py-0.5 bg-blue-950 text-blue-400 border border-blue-800 rounded text-[11px] font-semibold">
                        CURRENT
                      </span>
                    )}
                    <span className="text-xs text-slate-400">
                      {version.created_at ? new Date(version.created_at).toLocaleString() : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={version.virus_scan_status} type="virus" />
                    <StatusBadge status={version.ocr_status} type="ocr" />
                  </div>
                </div>

                {/* Details */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Filename:</span>{' '}
                    <span className="text-slate-200 font-mono">{version.original_filename}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">File Size:</span>{' '}
                    <span className="text-slate-200">
                      {(version.file_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  {version.change_reason && (
                    <div className="md:col-span-2">
                      <span className="text-slate-400">Change Reason:</span>{' '}
                      <span className="text-slate-200 italic">{version.change_reason}</span>
                    </div>
                  )}

                  {/* SHA-256 Hash */}
                  <div className="md:col-span-2 flex items-center gap-2 bg-slate-950/80 p-2 rounded-lg border border-slate-800 font-mono">
                    <span className="text-slate-500 select-none">SHA-256:</span>
                    <span className="text-slate-300 truncate flex-1">{version.sha256_hash}</span>
                    <button
                      type="button"
                      onClick={() => copyHash(version.sha256_hash)}
                      className="p-1 hover:text-white text-slate-400 rounded transition"
                      title="Copy SHA-256 Digest"
                    >
                      {copiedHash === version.sha256_hash ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Live Integrity Verification Status */}
                  {integrity && (
                    <div
                      className={`md:col-span-2 p-2.5 rounded-lg border flex items-center justify-between text-xs ${
                        integrity.matches
                          ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                          : 'bg-rose-950/50 border-rose-800 text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {integrity.matches ? (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        <span>
                          {integrity.matches
                            ? 'Cryptographic integrity verified: Stored object matches ledger digest.'
                            : 'CRITICAL ALERT: Stored object hash does not match version digest! Possible tampering.'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onPreviewVersion(version)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Preview
                    </button>
                    {canDownloadDocument(document) && (
                      <button
                        type="button"
                        onClick={() => handleDownload(version)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerify(version)}
                      disabled={verifyingId === version.id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition disabled:opacity-50"
                      title="Compute SHA-256 from backend storage and compare with ledger"
                    >
                      {verifyingId === version.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      Verify Hash
                    </button>

                    {canSignDocument && (
                      <button
                        type="button"
                        onClick={() => handleSign(version)}
                        disabled={signingId === version.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-blue-950/70 hover:bg-blue-900 border border-blue-800 rounded-lg transition disabled:opacity-50"
                        title="Generate digital signature for this version"
                      >
                        {signingId === version.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <PenTool className="w-3.5 h-3.5 text-blue-400" />
                        )}
                        Sign Version
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
