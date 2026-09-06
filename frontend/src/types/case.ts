export type CaseType =
  | 'CRIMINAL_INVESTIGATION'
  | 'CIVIL'
  | 'INTERNAL_INQUIRY'
  | 'COURT_MATTER';

export type CaseStatus =
  | 'OPEN'
  | 'UNDER_INVESTIGATION'
  | 'PENDING_REVIEW'
  | 'CLOSED'
  | 'ARCHIVED';

export type CasePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type PermissionLevel = 'OWNER' | 'EDITOR' | 'REVIEWER' | 'VIEWER';

export interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  case_type: CaseType;
  status: CaseStatus;
  priority: CasePriority;
  investigating_department_id: string | null;
  created_by: string;
  assigned_officer_id: string | null;
  opened_at: string | null;
  closed_at: string | null;
  created_at: string | null;
}

export interface CaseCreatePayload {
  case_number: string;
  title: string;
  description?: string;
  case_type: CaseType;
  priority?: CasePriority;
  investigating_department_id?: string;
  assigned_officer_id?: string;
}

export interface CaseUpdatePayload {
  title?: string;
  description?: string;
  status?: CaseStatus;
  priority?: CasePriority;
  assigned_officer_id?: string;
}

export interface CaseMember {
  id: string;
  case_id: string;
  user_id: string;
  permission_level: PermissionLevel;
  assigned_at: string | null;
  assigned_by: string;
  user?: {
    id: string;
    full_name: string;
    email: string;
    role: string;
  };
}

export interface MemberCreatePayload {
  user_id: string;
  permission_level: PermissionLevel;
}

export interface CaseSummary {
  case: Case;
  document_count: number;
  evidence_count: number;
  member_count: number;
}
