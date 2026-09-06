import React, { useEffect, useState } from 'react';
import { documentsService } from '@/services/documents.service';
import { DocumentItem, DocumentVersion } from '@/types';
import { X, Download, FileText, Loader2, AlertTriangle, ZoomIn, ZoomOut, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  document: DocumentItem;
  version?: DocumentVersion | null;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  isOpen,
  document,
  version,
  onClose,
}) => {
  const { canAccessDocument, canDownloadDocument, authorityLevel } = useAuth();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [textContent, setTextContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  useEffect(() => {
    if (!isOpen) {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
      setBlobUrl(null);
      setTextContent(null);
      setError(null);
      return;
    }

    let isMounted = true;
    const fetchBlob = async () => {
      if (!canAccessDocument(document)) {
        setError(`Clearance Restriction: This document is classified as ${document.classification}. Your current authority level (${authorityLevel}) is insufficient to preview this record.`);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const { data, contentType } = await documentsService.downloadDocument(
          document.id,
          version?.id
        );

        if (!isMounted) return;

        setMimeType(contentType);

        if (contentType.startsWith('text/') || contentType.includes('json')) {
          const text = await data.text();
          setTextContent(text);
        } else {
          const url = URL.createObjectURL(data);
          setBlobUrl(url);
        }
      } catch (err: any) {
        if (!isMounted) return;
        const msg =
          err?.response?.data?.error?.message ||
          'Failed to load document preview. You may not have download permission.';
        setError(msg);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchBlob();

    return () => {
      isMounted = false;
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [isOpen, document.id, version?.id]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    try {
      const { data, filename } = await documentsService.downloadDocument(
        document.id,
        version?.id
      );
      const url = URL.createObjectURL(data);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to download document.');
    }
  };

  const isPdf = mimeType.includes('pdf') || version?.mime_type?.includes('pdf');
  const isImage =
    mimeType.startsWith('image/') || version?.mime_type?.startsWith('image/');
  const isText =
    textContent !== null ||
    mimeType.startsWith('text/') ||
    version?.mime_type?.startsWith('text/');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in"
    >
      <div className="relative w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <h3
                id="preview-modal-title"
                className="text-base font-semibold text-slate-100 truncate"
              >
                {document.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Doc #{document.document_number}</span>
                {version && <span>| Version {version.version_number}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isImage && (
              <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 mr-2 text-slate-300">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                  className="p-1 hover:bg-slate-700 rounded transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs px-1 font-mono">{zoomLevel}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                  className="p-1 hover:bg-slate-700 rounded transition"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            )}

            {canDownloadDocument(document) && (
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                title="Download Document"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              aria-label="Close preview"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer */}
        <div className="flex-1 bg-slate-950/80 overflow-auto flex items-center justify-center p-4">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading authorized preview...</p>
            </div>
          ) : error ? (
            <div className="text-center p-6 max-w-md bg-slate-900 border border-slate-800 rounded-xl">
              <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
              <h4 className="text-base font-medium text-slate-200">Preview Unavailable</h4>
              <p className="mt-1 text-sm text-slate-400">{error}</p>
            </div>
          ) : isPdf && blobUrl ? (
            <iframe
              src={blobUrl}
              title={document.title}
              className="w-full h-full rounded-lg border border-slate-800 shadow-inner bg-slate-900"
            />
          ) : isImage && blobUrl ? (
            <div className="w-full h-full flex items-center justify-center overflow-auto">
              <img
                src={blobUrl}
                alt={document.title}
                style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
                className="max-h-full max-w-full object-contain rounded-lg transition-transform duration-150"
              />
            </div>
          ) : isText && textContent !== null ? (
            <pre className="w-full h-full p-6 bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-slate-300 overflow-auto whitespace-pre-wrap leading-relaxed">
              {textContent}
            </pre>
          ) : (
            <div className="text-center p-8 max-w-md bg-slate-900 border border-slate-800 rounded-xl">
              <FileText className="w-12 h-12 text-slate-500 mx-auto mb-3" />
              <h4 className="text-base font-semibold text-slate-200">
                Binary or Office Document
              </h4>
              <p className="mt-2 text-sm text-slate-400">
                Direct in-browser rendering is unavailable for this file format ({mimeType || version?.mime_type}). Use the authorized download option to inspect the file locally.
              </p>
              <button
                type="button"
                onClick={handleDownload}
                className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
