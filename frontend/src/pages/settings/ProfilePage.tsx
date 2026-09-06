import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { User, Shield, KeyRound, Building2, Calendar, Mail, Phone, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2.5">
          <User className="w-5 h-5 text-blue-500" />
          <span>Operational Profile</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Government staff identity, departmental affiliation, and authorization clearance
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {/* Profile Banner */}
        <div className="p-6 bg-slate-950/70 border-b border-slate-800 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-950 border border-blue-800 text-blue-400 flex items-center justify-center text-2xl font-bold font-mono">
            {user.full_name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">{user.full_name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold bg-blue-950 text-blue-400 border border-blue-900">
                {user.role.replace(/_/g, ' ')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Employee ID: {user.employee_id}
              </span>
            </div>
          </div>
        </div>

        {/* Particulars */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-500 block flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Official Email:
            </span>
            <span className="text-slate-200 font-mono">{user.email}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 block flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Secure Contact:
            </span>
            <span className="text-slate-200 font-mono">{user.phone || 'Internal Extension Only'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 block flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" /> Department UUID:
            </span>
            <span className="text-slate-200 font-mono">{user.department_id || 'CID HQ'}</span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 block flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Account Enrolled:
            </span>
            <span className="text-slate-200">
              {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 block flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Account Status:
            </span>
            <span className="text-emerald-400 font-semibold">
              {user.is_active ? 'Active & Cleared' : 'Suspended'}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-slate-500 block flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Identity Verified:
            </span>
            <span className="text-slate-200">
              {user.is_verified ? 'Verified Official' : 'Pending Verification'}
            </span>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <Link
            to="/settings/security"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Manage Security & Passwords</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
