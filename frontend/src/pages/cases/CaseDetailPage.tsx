import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { casesService } from '@/services/cases.service';
import { documentsService } from '@/services/documents.service';
import { evidenceService } from '@/services/evidence.service';
import { auditService } from '@/services/audit.service';
import {
  Case,
  DocumentItem,
  EvidenceItem,
  AuditLog,
  CaseMember,
} from '@/types';
import { useAuth } from '@/context/AuthContext';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { CaseMembersModal } from '@/components/cases/CaseMembersModal';
import { FileUploadDropzone } from '@/components/documents/FileUploadDropzone';
import { StatutoryTimelineTracker } from '@/components/cases/StatutoryTimelineTracker';
import { CaseAIAssistantModal } from '@/components/cases/CaseAIAssistantModal';
import {
  Briefcase,
  FileText,
  Package,
  Users,
  History,
  Edit,
  Lock,
  Upload,
  Plus,
  Calendar,
  User,
  ArrowLeft,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

export const CaseDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const {
    user,
    canManageCase,
    canUploadDocument,
    canLogEvidence,
    canUseAICoPilot,
    isReadOnlyUser,
    canAccessDocument,
    authorityLevel,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<
    'overview' | 'documents' | 'evidence' | 'members' | 'activity'
  >('overview');

  const [caseItem, setCaseItem] = useState<Case | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [members, setMembers] = useState<CaseMember[]>([]);
  const [activity, setActivity] = useState<AuditLog[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // Upload modal state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [docNumber, setDocNumber] = useState('');
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState('FIR');
  const [docClassification, setDocClassification] = useState('CONFIDENTIAL');
  const [docDescription, setDocDescription] = useState('');
  const [isEvidenceDoc, setIsEvidenceDoc] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Evidence modal state
  const [evNumber, setEvNumber] = useState('');
  const [evDescription, setEvDescription] = useState('');
  const [evLocation, setEvLocation] = useState('');
  const [isCreatingEv, setIsCreatingEv] = useState(false);

  const fetchCaseData = async () => {
    if (!caseId) return;
    setIsLoading(true);
    try {
      const [caseData, docsData, evData, memData] = await Promise.all([
        casesService.getCase(caseId),
        documentsService.listCaseDocuments(caseId, 1, 50),
        evidenceService.listCaseEvidence(caseId, 1, 50),
        casesService.listMembers(caseId, 1, 50),
      ]);

      setCaseItem(caseData);
      setDocuments(docsData.items);
      setEvidence(evData.items);
      setMembers(memData.items);

      // Load case-related audit logs if permitted
      try {
        const actRes = await auditService.listEntityAudit('case', caseId, 1, 30);
        setActivity(actRes.items);
      } catch {
        // Ignored
      }
    } catch (err: any) {
      if (err?.response?.status === 403) {
        navigate('/unauthorized', { replace: true });
      } else {
        console.error('Failed to load case:', err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCaseData();
  }, [caseId]);

  const handleCloseCase = async () => {
    if (!caseId) return;
    setIsClosing(true);
    try {
      const updated = await casesService.closeCase(caseId);
      setCaseItem(updated);
      setShowCloseConfirm(false);
      fetchCaseData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to close case.');
    } finally {
      setIsClosing(false);
    }
  };

  const handleDocumentUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId || !uploadFile) return;

    setIsUploading(true);
    try {
      await documentsService.createDocument(caseId, {
        file: uploadFile,
        document_number: docNumber.trim(),
        title: docTitle.trim(),
        document_type: docType,
        classification: docClassification,
        description: docDescription.trim() || undefined,
        is_evidence: isEvidenceDoc,
      });
      setShowUploadModal(false);
      setUploadFile(null);
      setDocNumber('');
      setDocTitle('');
      setDocDescription('');
      fetchCaseData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseId) return;

    setIsCreatingEv(true);
    try {
      await evidenceService.createEvidence(caseId, {
        evidence_number: evNumber.trim(),
        description: evDescription.trim(),
        location_collected: evLocation.trim() || undefined,
        collected_at: new Date().toISOString(),
      });
      setShowEvidenceModal(false);
      setEvNumber('');
      setEvDescription('');
      setEvLocation('');
      fetchCaseData();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to register evidence.');
    } finally {
      setIsCreatingEv(false);
    }
  };

  if (isLoading) return <LoadingSkeleton type="detail" />;
  if (!caseItem) return <div>Case not found.</div>;

  const isManager = canManageCase(caseItem);
  const canUpload = canUploadDocument(caseItem);
  const canLogEv = canLogEvidence(caseItem);

  return (
    <div className="space-y-6">
      {isReadOnlyUser && (
        <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[11px] px-2 py-0.5 rounded bg-amber-200 border border-amber-300">
              Judicial Oversight Mode
            </span>
            <span>You are reviewing this case with read-only clearance. Modifications and field uploads are restricted.</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Link to="/cases" className="text-slate-400 hover:text-slate-200">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="font-mono text-sm font-bold text-blue-400 bg-blue-950/80 px-2.5 py-0.5 rounded border border-blue-900">
              {caseItem.case_number}
            </span>
            <StatusBadge status={caseItem.status} />
            <StatusBadge status={caseItem.priority} type="priority" />
          </div>
          <h1 className="text-xl font-bold text-slate-100">{caseItem.title}</h1>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {canUseAICoPilot && (
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold transition shadow-lg shadow-purple-950/50 border border-purple-400/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
              <span>Legal AI Co-Pilot</span>
            </button>
          )}

          {canUpload && (
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition shadow-md shadow-blue-900/30"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Document</span>
            </button>
          )}

          {canLogEv && (
            <button
              type="button"
              onClick={() => setShowEvidenceModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Evidence</span>
            </button>
          )}

          {isManager && (
            <>
              <button
                type="button"
                onClick={() => setShowMembersModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Team ({members.length})</span>
              </button>

              <Link
                to={`/cases/${caseItem.id}/edit`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit Case</span>
              </Link>

              {caseItem.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => setShowCloseConfirm(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-medium transition"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Close Case</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
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
          <Briefcase className="w-4 h-4" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'documents'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents ({documents.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Evidence ({evidence.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'members'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team Roster ({members.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('activity')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
            activeTab === 'activity'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Audit</span>
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <StatutoryTimelineTracker
            caseCreatedAt={caseItem.created_at || new Date().toISOString()}
            caseNumber={caseItem.case_number}
            isHeinousOrWomenSafety={true}
            crimeType={caseItem.case_type || 'Women Safety & POCSO Fast-Track'}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Case Description & Particulars
                </h3>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {caseItem.description || 'No detailed case summary entered.'}
              </p>
            </div>

            {/* Quick Evidence & Document highlights */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
                  Case File Inventory
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  {documents.length} Docs | {evidence.length} Evidence Items
                </span>
              </div>

              <div className="space-y-2">
                {documents.slice(0, 3).map((d) => {
                  const hasClearance = canAccessDocument(d);
                  if (hasClearance) {
                    return (
                      <Link
                        key={d.id}
                        to={`/documents/${d.id}`}
                        className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 hover:border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                          <span className="font-semibold text-slate-200">{d.document_number}:</span>
                          <span className="text-slate-300 truncate">{d.title}</span>
                        </div>
                        <ClassificationBadge classification={d.classification} />
                      </Link>
                    );
                  }
                  return (
                    <div
                      key={d.id}
                      className="flex items-center justify-between p-2.5 bg-slate-950/40 rounded-lg border border-slate-800/60 text-xs opacity-70 cursor-not-allowed"
                      title={`Requires higher authority level for ${d.classification}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                        <span className="font-semibold text-slate-400">{d.document_number}:</span>
                        <span className="text-slate-400 truncate">{d.title}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-amber-400/90 font-mono">Lvl {d.classification === 'RESTRICTED' ? '80' : '60'}</span>
                        <ClassificationBadge classification={d.classification} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Metadata Sidebar */}
          <div className="space-y-4">
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider pb-2 border-b border-slate-800">
                Administrative Record
              </h3>

              <div>
                <span className="text-slate-500 block">Case Type:</span>
                <span className="font-medium text-slate-200">{caseItem.case_type.replace(/_/g, ' ')}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Investigating Department UUID:</span>
                <span className="font-mono text-slate-300 break-all">{caseItem.investigating_department_id || 'CID'}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Assigned Officer UUID:</span>
                <span className="font-mono text-slate-300 break-all">{caseItem.assigned_officer_id || 'Unassigned'}</span>
              </div>

              <div>
                <span className="text-slate-500 block">Opened Date:</span>
                <span className="text-slate-300">{caseItem.opened_at ? new Date(caseItem.opened_at).toLocaleString() : 'N/A'}</span>
              </div>

              {caseItem.closed_at && (
                <div>
                  <span className="text-slate-500 block">Closed Date:</span>
                  <span className="text-rose-400 font-mono">{new Date(caseItem.closed_at).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Documents Attached to this Case
            </h3>
            {canUpload && (
              <button
                type="button"
                onClick={() => setShowUploadModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Document</span>
              </button>
            )}
          </div>

          {documents.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              No documents uploaded to this case yet.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                  <tr>
                    <th className="py-3 px-4">Doc Number</th>
                    <th className="py-3 px-4">Title</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {documents.map((d) => {
                    const hasClearance = canAccessDocument(d);
                    return (
                      <tr key={d.id} className={hasClearance ? "hover:bg-slate-850/50 transition" : "bg-slate-950/40 text-slate-500 transition opacity-75"}>
                        <td className="py-3 px-4 font-mono font-semibold text-blue-400">
                          {hasClearance ? (
                            d.document_number
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-slate-400">
                              <Lock className="w-3 h-3 text-amber-400" />
                              {d.document_number}
                            </span>
                          )}
                        </td>
                        <td className={`py-3 px-4 font-medium max-w-xs truncate ${hasClearance ? 'text-slate-200' : 'text-slate-400'}`}>{d.title}</td>
                        <td className="py-3 px-4 text-slate-400">{d.document_type.replace(/_/g, ' ')}</td>
                        <td className="py-3 px-4"><ClassificationBadge classification={d.classification} /></td>
                        <td className="py-3 px-4 text-slate-400">{d.created_at ? new Date(d.created_at).toLocaleDateString() : ''}</td>
                        <td className="py-3 px-4 text-right">
                          {hasClearance ? (
                            <Link to={`/documents/${d.id}`} className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-semibold">
                              Open
                            </Link>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-not-allowed"
                              title={`Requires higher authority level for ${d.classification} exhibits`}
                            >
                              <Lock className="w-3 h-3 text-amber-400" />
                              <span>Restricted</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Evidence */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Physical & Digital Evidence
            </h3>
            {canLogEv && (
              <button
                type="button"
                onClick={() => setShowEvidenceModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log New Evidence</span>
              </button>
            )}
          </div>

          {evidence.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              No evidence logged for this case.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evidence.map((item) => (
                <div key={item.id} className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-start justify-between">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-900">
                      {item.evidence_number}
                    </span>
                    <StatusBadge status={item.status} type="evidence" />
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-2">{item.description}</p>
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <span>Collected {new Date(item.collected_at).toLocaleDateString()}</span>
                    <Link to={`/evidence/${item.id}`} className="text-blue-400 hover:text-blue-300 font-medium">
                      Custody Chain →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Members */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
              Case Team Members
            </h3>
            {isManager && (
              <button
                type="button"
                onClick={() => setShowMembersModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Manage Team</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {members.map((m) => (
              <div key={m.id} className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-200">{m.user?.full_name || m.user_id}</div>
                  <div className="text-[11px] text-slate-400">Level: <span className="text-blue-400 font-mono font-medium">{m.permission_level}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Activity */}
      {activeTab === 'activity' && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200 uppercase tracking-wider">
            Case Activity Audit Ledger
          </h3>
          {activity.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
              No audit events logged for this case ID yet.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 text-xs">
              {activity.map((act) => (
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

      {/* Close Case Confirm Modal */}
      <ConfirmDialog
        isOpen={showCloseConfirm}
        title="Confirm Case Closure"
        message="Closing this case marks the legal/investigation matter as concluded. Documents will remain permanently archived in the immutable ledger. Are you sure?"
        confirmLabel="Close Case"
        isDestructive
        isLoading={isClosing}
        onConfirm={handleCloseCase}
        onClose={() => setShowCloseConfirm(false)}
      />

      {/* Members Modal */}
      <CaseMembersModal
        isOpen={showMembersModal}
        caseItem={caseItem}
        onClose={() => setShowMembersModal(false)}
        onRefresh={fetchCaseData}
      />

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <span>Upload Document to Case</span>
              </h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDocumentUpload} className="space-y-3 text-xs">
              <FileUploadDropzone onFileSelected={setUploadFile} />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Document # *</label>
                  <input
                    type="text"
                    required
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                    placeholder="e.g. DOC-2026-009"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1 font-medium">Document Type *</label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="FIR">First Information Report (FIR)</option>
                    <option value="POLICE_REPORT">Police Report</option>
                    <option value="WITNESS_STATEMENT">Witness Statement</option>
                    <option value="CHARGE_SHEET">Charge Sheet</option>
                    <option value="COURT_FILING">Court Filing</option>
                    <option value="EVIDENCE_RECORD">Evidence Record</option>
                    <option value="FORENSIC_REPORT">Forensic Report</option>
                    <option value="LEGAL_NOTICE">Legal Notice</option>
                    <option value="JUDGMENT">Judgment</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Document Title *</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="e.g. Forensic analysis report on vehicle"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Classification Level</label>
                <select
                  value={docClassification}
                  onChange={(e) => setDocClassification(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="CONFIDENTIAL">CONFIDENTIAL</option>
                  <option value="RESTRICTED">RESTRICTED</option>
                  <option value="INTERNAL">INTERNAL</option>
                  <option value="PUBLIC">PUBLIC</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Description</label>
                <textarea
                  rows={2}
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is-evidence"
                  checked={isEvidenceDoc}
                  onChange={(e) => setIsEvidenceDoc(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-blue-600"
                />
                <label htmlFor="is-evidence" className="text-slate-300 select-none">
                  Tag as formal Evidence Item (creates chain of custody reference)
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-1.5 text-xs text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-900/30"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Submit to Vault</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                <span>Log Evidence Item</span>
              </h3>
              <button onClick={() => setShowEvidenceModal(false)} className="p-1 text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvidence} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-medium">Evidence Number *</label>
                <input
                  type="text"
                  required
                  value={evNumber}
                  onChange={(e) => setEvNumber(e.target.value)}
                  placeholder="e.g. EVD-2026-004"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Item Description *</label>
                <textarea
                  required
                  rows={2}
                  value={evDescription}
                  onChange={(e) => setEvDescription(e.target.value)}
                  placeholder="Sealed forensic specimen, serial numbers, packaging condition..."
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-medium">Location Collected</label>
                <input
                  type="text"
                  value={evLocation}
                  onChange={(e) => setEvLocation(e.target.value)}
                  placeholder="e.g. Evidence Locker A-12, Division Lockup"
                  className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-4 py-1.5 text-xs text-slate-300 bg-slate-800 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingEv}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-900/30"
                >
                  {isCreatingEv ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save to Register</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legal AI Co-Pilot Modal */}
      {caseItem && (
        <CaseAIAssistantModal
          caseItem={caseItem}
          documents={documents}
          evidence={evidence}
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
};
