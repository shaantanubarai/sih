import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchService } from '@/services/search.service';
import { DocumentItem } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { SearchInput } from '@/components/common/SearchInput';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { FileText, Filter, ArrowRight, Shield, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const DocumentsListPage: React.FC = () => {
  const { canAccessDocument, authorityLevel } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(15);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [title, setTitle] = useState('');
  const [docType, setDocType] = useState('');
  const [classification, setClassification] = useState('');
  const [ocrSearch, setOcrSearch] = useState('');

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const res = await searchService.searchDocuments({
        page,
        page_size: pageSize,
        title: title || undefined,
        document_type: docType || undefined,
        classification: classification || undefined,
        ocr_text: ocrSearch || undefined,
      });
      setDocuments(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [page, title, docType, classification, ocrSearch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Document Vault</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and verify legal filings, forensic records, and FIR documents
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <SearchInput
              value={title}
              onChange={(val) => {
                setTitle(val);
                setPage(1);
              }}
              placeholder="Search title..."
            />
          </div>

          <div>
            <select
              value={docType}
              onChange={(e) => {
                setDocType(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Document Types</option>
              <option value="FIR">FIR</option>
              <option value="POLICE_REPORT">Police Report</option>
              <option value="INVESTIGATION_RECORD">Investigation Record</option>
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

          <div>
            <select
              value={classification}
              onChange={(e) => {
                setClassification(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Classifications</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="PUBLIC">PUBLIC</option>
            </select>
          </div>

          <div>
            <input
              type="text"
              value={ocrSearch}
              onChange={(e) => {
                setOcrSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Full-text OCR query..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:border-blue-500 focus:outline-none placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingSkeleton type="table" />
      ) : documents.length === 0 ? (
        <EmptyState
          title="No documents found"
          description="No document records matched the current vault filter criteria."
          icon={FileText}
        />
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Doc #</th>
                  <th className="py-3.5 px-4">Title</th>
                  <th className="py-3.5 px-4">Document Type</th>
                  <th className="py-3.5 px-4">Classification</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Uploaded</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {documents.map((doc) => {
                  const hasClearance = canAccessDocument(doc);
                  return (
                    <tr
                      key={doc.id}
                      className={`transition group ${
                        hasClearance
                          ? 'hover:bg-slate-850/60 cursor-pointer'
                          : 'opacity-70 bg-slate-950/40 cursor-not-allowed'
                      }`}
                      onClick={() => {
                        if (hasClearance) {
                          window.location.href = `/documents/${doc.id}`;
                        }
                      }}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-blue-400 whitespace-nowrap flex items-center gap-1.5">
                        {!hasClearance && <Lock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                        <span>{doc.document_number}</span>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-200 max-w-xs truncate">
                        {doc.title}
                        {!hasClearance && (
                          <span className="block text-[10px] text-amber-400/90 font-sans mt-0.5">
                            Requires Clearance Level {doc.classification === 'RESTRICTED' ? '80+' : '60+'} (Your Level: {authorityLevel})
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {doc.document_type.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <ClassificationBadge classification={doc.classification} />
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <StatusBadge status={doc.status} />
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        {hasClearance ? (
                          <Link
                            to={`/documents/${doc.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium transition"
                          >
                            <span>Open</span>
                            <ArrowRight className="w-3 h-3" />
                          </Link>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-950/60 border border-amber-900/60 text-amber-300 rounded text-xs font-medium"
                            title={`Requires higher authority level for ${doc.classification} classification`}
                          >
                            <Lock className="w-3 h-3" />
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

          <Pagination
            currentPage={page}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
};
