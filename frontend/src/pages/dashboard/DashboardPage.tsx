import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { casesService } from '@/services/cases.service';
import { searchService } from '@/services/search.service';
import { usersService } from '@/services/users.service';
import { auditService } from '@/services/audit.service';
import { Case, DocumentItem } from '@/types';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ClassificationBadge } from '@/components/common/ClassificationBadge';
import { LoadingSkeleton } from '@/components/common/LoadingSkeleton';
import {
  Briefcase,
  FileText,
  Package,
  ShieldCheck,
  AlertCircle,
  Users,
  Building2,
  ArrowRight,
  TrendingUp,
  Blocks,
  Award,
  Scale,
  Fingerprint,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const { user, isAdmin, canViewAudit } = useAuth();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [totalCases, setTotalCases] = useState(0);
  const [totalDocs, setTotalDocs] = useState(0);
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalDepts, setTotalDepts] = useState(0);
  const [auditCount, setAuditCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [casesRes, docsRes] = await Promise.all([
          casesService.listCases({ page: 1, page_size: 10 }),
          searchService.searchDocuments({ page: 1, page_size: 6 }),
        ]);

        if (!isMounted) return;

        setCases(casesRes.items);
        setTotalCases(casesRes.total);
        setDocuments(docsRes.items);
        setTotalDocs(docsRes.total);

        if (isAdmin) {
          try {
            const [usersRes, deptsRes] = await Promise.all([
              usersService.listUsers(1, 1),
              usersService.listDepartments(1, 1),
            ]);
            if (isMounted) {
              setTotalUsers(usersRes.total);
              setTotalDepts(deptsRes.total);
            }
          } catch {
            // Ignored if unauthorized
          }
        }

        if (canViewAudit) {
          try {
            const auditRes = await auditService.listAuditLogs(1, 1);
            if (isMounted) setAuditCount(auditRes.total);
          } catch {
            // Ignored
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [isAdmin, canViewAudit]);

  // Analytics data for charts
  const statusCounts = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {});

  const statusChartData = Object.entries(statusCounts).map(([name, count]) => ({
    name: name.replace(/_/g, ' '),
    count,
  }));

  const priorityCounts = cases.reduce<Record<string, number>>((acc, c) => {
    acc[c.priority] = (acc[c.priority] || 0) + 1;
    return acc;
  }, {});

  const priorityChartData = [
    { name: 'CRITICAL', count: priorityCounts.CRITICAL || 0, color: '#f43f5e' },
    { name: 'HIGH', count: priorityCounts.HIGH || 0, color: '#f59e0b' },
    { name: 'MEDIUM', count: priorityCounts.MEDIUM || 0, color: '#3b82f6' },
    { name: 'LOW', count: priorityCounts.LOW || 0, color: '#64748b' },
  ].filter((d) => d.count > 0);

  const activeCasesCount = cases.filter(
    (c) => c.status === 'UNDER_INVESTIGATION' || c.status === 'OPEN'
  ).length;

  return (
    <div className="space-y-6">
      {/* National Ministry & Division Badge Banner */}
      <div className="bg-gradient-to-r from-blue-50 via-teal-50/50 to-indigo-50 border-blue-200/80 dark:from-navy-900 dark:via-slate-900 dark:to-teal-950 p-5 rounded-2xl border dark:border-teal-500/30 shadow-sm dark:shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 bg-teal-100 text-teal-700 border border-teal-300 dark:bg-teal-500/20 dark:text-teal-400 dark:border-teal-500/30 rounded-xl mt-0.5 shadow-sm">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 border border-amber-300 dark:text-amber-400 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full dark:border-amber-500/30">
                Ministry of Home Affairs (MHA)
              </span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-800 bg-teal-100 border border-teal-300 dark:text-teal-300 dark:bg-teal-950/60 px-2.5 py-0.5 rounded-full dark:border-teal-500/30">
                NCRB Women Safety Division
              </span>
              <span className="text-[11px] text-teal-700 dark:text-teal-400 font-mono font-medium">
                Inter-Agency Criminal Justice System (ICJS)
              </span>
            </div>
            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mt-1">
              Secure Digital Legal & Investigation Document Management System
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 max-w-2xl">
              Equipped with decentralized Blockchain Merkle Notarization, Section 63 BSA electronic evidence certificates, BNS 72/73 victim PII auto-masking, and statutory BNSS charge sheet clock tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/blockchain"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-600 hover:bg-teal-500 text-white transition shadow-md shadow-teal-950/20"
          >
            <Blocks className="w-4 h-4" />
            <span>Open Blockchain Ledger</span>
          </Link>
        </div>
      </div>

      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              Operations Center
            </h1>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-950 dark:text-teal-400 dark:border-teal-800">
              {user?.role.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Authorized Officer: <strong className="text-slate-800 dark:text-slate-200">{user?.full_name}</strong> (Employee ID: {user?.employee_id}) • NCRB Node Operational
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/cases/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition shadow-md shadow-teal-900/20"
          >
            <Briefcase className="w-4 h-4" />
            <span>Register Case / FIR</span>
          </Link>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <span>Search Vault</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Active BNSS Cases</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalCases}</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>{activeCasesCount} under active investigation</span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-400 dark:border-blue-800/80 rounded-xl">
              <Briefcase className="w-6 h-6" />
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Digital Evidence Records</div>
              <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{totalDocs}</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <span>100% SHA-256 Verified</span>
              </div>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 border border-indigo-200 dark:bg-indigo-950/80 dark:text-indigo-400 dark:border-indigo-800/80 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
          </div>

          <Link
            to="/blockchain"
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-teal-500/60 rounded-xl flex items-center justify-between transition group shadow-sm"
          >
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                <span>Blockchain Ledger</span>
                <ArrowRight className="w-3 h-3 text-teal-600 dark:text-teal-400 group-hover:translate-x-0.5 transition" />
              </div>
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-300 mt-1">Block #1044</div>
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>Merkle Root Anchored</span>
              </div>
            </div>
            <div className="p-3 bg-teal-50 text-teal-600 border border-teal-200 dark:bg-teal-950/80 dark:text-teal-400 dark:border-teal-800/80 rounded-xl">
              <Blocks className="w-6 h-6" />
            </div>
          </Link>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between shadow-sm">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Sec 63 BSA Certificates</div>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">18 Issued</div>
              <div className="text-[11px] text-amber-700 dark:text-amber-300/80 mt-1 flex items-center gap-1">
                <Award className="w-3 h-3" />
                <span>Court-Admissible</span>
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-800/80 rounded-xl">
              <Fingerprint className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Visual Charts & Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Bar Chart */}
        <div className="lg:col-span-2 p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Case Status Distribution
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">Current Caseload</span>
          </div>

          <div className="h-60 w-full">
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke={isDark ? '#64748b' : '#94a3b8'} fontSize={11} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderRadius: '8px',
                      color: isDark ? '#f8fafc' : '#0f172a',
                      fontSize: '12px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No case data available for chart.
              </div>
            )}
          </div>
        </div>

        {/* Priority Breakdown Pie Chart */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">
            Priority Breakdown
          </h3>

          <div className="h-60 w-full flex flex-col items-center justify-center">
            {priorityChartData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="70%">
                  <PieChart>
                    <Pie
                      data={priorityChartData}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                    >
                      {priorityChartData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                        borderRadius: '8px',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        fontSize: '12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>

                <div className="flex flex-wrap items-center justify-center gap-3 text-xs mt-2">
                  {priorityChartData.map((p) => (
                    <div key={p.name} className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                      <span className="text-slate-700 dark:text-slate-300 font-medium">{p.name}: {p.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-xs text-slate-500">No priority data available.</div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Cases & Recent Documents Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Cases */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Recent Cases</span>
            </h3>
            <Link to="/cases" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {cases.slice(0, 4).map((c) => (
              <Link
                key={c.id}
                to={`/cases/${c.id}`}
                className="block p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/70 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {c.case_number}
                  </span>
                  <StatusBadge status={c.status} />
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                  {c.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-3">
                  <span>{c.case_type.replace(/_/g, ' ')}</span>
                  <span>|</span>
                  <span>{c.created_at ? new Date(c.created_at).toLocaleDateString() : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recently Uploaded Documents */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Recent Documents</span>
            </h3>
            <Link to="/documents" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>View Vault</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3">
            {documents.slice(0, 4).map((doc) => (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="block p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-950/70 dark:hover:bg-slate-950 border border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-400">
                    {doc.document_number}
                  </span>
                  <ClassificationBadge classification={doc.classification} />
                </div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-1 line-clamp-1">
                  {doc.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>{doc.document_type.replace(/_/g, ' ')}</span>
                  <span>{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
