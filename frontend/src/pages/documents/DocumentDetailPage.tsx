import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { documentsService } from '@/services/documents.service';
import { signaturesService } from '@/services/signatures.service';
import { commentsService } from '@/services/comments.service';
import { auditService } from '@/services/audit.service';
import {
  DocumentItem,
  DocumentVersion,
  CommentItem,
  SignatureOut,
  AuditLog,
  IntegrityVerificationResult,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { VersionTimeline } from '@/components/documents/VersionTimeline';
import { ShareLinkModal } from '@/components/documents/ShareLinkModal';
import { PermissionManagerModal } from '@/components/documents/PermissionManagerModal';
import { CommentThread } from '@/components/comments/CommentThread';
import { FileUploadDropzone } from '@/components/documents/FileUploadDropzone';
import {
  FileText,
  Eye,
  Download,
  Upload,
  Share2,
  Shield,
  PenTool,
  CheckCircle2,
  XCircle,
  Clock,
  Briefcase,
  History,
  MessageSquare,
  ArrowLeft,
  Loader2,
  Copy,
  X,
  FileCheck2,
  Lock,
} from 'lucide-react';

export const DocumentDetailPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();
  const {
    user,
    canUploadDocument,
    canManageDocumentPermissions,
    canAccessDocument,
    canDownloadDocument,
    authorityLevel,
  } = useAuth();

  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [signatures, setSignatures] = useState<SignatureOut[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditLog[]>([]);
  const [currentVersion, setCurrentVersion] = useState<DocumentVersion | null>(null);
  const [integrityResult, setIntegrityResult] = useState<IntegrityVerificationResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<'overview' | 'versions' | 'comments' | 'signatures' | 'audit'>('overview');

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewVersion, setPreviewVersion] = useState<DocumentVersion | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPermModal, setShowPermModal] = useState(false);
  const [showNewVersionModal, setShowNewVersionModal] = useState(false);

  // New Version form
  const [newVersionFile, setNewVersionFile] = useState<File | null>(null);
  const [changeReason, setChangeReason] = useState('Updated revision');
  const [isUploadingVersion, setIsUploadingVersion] = useState(false);

  // Signatures
  const [signatureDisclaimer, setSignatureDisclaimer] = useState('');
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);

  const fetchDocumentData = async () => {
    if (!documentId) return;
    setIsLoading(true);
    try {
      const [docData, versData, commsData, sigsData] = await Promise.all([
        documentsService.getDocument(documentId),
        documentsService.listVersions(documentId),
        commentsService.listComments(documentId),
        signaturesService.listSignatures(documentId),
      ]);

      setDocument(docData);
      setVersions(versData.items);
      setComments(commsData.items);
      setSignatures(sigsData.items);
      setSignatureDisclaimer(sigsData.disclaimer);

      if (docData.current_version_id && versData.items.length > 0) {
        const found = versData.items.find((v) => v.id === docData.current_version_id);
        setCurrentVersion(found || versData.items[0]);
      } else if (versData.items.length > 0) {
        setCurrentVersion(versData.items[0]);
      }

      // Load audit logs
      try {
        const actRes = await auditService.listEntityAudit('document', documentId, 1, 20);
        setAuditEvents(actRes.items);
      } catch {
        // Ignored
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        navigate('/unauthorized', { replace: true });
      } else {
        console.error('Failed to load document:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentData();
  }, [documentId]);

  const handleVerifyCurrentIntegrity = async () => {
    if (!document) return;
    setIsVerifyingIntegrity(true);
    try {
      const res = await documentsService.verifyIntegrity(document.id);
      setIntegrityResult(res);
    } catch {
      alert('Integrity verification failed.');
    } finally {
      setIsVerifyingIntegrity(false);
    }
  };

  const handleDownload = async (vId?: string) => {
    if (!document) return;
    try {
      const { data, filename } = await documentsService.downloadDocument(document.id, vId);
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Download permission denied.');
    }
  };

  const handleUploadNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!document || !newVersionFile) return;

    setIsUploadingVersion(true);
    try {
      await documentsService.addVersion(document.id, newVersionFile, changeReason);
      setShowNewVersionModal(false);
      setNewVersionFile(null);
      setChangeReason('Updated revision');
      fetchDocumentData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to upload new version.');
    } finally {
      setIsUploadingVersion(false);
    }
  };

  if (isLoading) return <LoadingSkeleton type="detail" />;
  if (!document) return <div>Document not found.</div>;

  if (!canAccessDocument(document)) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-slate-900 border border-amber-500/30 rounded-2xl text-center space-y-4 shadow-xl">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Clearance Restriction Enforced</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          This document is classified as <span className="font-semibold text-slate-200">{document.classification}</span>.
          Your current authority level ({authorityLevel}) is insufficient to access or inspect this restricted evidence record.
        </p>
        <div className="pt-2">
          <Link
            to="/documents"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Evidence Vault</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link to="/documents" className="text-slate-400 hover:text-slate-200">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-900">
              {document.document_number}
            </span>
            <ClassificationBadge classification={document.classification} />
            <StatusBadge status={document.status} />
            {currentVersion && (
              <span className="text-xs px-2 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 font-mono">
                v{currentVersion.version_number}
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-100">{document.title}</h1>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setPreviewVersion(currentVersion);
              setShowPreviewModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-blue-900/30"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview</span>
          </button>

          {canDownloadDocument(document) && (
            <button
              type="button"
              onClick={() => handleDownload()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
          )}

          {canUploadDocument() && (
            <button
              type="button"
              onClick={() => setShowNewVersionModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Version</span>
            </button>
          )}

          {canManageDocumentPermissions(document) && (
            <>
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>

              <button
                type="button"
                onClick={() => setShowPermModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Permissions</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-800 flex items-center gap-6 text-sm font-medium overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Metadata & Preview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('versions')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'versions'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Version History ({versions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('comments')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'comments'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Notes & Comments ({comments.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('signatures')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'signatures'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PenTool className="w-4 h-4" />
          <span>Signatures ({signatures.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Trail</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Preview Launcher Card */}
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-950 text-blue-400 rounded-xl border border-blue-900">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100">
                    {currentVersion?.original_filename || document.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {currentVersion ? `${(currentVersion.file_size / 1024).toFixed(1)} KB | ${currentVersion.mime_type}` : 'No active file'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPreviewVersion(currentVersion);
                  setShowPreviewModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
              >
                <Eye className="w-4 h-4" />
                <span>Open Preview</span>
              </button>
            </div>

            {/* Description */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Document Description
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {document.description || 'No description provided.'}
              </p>
            </div>

            {/* OCR Extracted Text */}
            {currentVersion?.ocr_text && (
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <span>OCR Extracted Text</span>
                  <StatusBadge status={currentVersion.ocr_status} type="ocr" />
                </h3>
                <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {currentVersion.ocr_text}
                </pre>
              </div>
            )}
          </div>

          {/* Metadata Section */}
          <div className="space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
                Security & Metadata
              </h3>

              <div>
                <span className="text-slate-500 block">Case Link:</span>
                <Link to={`/cases/${document.case_id}`} className="text-blue-400 hover:underline font-mono">
                  {document.case_id}
                </Link>
              </div>

              <div>
                <span className="text-slate-500 block">Document Type:</span>
                <span className="text-slate-200 font-medium">{document.document_type.replace(/_/g, ' ')}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Uploaded By:</span>
                <span className="font-mono text-slate-300">{document.uploaded_by}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Uploaded At:</span>
                <span className="text-slate-300">{document.created_at ? new Date(document.created_at).toLocaleString() : 'N/A'}</span>
              </div>

              {/* Virus scan & OCR */}
              {currentVersion && (
                <>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-slate-500">Antivirus Scan:</span>
                    <StatusBadge status={currentVersion.virus_scan_status} type="virus" />
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">OCR Extraction:</span>
                    <StatusBadge status={currentVersion.ocr_status} type="ocr" />
                  </div>
                </>
              )}

              {/* SHA-256 Hash */}
              {currentVersion && (
                <div className="pt-2 border-t border-slate-800/80 space-y-2">
                  <span className="text-slate-500 block uppercase font-semibold text-[10px]">
                    Ledger SHA-256 Digest
                  </span>
                  <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 font-mono text-[11px] text-slate-300 break-all">
                    {currentVersion.sha256_hash}
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyCurrentIntegrity}
                    disabled={isVerifyingIntegrity}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
                  >
                    {isVerifyingIntegrity ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCheck2 className="w-3.5 h-3.5 text-blue-400" />}
                    <span>Verify Live Hash</span>
                  </button>

                  {integrityResult && (
                    <div className={`p-2 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                      integrityResult.matches ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {integrityResult.matches ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{integrityResult.matches ? 'Verified: Storage matches hash.' : 'Mismatch: Possible tamper!'}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Versions */}
      {activeTab === 'versions' && (
        <VersionTimeline
          document={document}
          versions={versions}
          onPreviewVersion={(v) => {
            setPreviewVersion(v);
            setShowPreviewModal(true);
          }}
          onRefresh={fetchDocumentData}
        />
      )}

      {/* Tab 3: Comments */}
      {activeTab === 'comments' && (
        <CommentThread
          documentId={document.id}
          comments={comments}
          currentVersionId={document.current_version_id}
          onRefresh={fetchDocumentData}
        />
      )}

      {/* Tab 4: Signatures */}
      {activeTab === 'signatures' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-950/40 border border-amber-800/80 rounded-xl text-xs text-amber-200/90 leading-relaxed">
            <span className="font-semibold block text-amber-300 mb-1">Demonstration Signature Disclaimer:</span>
            {signatureDisclaimer || 'This signature is a demonstration mock and is not legally valid. Do not treat it as a qualified electronic signature or court-admissible seal.'}
          </div>

          {signatures.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              No digital signatures affixed to this document yet. You can sign versions from the Version History tab.
            </div>
          ) : (
            <div className="space-y-3">
              {signatures.map((sig) => (
                <div key={sig.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <PenTool className="w-4 h-4 text-emerald-400" />
                      <span className="font-semibold text-slate-200">Affixed by Signer: {sig.signer_id}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-950 text-blue-400 font-mono">
                        {sig.algorithm}
                      </span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      {sig.signed_at ? new Date(sig.signed_at).toLocaleString() : ''}
                    </span>
                  </div>

                  <div className="font-mono text-[11px] text-slate-400 bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-500 block">Bound Document Hash:</span>
                    <span className="text-slate-300 break-all">{sig.document_hash}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Audit */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          {auditEvents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              No audit records available for this document.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
              {auditEvents.map((act) => (
                <div key={act.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200">{act.action}</span>
                    <span className="text-slate-500 ml-2 font-mono">by {act.actor_user_id || 'System'}</span>
                  </div>
                  <span className="text-slate-500 text-[11px]">
                    {act.timestamp ? new Date(act.timestamp).toLocaleString() : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <DocumentPreviewModal
        isOpen={showPreviewModal}
        document={document}
        version={previewVersion || currentVersion}
        onClose={() => setShowPreviewModal(false)}
      />

      <ShareLinkModal
        isOpen={showShareModal}
        documentId={document.id}
        documentTitle={document.title}
        onClose={() => setShowShareModal(false)}
      />

      <PermissionManagerModal
        isOpen={showPermModal}
        documentId={document.id}
        documentTitle={document.title}
        onClose={() => setShowPermModal(false)}
      />

      {/* Upload New Version Modal */}
      {showNewVersionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <span>Upload New Immutable Version</span>
              </h3>
              <button onClick={() => setShowNewVersionModal(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadNewVersion} className="space-y-4 text-xs">
              <FileUploadDropzone onFileSelected={setNewVersionFile} />

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Revision / Change Reason *</label>
                <input
                  type="text"
                  required
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Revised witness transcript with corrections"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewVersionModal(false)}
                  className="px-4 py-2 text-xs text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploadingVersion || !newVersionFile}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-900/30"
                >
                  {isUploadingVersion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Commit Version</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
