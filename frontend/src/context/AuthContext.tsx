import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, UserRole, LoginPayload, Case, Classification, CLASSIFICATION_MIN_AUTHORITY } from '@/types';
import { authService } from '@/services/auth.service';
import { getAccessToken, setTokens } from '@/services/api';

export interface DemoAccount {
  label: string;
  email: string;
  role: UserRole;
  password: string;
  department: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    label: 'System Admin',
    email: 'admin@demo.local',
    role: 'SYSTEM_ADMIN',
    password: 'DemoAdmin!234',
    department: 'CID',
  },
  {
    label: 'Investigating Officer',
    email: 'officer@demo.local',
    role: 'INVESTIGATING_OFFICER',
    password: 'DemoOfficer!234',
    department: 'CID',
  },
  {
    label: 'Legal Officer',
    email: 'legal@demo.local',
    role: 'LEGAL_OFFICER',
    password: 'DemoLegal!234',
    department: 'LAW',
  },
  {
    label: 'Prosecutor',
    email: 'prosecutor@demo.local',
    role: 'PROSECUTOR',
    password: 'DemoProsecutor!234',
    department: 'LAW',
  },
  {
    label: 'Auditor',
    email: 'auditor@demo.local',
    role: 'AUDITOR',
    password: 'DemoAuditor!234',
    department: 'CID',
  },
  {
    label: 'Court User',
    email: 'court@demo.local',
    role: 'COURT_USER',
    password: 'DemoCourt!234',
    department: 'LAW',
  },
  {
    label: 'Viewer',
    email: 'viewer@demo.local',
    role: 'VIEWER',
    password: 'DemoViewer!234',
    department: 'CID',
  },
];

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<{ mfaRequired: boolean }>;
  logout: () => Promise<void>;
  switchDemoRole: (account: DemoAccount) => Promise<void>;
  refreshProfile: () => Promise<void>;
  authorityLevel: number;
  isAdmin: boolean;
  isAuditor: boolean;
  isInvestigator: boolean;
  isLegalOfficer: boolean;
  isProsecutor: boolean;
  isCourtUser: boolean;
  isViewer: boolean;
  isReadOnlyUser: boolean;
  canCreateCase: boolean;
  canManageCase: (c?: Case | null) => boolean;
  canViewCase: (c?: Case | null) => boolean;
  canUploadDocument: (c?: Case | null) => boolean;
  canLogEvidence: (c?: Case | null) => boolean;
  canTransferCustody: () => boolean;
  canSpotSeizure: boolean;
  canSignDocument: boolean;
  canAnnotateAndRedact: boolean;
  canGenerateCertificate: boolean;
  canUseAICoPilot: boolean;
  canManageDocumentPermissions: (d?: any) => boolean;
  canAccessDocument: (d?: { classification?: Classification | string } | null) => boolean;
  canDownloadDocument: (d?: { classification?: Classification | string } | null) => boolean;
  canComment: boolean;
  canViewAudit: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch {
      setUser(null);
      setTokens(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleAuthExpired = () => {
      setUser(null);
    };

    window.addEventListener('auth:expired', handleAuthExpired);
    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const result = await authService.login(payload);
      if (result.mfaRequired) {
        return { mfaRequired: true };
      }
      setUser(result.user);
      return { mfaRequired: false };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore network errors on logout
    } finally {
      setUser(null);
      setTokens(null);
    }
  };

  const switchDemoRole = async (account: DemoAccount) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await authService.login({
        email: account.email,
        password: account.password,
        mfa_code: '123456',
      });
      setUser(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    try {
      const updated = await authService.getCurrentUser();
      setUser(updated);
    } catch {
      // Ignored
    }
  };

  const role = user?.role;

  const permissions = useMemo(() => {
    const isAdmin = role === 'SYSTEM_ADMIN';
    const isInvestigator = role === 'INVESTIGATING_OFFICER';
    const isLegalOfficer = role === 'LEGAL_OFFICER';
    const isProsecutor = role === 'PROSECUTOR';
    const isCourtUser = role === 'COURT_USER';
    const isAuditor = role === 'AUDITOR';
    const isViewer = role === 'VIEWER';

    // Authority ranking: Admin (100) > Investigator (80) > Legal / Prosecutor (60) > Court / Auditor (40) > Viewer (10)
    const authorityLevel = isAdmin
      ? 100
      : isInvestigator
      ? 80
      : isLegalOfficer || isProsecutor
      ? 60
      : isCourtUser || isAuditor
      ? 40
      : 10;

    // Read-only roles cannot mutate evidence, upload versions, or redact files
    const isReadOnlyUser = isCourtUser || isAuditor || isViewer;

    // Case creation is restricted to police investigators and administrative leadership
    const canCreateCase = isAdmin || isInvestigator;

    // Case management (team assignment, edit, close)
    const canManageCase = (c?: Case | null) => {
      if (!user || isReadOnlyUser) return false;
      if (isAdmin) return true;
      if (isLegalOfficer || isProsecutor) return false;
      if (!c) return isInvestigator;
      return c.created_by === user.id || c.assigned_officer_id === user.id;
    };

    // Document upload (initial upload to a case or new version)
    const canUploadDocument = (c?: Case | null) => {
      if (!user || isReadOnlyUser) return false;
      if (isAdmin) return true;
      if (isProsecutor || isLegalOfficer) return false; // Prosecutors and legal advisors review files; IOs upload
      if (!c) return isInvestigator;
      return c.created_by === user.id || c.assigned_officer_id === user.id;
    };

    // Evidence logging & field operations
    const canLogEvidence = (c?: Case | null) => {
      if (!user || isReadOnlyUser) return false;
      if (isAdmin) return true;
      if (!isInvestigator) return false;
      if (!c) return true;
      return c.created_by === user.id || c.assigned_officer_id === user.id;
    };

    // Transfer physical evidence custody (Malkhana / Station House Officer)
    const canTransferCustody = () => {
      if (!user || isReadOnlyUser) return false;
      return isAdmin || isInvestigator;
    };

    // Section 105 BNSS field spot seizure memo
    const canSpotSeizure = isAdmin || isInvestigator;

    // Digital signing of documents/versions
    const canSignDocument = isAdmin || isInvestigator || isLegalOfficer || isProsecutor;

    // PII Redaction (BNS 72/73) and manual annotation
    const canAnnotateAndRedact = isAdmin || isInvestigator || isLegalOfficer || isProsecutor;

    // Section 63 BSA court certificate preparation
    const canGenerateCertificate = isAdmin || isInvestigator || isLegalOfficer || isProsecutor;

    // Legal AI Co-Pilot investigation assistant
    const canUseAICoPilot = isAdmin || isInvestigator || isLegalOfficer || isProsecutor;

    // Sharing and access permission management
    const canManageDocumentPermissions = (d?: any) => {
      if (!user || isReadOnlyUser) return false;
      if (isAdmin) return true;
      if (!isInvestigator) return false;
      if (!d) return true;
      return d.uploaded_by === user.id;
    };

    // Case and document discussion notes
    const canComment = !isViewer;

    // Forensic audit log access
    const canViewAudit = isAdmin || isAuditor;

    // Granular document access based on Classification vs User Authority Level
    // RESTRICTED = Level 80+ (IO, Admin)
    // CONFIDENTIAL = Level 60+ (Legal, Prosecutor, IO, Admin)
    // INTERNAL = Level 40+ (Court, Auditor, Legal, Prosecutor, IO, Admin)
    // PUBLIC = Level 10+ (All users including Viewer)
    const canAccessDocument = (d?: { classification?: Classification | string } | null) => {
      if (!user) return false;
      if (isAdmin) return true;
      if (!d || !d.classification) return true;
      const minReq = CLASSIFICATION_MIN_AUTHORITY[d.classification] ?? 10;
      return authorityLevel >= minReq;
    };

    // Document download authority:
    // Viewers cannot download files; other roles require classification clearance
    const canDownloadDocument = (d?: { classification?: Classification | string } | null) => {
      if (!user || isViewer) return false;
      return canAccessDocument(d);
    };

    // Case access check
    const canViewCase = (c?: Case | null) => {
      if (!user) return false;
      if (isAdmin) return true;
      if (!c) return true;
      // Critical inquiries (e.g. internal leaks) require Level 40+ clearance
      if (c.priority === 'CRITICAL' && isViewer) return false;
      return true;
    };

    return {
      authorityLevel,
      isAdmin,
      isAuditor,
      isInvestigator,
      isLegalOfficer,
      isProsecutor,
      isCourtUser,
      isViewer,
      isReadOnlyUser,
      canCreateCase,
      canManageCase,
      canViewCase,
      canUploadDocument,
      canLogEvidence,
      canTransferCustody,
      canSpotSeizure,
      canSignDocument,
      canAnnotateAndRedact,
      canGenerateCertificate,
      canUseAICoPilot,
      canManageDocumentPermissions,
      canAccessDocument,
      canDownloadDocument,
      canComment,
      canViewAudit,
    };
  }, [user, role]);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    switchDemoRole,
    refreshProfile,
    ...permissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const defaultAuthContext: AuthContextType = {
  user: {
    id: '22222222-bbbb-4bbb-8bbb-000000000002',
    employee_id: 'EMP-IO-01',
    full_name: 'Inspector Rajesh Sharma (IO - Women Safety)',
    email: 'officer@demo.local',
    phone: '9810023456',
    role: 'INVESTIGATING_OFFICER',
    department_id: '11111111-aaaa-4aaa-8aaa-000000000001',
    is_active: true,
    is_verified: true,
    mfa_enabled: true,
    last_login_at: null,
    created_at: null,
  },
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({ mfaRequired: false }),
  logout: async () => {},
  switchDemoRole: async () => {},
  refreshProfile: async () => {},
  authorityLevel: 80,
  isAdmin: false,
  isAuditor: false,
  isInvestigator: true,
  isLegalOfficer: false,
  isProsecutor: false,
  isCourtUser: false,
  isViewer: false,
  isReadOnlyUser: false,
  canCreateCase: true,
  canManageCase: () => true,
  canViewCase: () => true,
  canUploadDocument: () => true,
  canLogEvidence: () => true,
  canTransferCustody: () => true,
  canSpotSeizure: true,
  canSignDocument: true,
  canAnnotateAndRedact: true,
  canGenerateCertificate: true,
  canUseAICoPilot: true,
  canManageDocumentPermissions: () => true,
  canAccessDocument: () => true,
  canDownloadDocument: () => true,
  canComment: true,
  canViewAudit: false,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return defaultAuthContext;
  }
  return context;
};
