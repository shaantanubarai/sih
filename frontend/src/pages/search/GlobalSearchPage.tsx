import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchService } from '@/services/search.service';
import { DocumentItem } from '@/types';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { StatusBadge } from '@/components/common/StatusBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Search, FileText, ArrowRight, ShieldCheck, Hash, Filter, Calendar, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const GlobalSearchPage: React.FC = () => {
  const { canAccessDocument } = useAuth();
  const [query, setQuery] = useState('');
  const [caseNumber, setCaseNumber] = useState('');
  const [ocrText, setOcrText] = useState('');
  const [sha256Hash, setSha256Hash] = useState('');
  const [evidenceNumber, setEvidenceNumber] = useState('');
  const [docType, setDocType] = useState('');
  const [classification, setClassification] = useState('');

  const [results, setResults] = useState<DocumentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const executeSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const res = await searchService.searchDocuments({
        title: query || undefined,
        case_number: caseNumber || undefined,
        ocr_text: ocrText || undefined,
        hash: sha256Hash || undefined,
        evidence_number: evidenceNumber || undefined,
        document_type: docType || undefined,
        classification: classification || undefined,
        page: 1,
        page_size: 50,
      });
      setResults(res.items);
      setTotal(res.total);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query || caseNumber || ocrText || sha256Hash || evidenceNumber || docType || classification) {
        executeSearch();
      }
    }, 350);

    return () => clearTimeout(handler);
  }, [query, caseNumber, ocrText, sha256Hash, evidenceNumber, docType, classification]);

  const clearAllFilters = () => {
    setQuery('');
    setCaseNumber('');
    setOcrText('');
    setSha256Hash('');
    setEvidenceNumber('');
    setDocType('');
    setClassification('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <Search className="w-5 h-5 text-blue-400" />
          <span>Universal Investigation Search</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Full-spectrum query across case files, document titles, OCR extracted body text, and SHA-256 digests
        </p>
      </div>

      {/* Main Search Panel */}
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 shadow-xl">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search document title or keywords..."
            className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />
        </div>

        {/* Faceted Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1 font-medium">Case Number</label>
            <input
              type="text"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. DEMO-CASE-2026-001"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">OCR Extracted Text</label>
            <input
              type="text"
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="e.g. vehicle theft statement"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">SHA-256 Digest Hash</label>
            <input
              type="text"
              value={sha256Hash}
              onChange={(e) => setSha256Hash(e.target.value)}
              placeholder="Exact 64-character hash..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 font-mono text-[11px] focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Evidence Tag #</label>
            <input
              type="text"
              value={evidenceNumber}
              onChange={(e) => setEvidenceNumber(e.target.value)}
              placeholder="e.g. EVD-001"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Document Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Document Types</option>
              <option value="FIR">FIR</option>
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

          <div>
            <label className="block text-slate-400 mb-1 font-medium">Classification Level</label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Classifications</option>
              <option value="CONFIDENTIAL">CONFIDENTIAL</option>
              <option value="RESTRICTED">RESTRICTED</option>
              <option value="INTERNAL">INTERNAL</option>
              <option value="PUBLIC">PUBLIC</option>
            </select>
          </div>

          <div className="sm:col-span-2 flex items-end justify-end">
            <button
              type="button"
              onClick={clearAllFilters}
              className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              Clear Search & Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {hasSearched ? `Matched Records (${total})` : 'Search Vault'}
          </span>
        </div>

        {isLoading ? (
          <LoadingSkeleton type="table" />
        ) : !hasSearched ? (
          <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-xl">
            <Search className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-slate-300">Enter search criteria above</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Search by case numbers, keywords, OCR extracted terms, or specific document hashes.
            </p>
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title="No records matched query"
            description="Try relaxing your filters or searching by a broader keyword."
            icon={Search}
          />
        ) : (
          <div className="space-y-3">
            {results.map((doc) => {
              const hasClearance = canAccessDocument(doc);
              return (
                <div
                  key={doc.id}
                  className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    hasClearance
                      ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      : 'bg-slate-900/50 border-slate-800/60 opacity-80'
                  }`}
                >
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        {doc.document_number}
                      </span>
                      <ClassificationBadge classification={doc.classification} />
                      <StatusBadge status={doc.status} />
                      {!hasClearance && (
                        <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          Requires Clearance Level {doc.classification === 'RESTRICTED' ? '80+' : '60+'}
                        </span>
                      )}
                    </div>
                    <h3 className={`text-sm font-semibold truncate ${hasClearance ? 'text-slate-100' : 'text-slate-400'}`}>
                      {doc.title}
                    </h3>
                    <div className="text-xs text-slate-400 flex items-center gap-3">
                      <span>Type: {doc.document_type.replace(/_/g, ' ')}</span>
                      <span>|</span>
                      <span>Uploaded: {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>

                  {hasClearance ? (
                    <Link
                      to={`/documents/${doc.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition self-start sm:self-center"
                    >
                      <span>Open Vault Record</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-lg text-xs font-medium transition self-start sm:self-center cursor-not-allowed"
                      title={`Your clearance level is insufficient to access ${doc.classification} records.`}
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Restricted Access</span>
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
