import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { documentsService } from '@/services/documents.service';
import { DocumentItem, DocumentVersion } from '@/types';
import { SecureDocumentViewer } from '@/components/documents/SecureDocumentViewer';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import { useAuth } from '@/context/AuthContext';

export const DocumentViewerPage: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const { canAccessDocument, authorityLevel } = useAuth();
  const [document, setDocument] = useState<DocumentItem | null>(null);
  const [version, setVersion] = useState<DocumentVersion | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('');
  const [textContent, setTextContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revoke: string | null = null;
    let alive = true;

    const run = async () => {
      if (!documentId) return;
      setLoading(true);
      try {
        const [doc, vers] = await Promise.all([
          documentsService.getDocument(documentId),
          documentsService.listVersions(documentId),
        ]);
        if (!alive) return;
        setDocument(doc);

        if (!canAccessDocument(doc)) {
          setError(`Clearance Restriction: This document is classified as ${doc.classification}. Your authority level (${authorityLevel}) is insufficient to view this record.`);
          setLoading(false);
          return;
        }
        const current =
          vers.items.find((v) => v.id === doc.current_version_id) || vers.items[0] || null;
        setVersion(current);
        const { data, contentType } = await documentsService.downloadDocument(documentId, current?.id);
        if (!alive) return;
        setMimeType(contentType);
        if (contentType.startsWith('text/') || contentType.includes('json')) {
          setTextContent(await data.text());
        } else {
          const url = URL.createObjectURL(data);
          revoke = url;
          setBlobUrl(url);
        }
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
            ?.message || 'Viewer access denied or file unavailable.';
        if (alive) setError(message);
      } finally {
        if (alive) setLoading(false);
      }
    };

    void run();
    return () => {
      alive = false;
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [documentId]);

  if (loading) return <LoadingSkeleton type="detail" />;

  if (error || !document) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-amber-400" />
        <h1 className="text-lg font-semibold">Secure viewer unavailable</h1>
        <p className="mt-2 text-sm text-slate-400">{error}</p>
        <Link to="/documents" className="mt-4 inline-block text-sm text-teal-300 hover:underline">
          Return to vault
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        to={`/documents/${document.id}`}
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Document record
      </Link>
      {loading && <Loader2 className="h-5 w-5 animate-spin text-teal-400" />}
      <SecureDocumentViewer
        document={document}
        version={version}
        blobUrl={blobUrl}
        mimeType={mimeType || version?.mime_type || ''}
        textContent={textContent}
      />
    </div>
  );
};
