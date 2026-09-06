import React, { useState, useEffect } from 'react';
import { documentsService } from '@/services/documents.service';
import { DocumentPermissionItem, PermissionType, UserRole } from '@/types';
import { X, Shield, UserPlus, Trash2, Loader2, AlertCircle } from 'lucide-react';

interface PermissionManagerModalProps {
  isOpen: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

export const PermissionManagerModal: React.FC<PermissionManagerModalProps> = ({
  isOpen,
  documentId,
  documentTitle,
  onClose,
}) => {
  const [permissions, setPermissions] = useState<DocumentPermissionItem[]>([]);
  const [permissionType, setPermissionType] = useState<PermissionType>('VIEW');
  const [targetRole, setTargetRole] = useState<UserRole | ''>('');
  const [userId, setUserId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPermissions = async () => {
    setIsLoading(true);
    try {
      const res = await documentsService.listPermissions(documentId);
      setPermissions(res.items);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPermissions();
    }
  }, [isOpen, documentId]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole && !userId) {
      alert('Please specify either a User ID or Role to grant permissions.');
      return;
    }

    setIsSubmitting(true);
    try {
      await documentsService.grantPermission(documentId, {
        user_id: userId.trim() || undefined,
        role: targetRole || undefined,
        permission_type: permissionType,
      });
      setUserId('');
      setTargetRole('');
      fetchPermissions();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to grant permission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (permissionId: string) => {
    if (!window.confirm('Are you sure you want to revoke this permission?')) return;
    try {
      await documentsService.revokePermission(documentId, permissionId);
      fetchPermissions();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to revoke permission.');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="perm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 id="perm-modal-title" className="text-base font-semibold text-slate-100">
                Access Control & Permissions
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
          {/* Grant form */}
          <form onSubmit={handleGrant} className="space-y-3 bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <UserPlus className="w-3.5 h-3.5 text-blue-400" />
              Grant Document Authorization
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value as UserRole)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Specific User ID</option>
                  <option value="INVESTIGATING_OFFICER">Investigating Officer</option>
                  <option value="LEGAL_OFFICER">Legal Officer</option>
                  <option value="PROSECUTOR">Prosecutor</option>
                  <option value="COURT_USER">Court User</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              {!targetRole && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">User UUID</label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="User UUID..."
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Permission</label>
                <select
                  value={permissionType}
                  onChange={(e) => setPermissionType(e.target.value as PermissionType)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="VIEW">VIEW</option>
                  <option value="DOWNLOAD">DOWNLOAD</option>
                  <option value="COMMENT">COMMENT</option>
                  <option value="SHARE">SHARE</option>
                </select>
              </div>

              <div className="sm:col-span-3 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
                >
                  {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Grant Permission</span>
                </button>
              </div>
            </div>
          </form>

          {/* Existing permissions list */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Existing Permissions
            </h4>
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading permissions...</div>
            ) : permissions.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/30 rounded-lg border border-slate-800">
                No custom permissions assigned. Standard case membership rules apply.
              </div>
            ) : (
              <div className="space-y-2">
                {permissions.map((perm) => (
                  <div
                    key={perm.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-200">
                        {perm.role ? `Role: ${perm.role}` : `User: ${perm.user_id}`}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Level: <span className="text-blue-400 font-mono">{perm.permission_type}</span>
                        {perm.expires_at && ` | Expires: ${new Date(perm.expires_at).toLocaleDateString()}`}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRevoke(perm.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/30 transition"
                      title="Revoke Permission"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
