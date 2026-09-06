export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'INVESTIGATING_OFFICER'
  | 'LEGAL_OFFICER'
  | 'PROSECUTOR'
  | 'COURT_USER'
  | 'AUDITOR'
  | 'VIEWER';

export const ROLE_AUTHORITY_LEVEL: Record<UserRole, number> = {
  SYSTEM_ADMIN: 100,
  INVESTIGATING_OFFICER: 80,
  LEGAL_OFFICER: 60,
  PROSECUTOR: 60,
  COURT_USER: 40,
  AUDITOR: 40,
  VIEWER: 10,
};

export const CLASSIFICATION_MIN_AUTHORITY: Record<string, number> = {
  PUBLIC: 10,
  INTERNAL: 40,
  CONFIDENTIAL: 60,
  RESTRICTED: 80,
};

export const ROLE_METADATA: Record<UserRole, {
  label: string;
  tier: string;
  badgeClass: string;
  description: string;
}> = {
  SYSTEM_ADMIN: {
    label: 'System Admin',
    tier: 'Tier 5 (National System Governance)',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800',
    description: 'System-wide configuration, access governance, user directory, and security auditing.',
  },
  INVESTIGATING_OFFICER: {
    label: 'Investigating Officer',
    tier: 'Tier 4 (Field Operations & Custody)',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800',
    description: 'Case management, crime scene spot seizures (BNSS 105), physical evidence logging, and custody transfers.',
  },
  LEGAL_OFFICER: {
    label: 'Legal Officer',
    tier: 'Tier 3 (Legal Advisory & Case Scrutiny)',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-800',
    description: 'Legal advisory, BNS 72/73 victim privacy redaction, BSA Section 63 certificate preparation, and filing scrutiny.',
  },
  PROSECUTOR: {
    label: 'Public Prosecutor',
    tier: 'Tier 3 (Prosecution Directorate)',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-800',
    description: 'Charge sheet scrutiny, digital signing of court submissions, and judicial certificate verification.',
  },
  COURT_USER: {
    label: 'Court User / Magistrate',
    tier: 'Tier 2 (Judicial Review & Oversight)',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800',
    description: 'Strictly read-only judicial docket examination, Merkle proof inspection, and court panchnama printing.',
  },
  AUDITOR: {
    label: 'Forensic Auditor',
    tier: 'Tier 2 (Independent Audit & Forensic)',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-800',
    description: 'Independent audit log surveillance, cryptographic integrity verification, and blockchain consensus auditing.',
  },
  VIEWER: {
    label: 'General Viewer',
    tier: 'Tier 1 (Public / Guest Inspection)',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    description: 'Read-only viewing of unclassified records and overview statistics without modification rights.',
  },
};

export interface User {
  id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  department_id: string | null;
  is_active: boolean;
  is_verified: boolean;
  mfa_enabled: boolean;
  last_login_at: string | null;
  created_at: string | null;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  mfa_required?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  mfa_code?: string;
}

export interface RegisterPayload {
  employee_id: string;
  full_name: string;
  email: string;
  phone?: string;
  password: string;
  department_id?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string | null;
}

export interface UserStatusUpdatePayload {
  is_active: boolean;
  is_verified?: boolean;
  role?: UserRole;
}
