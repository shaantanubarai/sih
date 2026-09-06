import React, { useState, useEffect } from 'react';
import { sharingService } from '@/services/sharing.service';
import { ShareLinkItem } from '@/types';
import {
  X,
  Share2,
  Copy,
  CheckCircle,
  AlertTriangle,
  Clock,
  DownloadCloud,
  Trash2,
  Loader2,
} from 'lucide-react';

interface ShareLinkModalProps {
  isOpen: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

export const ShareLinkModal: React.FC<ShareLinkModalProps> = ({
  isOpen,
  documentId,
  documentTitle,
  onClose,
}) => {
  const [recipientEmail, setRecipientEmail] = useState('');
  const [expiresMinutes, setExpiresMinutes] = useState(60);
  const [maxDownloads, setMaxDownloads] = useState(1);
  const [createdShare, setCreatedShare] = useState<ShareLinkItem | null>(null);
  const [shareLinks, setShareLinks] = useState<ShareLinkItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchShares = async () => {
    setIsLoading(true);
    try {
      const res = await sharingService.listShareLinks(documentId);
      setShareLinks(res.items);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchShares();
      setCreatedShare(null);
    }
  }, [isOpen, documentId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const link = await sharingService.createShareLink(documentId, {
        recipient_email: recipientEmail.trim() || undefined,
        expires_minutes: Number(expiresMinutes),
        max_downloads: Number(maxDownloads),
      });
      setCreatedShare(link);
      setRecipientEmail('');
      fetchShares();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to create share link.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevoke = async (tokenHashOrId: string) => {
    if (!window.confirm('Are you sure you want to revoke this share link immediately?')) {
      return;
    }
    try {
      await sharingService.revokeShareLink(tokenHashOrId);
      fetchShares();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to revoke link.');
    }
  };

  if (!isOpen) return null;

  const generatedUrl = createdShare?.token
    ? `${window.location.origin}/api/v1/share-links/${createdShare.token}/download`
    : null;

  const copyToClipboard = () => {
    if (generatedUrl) {
      navigator.clipboard.writeText(generatedUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 id="share-modal-title" className="text-base font-semibold text-slate-100">
                Secure Document Sharing
              </h3>
              <p className="text-xs text-slate-400 truncate max-w-md">{documentTitle}</p>
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Active one-time link display */}
          {createdShare && generatedUrl && (
            <div className="p-4 bg-emerald-950/40 border border-emerald-800 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <CheckCircle className="w-4 h-4" />
                <span>Single-Use Secure Link Generated</span>
              </div>
              <div className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                <input
                  type="text"
                  readOnly
                  value={generatedUrl}
                  className="bg-transparent text-xs font-mono text-slate-200 flex-1 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={copyToClipboard}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                >
                  {copied ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <div className="flex items-start gap-2 text-[11px] text-amber-300/90 leading-tight">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-400" />
                <span>
                  This link grants direct download access. It will expire in {createdShare.expires_at ? new Date(createdShare.expires_at).toLocaleTimeString() : '60 minutes'} or after {createdShare.max_downloads} download. Copy and deliver via secure channels.
                </span>
              </div>
            </div>
          )}

          {/* Create Share Form */}
          <form onSubmit={handleCreate} className="space-y-4 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Generate New Secure Link
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-3">
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Recipient Email (Optional audit association)
                </label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="prosecutor@department.gov"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Expires In
                </label>
                <select
                  value={expiresMinutes}
                  onChange={(e) => setExpiresMinutes(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value={15}>15 Minutes</option>
                  <option value={60}>1 Hour</option>
                  <option value={1440}>24 Hours</option>
                  <option value={4320}>3 Days</option>
                  <option value={10080}>7 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Max Downloads
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition shadow-md shadow-blue-900/20"
                >
                  {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                  <span>Generate Link</span>
                </button>
              </div>
            </div>
          </form>

          {/* Existing Share Links list */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Active & Historic Shares
            </h4>
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading shares...</div>
            ) : shareLinks.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/30 rounded-lg border border-slate-800">
                No active share links for this document.
              </div>
            ) : (
              <div className="space-y-2">
                {shareLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">
                          {link.recipient_email || 'Public Link'}
                        </span>
                        {link.is_revoked ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-950 text-rose-400 border border-rose-800">
                            REVOKED
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Expires {new Date(link.expires_at).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <DownloadCloud className="w-3 h-3" />
                          {link.download_count} / {link.max_downloads} downloads
                        </span>
                      </div>
                    </div>

                    {!link.is_revoked && (
                      <button
                        type="button"
                        onClick={() => handleRevoke(link.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/30 transition"
                        title="Revoke Share Link"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
