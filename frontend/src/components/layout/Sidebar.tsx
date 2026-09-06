import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Package,
  Search,
  Upload,
  History,
  Users,
  Building2,
  Settings2,
  ShieldCheck,
  Lock,
  X,
  Blocks,
  Sliders,
  User,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { isAdmin, canViewAudit, canLogEvidence } = useAuth();

  const navItems = [
    { label: 'Operations Dashboard', to: '/dashboard', icon: LayoutDashboard },
    { label: 'Cases & Matters', to: '/cases', icon: Briefcase },
    { label: 'Document Vault', to: '/documents', icon: FileText },
    { label: 'Evidence Register', to: '/evidence', icon: Package },
    ...(canLogEvidence()
      ? [{ label: 'Evidence Intake', to: '/evidence/upload', icon: Upload }]
      : []),
    { label: 'Blockchain Ledger', to: '/blockchain', icon: Blocks },
    { label: 'Universal Search', to: '/search', icon: Search },
  ];

  const adminItems = [
    ...(canViewAudit
      ? [{ label: 'Audit Trail Ledger', to: '/audit-logs', icon: History }]
      : []),
    ...(isAdmin
      ? [
          { label: 'Admin Console', to: '/admin/security', icon: Settings2 },
          { label: 'User Directory', to: '/users', icon: Users },
          { label: 'Departments', to: '/departments', icon: Building2 },
        ]
      : []),
  ];

  const settingsItems = [
    { label: 'System Preferences', to: '/settings', icon: Sliders },
    { label: 'Security & Credentials', to: '/settings/security', icon: Lock },
    { label: 'Officer Profile', to: '/profile', icon: User },
  ];

  const renderNavList = (items: Array<{ label: string; to: string; icon: React.ElementType }>) => (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item.to}>
          <NavLink
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/70'
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 lg:hidden">
          <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-500" />
            <span>Operations Menu</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Core Operations
            </div>
            {renderNavList(navItems)}
          </div>

          {adminItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Governance & Audit
              </div>
              {renderNavList(adminItems)}
            </div>
          )}

          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Account & Settings
            </div>
            {renderNavList(settingsItems)}
          </div>
        </div>

        {/* Legal notice footer in sidebar */}
        <div className="p-3 m-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-200 dark:border-slate-800/80 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
          <div className="font-semibold text-slate-800 dark:text-slate-300 flex items-center gap-1.5 mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Statutory Legal Standards</span>
          </div>
          BNS 72/73 PII Shield · BNSS 105 Seizure Memos · Section 63 BSA Certified.
        </div>
      </aside>
    </>
  );
};
