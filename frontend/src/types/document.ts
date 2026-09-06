export type DocumentType =
  | 'FIR'
  | 'POLICE_REPORT'
  | 'INVESTIGATION_RECORD'
  | 'WITNESS_STATEMENT'
  | 'CHARGE_SHEET'
  | 'COURT_FILING'
  | 'EVIDENCE_RECORD'
  | 'FORENSIC_REPORT'
  | 'LEGAL_NOTICE'
  | 'JUDGMENT'
  | 'OTHER';

export type Classification =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED';

export type DocumentStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'RETAINED';

export type VirusScanStatus =
  | 'PENDING'
  | 'CLEAN'
  | 'INFECTED'
  | 'SKIPPED'
  | 'FAILED';

export type OcrStatus =
  | 'NOT_REQUESTED'
  | 'QUEUED'
  | 'COMPLETED'
  | 'FAILED';

export type PermissionType = 'VIEW' | 'DOWNLOAD' | 'COMMENT' | 'SHARE';

export interface DocumentItem {
  id: string;
  case_id: string;
  document_number: string;
  title: string;
  description: string | null;
  document_type: DocumentType;
  classification: Classification;
  status: DocumentStatus;
  current_version_id: string | null;
  uploaded_by: string;
  owner_department_id: string | null;
  retention_until: string | null;
  is_evidence: boolean;
  created_at: string | null;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  original_filename: string;
  mime_type: string;
  file_size: number;
  sha256_hash: string;
  uploaded_by: string;
  change_reason: string | null;
  virus_scan_status: VirusScanStatus;
  ocr_status: OcrStatus;
  ocr_text?: string | null;
  created_at: string | null;
}

export interface DocumentPermissionItem {
  id: string;
  document_id: string;
  user_id: string | null;
  role: string | null;
  permission_type: PermissionType;
  expires_at: string | null;
  granted_by: string;
  created_at: string | null;
}

export interface ShareLinkItem {
  id: string;
  document_id: string;
  token?: string | null;
  recipient_email: string | null;
  expires_at: string;
  max_downloads: number;
  download_count: number;
  is_revoked: boolean;
}

export interface IntegrityVerificationResult {
  document_id: string;
  version_id: string;
  stored_sha256: string;
  computed_sha256: string;
  matches: boolean;
}
