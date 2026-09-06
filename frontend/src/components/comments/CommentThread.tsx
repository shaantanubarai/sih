import React, { useState } from 'react';
import { CommentItem } from '@/types';
import { commentsService } from '@/services/comments.service';
import { useAuth } from '@/context/AuthContext';
import { MessageSquare, Check, Edit2, Send, CheckCircle2, Loader2 } from 'lucide-react';

interface CommentThreadProps {
  documentId: string;
  comments: CommentItem[];
  currentVersionId?: string | null;
  onRefresh: () => void;
}

export const CommentThread: React.FC<CommentThreadProps> = ({
  documentId,
  comments,
  currentVersionId,
  onRefresh,
}) => {
  const { user, canComment } = useAuth();
  const [content, setContent] = useState('');
  const [pageNumber, setPageNumber] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await commentsService.createComment(documentId, {
        content: content.trim(),
        version_id: currentVersionId || undefined,
        page_number: pageNumber ? parseInt(pageNumber, 10) : undefined,
      });
      setContent('');
      setPageNumber('');
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to post comment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (commentId: string) => {
    try {
      await commentsService.resolveComment(commentId);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to resolve comment.');
    }
  };

  const handleEditSubmit = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await commentsService.updateComment(commentId, { content: editContent.trim() });
      setEditingId(null);
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to update comment.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add comment form */}
      {canComment ? (
        <form onSubmit={handleAddComment} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
              Add Investigation Note / Legal Comment
            </span>
            <div className="flex items-center gap-2">
              <label htmlFor="page-no" className="text-xs text-slate-400">Page #:</label>
              <input
                id="page-no"
                type="number"
                min={1}
                value={pageNumber}
                onChange={(e) => setPageNumber(e.target.value)}
                placeholder="Optional"
                className="w-20 px-2 py-1 bg-slate-950 border border-slate-700 rounded text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Add observation, evidentiary question, or review comment..."
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
          />

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || !content.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Post Annotation</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 bg-slate-900/50 border border-slate-800 rounded-lg text-xs text-slate-400 text-center">
          Your role (Viewer) has read-only access and cannot post annotations.
        </div>
      )}

      {/* Comments list */}
      <div className="space-y-3">
        {comments.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 bg-slate-900/30 rounded-xl border border-slate-800">
            No notes or annotations on this document yet.
          </div>
        ) : (
          comments.map((c) => {
            const isAuthor = user?.id === c.user_id;
            const isEditing = editingId === c.id;

            return (
              <div
                key={c.id}
                className={`p-4 rounded-xl border transition ${
                  c.is_resolved
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-80'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">
                      {c.user?.full_name || `User (${c.user_id.substring(0, 8)})`}
                    </span>
                    {c.page_number && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-blue-950 text-blue-300 border border-blue-800">
                        Page {c.page_number}
                      </span>
                    )}
                    {c.is_resolved ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    ) : (
                      <span className="text-[11px] text-amber-400 font-medium">Open</span>
                    )}
                  </div>

                  <span className="text-[11px] text-slate-500">
                    {c.created_at ? new Date(c.created_at).toLocaleString() : ''}
                  </span>
                </div>

                {/* Body or edit field */}
                {isEditing ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      rows={2}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditSubmit(c.id)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {c.content}
                  </p>
                )}

                {/* Footer actions */}
                {!isEditing && (
                  <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-800/40 text-xs">
                    {isAuthor && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditContent(c.content);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                    )}

                    {!c.is_resolved && canComment && (
                      <button
                        type="button"
                        onClick={() => handleResolve(c.id)}
                        className="p-1 text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition"
                      >
                        <Check className="w-3 h-3" />
                        <span>Resolve</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
