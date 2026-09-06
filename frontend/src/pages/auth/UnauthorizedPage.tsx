import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const UnauthorizedPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-rose-950/60 border border-rose-900 rounded-2xl text-rose-400 mb-4 shadow-xl">
        <ShieldAlert className="w-12 h-12" />
      </div>

      <h1 className="text-2xl font-bold text-slate-100">
        403 — Restricted Authorization
      </h1>

      <p className="mt-2 text-sm text-slate-400 max-w-md leading-relaxed">
        Access to this operational ledger or document record is restricted under Departmental Security Policies. Your current role (<span className="text-blue-400 font-mono font-semibold">{user?.role}</span>) does not have clearance for this resource.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
        >
          <Home className="w-4 h-4" />
          <span>Return to Operations Dashboard</span>
        </Link>
      </div>

      <p className="mt-8 text-[11px] text-slate-500 font-mono">
        Audit Incident Logged // Timestamp: {new Date().toISOString()}
      </p>
    </div>
  );
};
