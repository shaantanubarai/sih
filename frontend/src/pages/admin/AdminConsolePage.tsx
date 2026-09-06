import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, HeartPulse, ShieldCheck, Users } from 'lucide-react';
import { usersService } from '@/services/users.service';
import { auditService } from '@/services/audit.service';
import { SecurityIndicators } from '@/components/common/SecurityIndicators';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';

export const AdminConsolePage: React.FC = () => {
  const [users, setUsers] = useState(0);
  const [depts, setDepts] = useState(0);
  const [audit, setAudit] = useState(0);
  const [chainOk, setChainOk] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [u, d, a, v] = await Promise.all([
          usersService.listUsers(1, 1),
          usersService.listDepartments(1, 1),
          auditService.listAuditLogs(1, 1),
          auditService.verifyAuditChain().catch(() => ({ valid: false, events_checked: 0, broken_at_index: 0 })),
        ]);
        setUsers(u.total);
        setDepts(d.total);
        setAudit(a.total);
        setChainOk(v.valid);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return <LoadingSkeleton count={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-100">Admin console</h1>
        <p className="mt-1 text-xs text-slate-400">
          Tenant health, identity, and cryptographic ledger controls for privileged operators.
        </p>
      </div>

      <SecurityIndicators
        classification="RESTRICTED"
        accessLabel="SYSTEM_ADMIN only"
        auditState={chainOk ? 'attested' : 'break'}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Users} label="Directory accounts" value={users} to="/users" />
        <Stat icon={Building2} label="Departments" value={depts} to="/departments" />
        <Stat icon={ShieldCheck} label="Audit events" value={audit} to="/audit-logs" />
        <Stat
          icon={HeartPulse}
          label="Ledger status"
          value={chainOk ? 'Healthy' : 'Alert'}
          to="/audit-logs"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Identity</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>MFA is required for every demo login (authenticator code 123456).</li>
            <li>Role changes are written to the hash-chained audit log.</li>
            <li>
              <Link className="text-teal-300 hover:underline" to="/users">
                Open user management
              </Link>
            </li>
          </ul>
        </section>
        <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Platform</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>Mock mode serves three sample cases and ten exhibits without a live database.</li>
            <li>Set VITE_USE_MOCKS=false to proxy /api to FastAPI on port 8000.</li>
            <li>
              <Link className="text-teal-300 hover:underline" to="/settings/security">
                Session and MFA settings
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
};

const Stat: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  to: string;
}> = ({ icon: Icon, label, value, to }) => (
  <Link
    to={to}
    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900 p-4 hover:border-teal-800"
  >
    <div>
      <div className="text-xs text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-100">{value}</div>
    </div>
    <Icon className="h-6 w-6 text-teal-400" />
  </Link>
);
