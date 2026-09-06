import React, { useState, useEffect } from 'react';
import { casesService } from '@/services/cases.service';
import { Case, CaseMember, PermissionLevel } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { X, Users, UserPlus, Trash2, Shield, Loader2 } from 'lucide-react';

interface CaseMembersModalProps {
  isOpen: boolean;
  caseItem: Case;
  onClose: () => void;
  onRefresh: () => void;
}

export const CaseMembersModal: React.FC<CaseMembersModalProps> = ({
  isOpen,
  caseItem,
  onClose,
  onRefresh,
}) => {
  const { canManageCase } = useAuth();
  const [members, setMembers] = useState<CaseMember[]>([]);
  const [userId, setUserId] = useState('');
  const [permissionLevel, setPermissionLevel] = useState<PermissionLevel>('VIEWER');
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const res = await casesService.listMembers(caseItem.id);
      setMembers(res.items);
    } catch {
      // Ignored
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers();
    }
  }, [isOpen, caseItem.id]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) return;

    setIsAdding(true);
    try {
      await casesService.addMember(caseItem.id, {
        user_id: userId.trim(),
        permission_level: permissionLevel,
      });
      setUserId('');
      fetchMembers();
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to add member.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (memberUserId: string) => {
    if (!window.confirm('Remove this member from the case team?')) return;
    try {
      await casesService.removeMember(caseItem.id, memberUserId);
      fetchMembers();
      onRefresh();
    } catch (err: any) {
      alert(err?.response?.data?.error?.message || 'Failed to remove member.');
    }
  };

  if (!isOpen) return null;

  const isManager = canManageCase(caseItem);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="case-members-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 text-blue-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 id="case-members-title" className="text-base font-semibold text-slate-100">
                Case Team & Access Roster
              </h3>
              <p className="text-xs text-slate-400">{caseItem.case_number} — {caseItem.title}</p>
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Add member form */}
          {isManager && (
            <form onSubmit={handleAdd} className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-blue-400" />
                Assign Officer or Legal Representative
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">User UUID *</label>
                  <input
                    type="text"
                    required
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-slate-100 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Permission</label>
                  <select
                    value={permissionLevel}
                    onChange={(e) => setPermissionLevel(e.target.value as PermissionLevel)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="VIEWER">VIEWER</option>
                    <option value="REVIEWER">REVIEWER</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={isAdding || !userId.trim()}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
                  >
                    {isAdding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Add to Case</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Members list */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Current Roster ({members.length})
            </h4>
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-400">Loading roster...</div>
            ) : members.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-500 bg-slate-950/30 rounded-lg border border-slate-800">
                No extra members assigned.
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-900 text-slate-400 rounded-lg">
                        <Shield className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-mono text-slate-200">
                          {m.user?.full_name || m.user_id}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Role Level: <span className="text-blue-400 font-semibold">{m.permission_level}</span>
                          {m.assigned_at && ` | Assigned ${new Date(m.assigned_at).toLocaleDateString()}`}
                        </div>
                      </div>
                    </div>

                    {isManager && m.permission_level !== 'OWNER' && (
                      <button
                        type="button"
                        onClick={() => handleRemove(m.user_id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-950/30 transition"
                        title="Remove Member"
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
