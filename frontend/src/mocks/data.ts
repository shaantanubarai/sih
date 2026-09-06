import type {
  AuditLog,
  Case,
  CaseMember,
  CommentItem,
  CustodyTransfer,
  Department,
  DocumentItem,
  DocumentPermissionItem,
  DocumentVersion,
  EvidenceItem,
  SignatureOut,
  User,
} from '@/types';

export const DEMO_MFA_CODE = '123456';

export const IDS = {
  deptCid: '11111111-aaaa-4aaa-8aaa-000000000001',
  deptLaw: '11111111-aaaa-4aaa-8aaa-000000000002',
  admin: '22222222-bbbb-4bbb-8bbb-000000000001',
  officer: '22222222-bbbb-4bbb-8bbb-000000000002',
  legal: '22222222-bbbb-4bbb-8bbb-000000000003',
  prosecutor: '22222222-bbbb-4bbb-8bbb-000000000004',
  auditor: '22222222-bbbb-4bbb-8bbb-000000000005',
  court: '22222222-bbbb-4bbb-8bbb-000000000006',
  viewer: '22222222-bbbb-4bbb-8bbb-000000000007',
  case1: '33333333-cccc-4ccc-8ccc-000000000001',
  case2: '33333333-cccc-4ccc-8ccc-000000000002',
  case3: '33333333-cccc-4ccc-8ccc-000000000003',
} as const;

const now = '2026-09-01T10:00:00.000Z';

export const departments: Department[] = [
  {
    id: IDS.deptCid,
    name: 'NCRB Women Safety Division & Cyber Cell',
    code: 'NCRB-WSD',
    description: 'Special investigation unit for crimes against women and cyber forensics',
    created_at: now,
  },
  {
    id: IDS.deptLaw,
    name: 'Directorate of Prosecution & Judicial Affairs',
    code: 'DOP-LAW',
    description: 'Public prosecution and court filing liaison wing',
    created_at: now,
  },
];

export const users: User[] = [
  {
    id: IDS.admin,
    employee_id: 'EMP-NCRB-01',
    full_name: 'Sh. Amitabh Kant (System Director - NCRB)',
    email: 'admin@demo.local',
    phone: '9810012345',
    role: 'SYSTEM_ADMIN',
    department_id: IDS.deptCid,
    is_active: true,
    is_verified: true,
    mfa_enabled: true,
    last_login_at: now,
    created_at: now,
  },
  {
    id: IDS.officer,
    employee_id: 'EMP-IO-01',
    full_name: 'Inspector Rajesh Sharma (IO - Women Safety)',
    email: 'officer@demo.local',
    phone: '9810023456',
    role: 'INVESTIGATING_OFFICER',
    department_id: IDS.deptCid,
    is_active: true,
    is_verified: true,
    mfa_enabled: true,
    last_login_at: now,
    created_at: now,
  },
  {
    id: IDS.legal,
    employee_id: 'EMP-LO-01',
    full_name: 'Adv. Sunita Rao (Special Legal Counsel)',
    email: 'legal@demo.local',
    phone: '9810034567',
    role: 'LEGAL_OFFICER',
    department_id: IDS.deptLaw,
    is_active: true,
    is_verified: true,
    mfa_enabled: true,
    last_login_at: now,
    created_at: now,
  },
  {
    id: IDS.prosecutor,
    employee_id: 'EMP-PR-01',
    full_name: 'Adv. Vikramaditya Verma (Public Prosecutor)',
    email: 'prosecutor@demo.local',
    phone: '9810045678',
    role: 'PROSECUTOR',
    department_id: IDS.deptLaw,
    is_active: true,
    is_verified: true,
    mfa_enabled: true,
    last_login_at: now,
    created_at: now,
  },
  {
    id: IDS.auditor,
    employee_id: 'EMP-AUD-01',
    full_name: 'K. S. Murthy (Forensic & Cryptographic Auditor)',
    email: 'auditor@demo.local',
    phone: '9810056789',
    role: 'AUDITOR',
    department_id: IDS.deptCid,
    is_active: true,
    is_verified: true,
    mfa_enabled: true,
    last_login_at: now,
    created_at: now,
  },
  {
    id: IDS.court,
    employee_id: 'EMP-CT-01',
    full_name: 'Registrar M. L. Aggarwal (Sessions Court)',
    email: 'court@demo.local',
    phone: '9810067890',
    role: 'COURT_USER',
    department_id: IDS.deptLaw,
    is_active: true,
    is_verified: true,
    mfa_enabled: true,
    last_login_at: now,
    created_at: now,
  },
  {
    id: IDS.viewer,
    employee_id: 'EMP-VW-01',
    full_name: 'Demo Viewer',
    email: 'viewer@demo.local',
    phone: '0000000000',
    role: 'VIEWER',
    department_id: IDS.deptCid,
    is_active: true,
    is_verified: true,
    mfa_enabled: true,
    last_login_at: now,
    created_at: now,
  },
];

export const DEMO_PASSWORDS: Record<string, string> = {
  'admin@demo.local': 'DemoAdmin!234',
  'officer@demo.local': 'DemoOfficer!234',
  'legal@demo.local': 'DemoLegal!234',
  'prosecutor@demo.local': 'DemoProsecutor!234',
  'auditor@demo.local': 'DemoAuditor!234',
  'court@demo.local': 'DemoCourt!234',
  'viewer@demo.local': 'DemoViewer!234',
};

export const cases: Case[] = [
  {
    id: IDS.case1,
    case_number: 'NCRB-WS-2026-0189',
    title: 'Special Investigation: Cyber Harassment & Extortion Syndicate (PS Connaught Place)',
    description:
      'NCRB Women Safety Division Priority Matter under BNS Sections 72, 79 & IT Act 66E/67A. Fast-track 60-day statutory investigation under BNSS Section 193. Multi-agency custody chain between Delhi Police Cyber Cell and Central Forensic Science Laboratory (CFSL).',
    case_type: 'CRIMINAL_INVESTIGATION',
    status: 'UNDER_INVESTIGATION',
    priority: 'HIGH',
    investigating_department_id: IDS.deptCid,
    created_by: IDS.officer,
    assigned_officer_id: IDS.officer,
    opened_at: '2026-08-12T08:30:00.000Z',
    closed_at: null,
    created_at: '2026-08-12T08:30:00.000Z',
  },
  {
    id: IDS.case2,
    case_number: 'CNR-DLCT01-004521-2026',
    title: 'State vs. Vikrant & Ors (Sessions Court Charge Sheet No. 42/2026)',
    description: 'Court filing and judicial hearing records. Digital evidence admitted under Section 63 Bharatiya Sakshya Adhiniyam.',
    case_type: 'COURT_MATTER',
    status: 'PENDING_REVIEW',
    priority: 'MEDIUM',
    investigating_department_id: IDS.deptLaw,
    created_by: IDS.legal,
    assigned_officer_id: IDS.legal,
    opened_at: '2026-08-20T11:00:00.000Z',
    closed_at: null,
    created_at: '2026-08-20T11:00:00.000Z',
  },
  {
    id: IDS.case3,
    case_number: 'NCRB-CYBER-2026-0091',
    title: 'Critical Infrastructure Data Leak & Forensic Inquiry',
    description: 'Demonstration internal inquiry with restricted classification and auditor visibility.',
    case_type: 'INTERNAL_INQUIRY',
    status: 'OPEN',
    priority: 'CRITICAL',
    investigating_department_id: IDS.deptCid,
    created_by: IDS.admin,
    assigned_officer_id: IDS.officer,
    opened_at: '2026-08-28T09:15:00.000Z',
    closed_at: null,
    created_at: '2026-08-28T09:15:00.000Z',
  },
];

export const caseMembers: CaseMember[] = [
  {
    id: '44444444-dddd-4ddd-8ddd-000000000001',
    case_id: IDS.case1,
    user_id: IDS.officer,
    permission_level: 'OWNER',
    assigned_at: now,
    assigned_by: IDS.officer,
  },
  {
    id: '44444444-dddd-4ddd-8ddd-000000000002',
    case_id: IDS.case1,
    user_id: IDS.legal,
    permission_level: 'EDITOR',
    assigned_at: now,
    assigned_by: IDS.officer,
  },
  {
    id: '44444444-dddd-4ddd-8ddd-000000000003',
    case_id: IDS.case1,
    user_id: IDS.prosecutor,
    permission_level: 'REVIEWER',
    assigned_at: now,
    assigned_by: IDS.officer,
  },
  {
    id: '44444444-dddd-4ddd-8ddd-000000000004',
    case_id: IDS.case2,
    user_id: IDS.legal,
    permission_level: 'OWNER',
    assigned_at: now,
    assigned_by: IDS.legal,
  },
  {
    id: '44444444-dddd-4ddd-8ddd-000000000005',
    case_id: IDS.case2,
    user_id: IDS.court,
    permission_level: 'VIEWER',
    assigned_at: now,
    assigned_by: IDS.legal,
  },
  {
    id: '44444444-dddd-4ddd-8ddd-000000000006',
    case_id: IDS.case3,
    user_id: IDS.admin,
    permission_level: 'OWNER',
    assigned_at: now,
    assigned_by: IDS.admin,
  },
  {
    id: '44444444-dddd-4ddd-8ddd-000000000007',
    case_id: IDS.case3,
    user_id: IDS.auditor,
    permission_level: 'REVIEWER',
    assigned_at: now,
    assigned_by: IDS.admin,
  },
];

export interface DemoDocumentBundle {
  document: DocumentItem;
  version: DocumentVersion;
  mediaKind: 'pdf' | 'image' | 'audio' | 'video' | 'text';
  ocr?: string;
}

const hash = (seed: string) =>
  Array.from(seed)
    .reduce((acc, ch, i) => acc + ch.charCodeAt(0).toString(16) + i.toString(16), '')
    .padEnd(64, '0')
    .slice(0, 64);

function doc(
  n: number,
  caseId: string,
  number: string,
  title: string,
  type: DocumentItem['document_type'],
  classification: DocumentItem['classification'],
  uploader: string,
  isEvidence: boolean,
  mediaKind: DemoDocumentBundle['mediaKind'],
  mime: string,
  filename: string
): DemoDocumentBundle {
  const id = `55555555-eeee-4eee-8eee-${String(n).padStart(12, '0')}`;
  const vid = `66666666-ffff-4fff-8fff-${String(n).padStart(12, '0')}`;
  return {
    mediaKind,
    ocr: `fictional demo ocr ${number} ${title}`.toLowerCase(),
    document: {
      id,
      case_id: caseId,
      document_number: number,
      title,
      description: 'Fictional sample exhibit. Contains no real identities.',
      document_type: type,
      classification,
      status: 'ACTIVE',
      current_version_id: vid,
      uploaded_by: uploader,
      owner_department_id: uploader === IDS.legal ? IDS.deptLaw : IDS.deptCid,
      retention_until: '2031-09-01',
      is_evidence: isEvidence,
      created_at: now,
    },
    version: {
      id: vid,
      document_id: id,
      version_number: 1,
      original_filename: filename,
      mime_type: mime,
      file_size: 24832 + n * 128,
      sha256_hash: hash(`${number}-${title}`),
      uploaded_by: uploader,
      change_reason: 'Initial intake',
      virus_scan_status: 'CLEAN',
      ocr_status: mediaKind === 'pdf' || mediaKind === 'text' ? 'COMPLETED' : 'NOT_REQUESTED',
      created_at: now,
    },
  };
}

export const documentBundles: DemoDocumentBundle[] = [
  doc(1, IDS.case1, 'DOC-FIR-001', 'FIR No. 104/2026 - PS Connaught Place (Zero FIR under Sec 173 BNSS)', 'FIR', 'CONFIDENTIAL', IDS.officer, true, 'pdf', 'application/pdf', 'DOC-FIR-001.pdf'),
  doc(2, IDS.case1, 'DOC-WIT-002', 'Witness Statement under Sec 161 BNSS - Smt. Priyadarshini (Protected)', 'WITNESS_STATEMENT', 'RESTRICTED', IDS.officer, false, 'pdf', 'application/pdf', 'DOC-WIT-002.pdf'),
  doc(3, IDS.case1, 'DOC-IMG-003', 'CCTV Footage Still - Front Gate Camera 04 (Spot Panchnama Corroboration)', 'EVIDENCE_RECORD', 'CONFIDENTIAL', IDS.officer, true, 'image', 'image/svg+xml', 'DOC-IMG-003.svg'),
  doc(4, IDS.case1, 'DOC-AUD-004', 'Emergency Helpline 112 Control Room Audio Dispatch Recording', 'EVIDENCE_RECORD', 'RESTRICTED', IDS.officer, true, 'audio', 'audio/wav', 'DOC-AUD-004.wav'),
  doc(5, IDS.case1, 'DOC-VID-005', 'Perimeter CCTV Surveillance Clip - Exhibit A-4', 'EVIDENCE_RECORD', 'RESTRICTED', IDS.officer, true, 'video', 'video/mp4', 'DOC-VID-005.mp4'),
  doc(6, IDS.case1, 'DOC-FOR-006', 'CFSL Digital Forensic Extraction & Hash Worksheet (Ref: CFSL/DEL/2026/902)', 'FORENSIC_REPORT', 'CONFIDENTIAL', IDS.officer, false, 'pdf', 'application/pdf', 'DOC-FOR-006.pdf'),
  doc(7, IDS.case1, 'DOC-CHG-007', 'Final Police Report / Charge Sheet under Section 193 BNSS', 'CHARGE_SHEET', 'CONFIDENTIAL', IDS.prosecutor, false, 'pdf', 'application/pdf', 'DOC-CHG-007.pdf'),
  doc(8, IDS.case2, 'DOC-NTC-008', 'Judicial Summons Notice - Hon ble Court of Metropolitan Magistrate', 'LEGAL_NOTICE', 'INTERNAL', IDS.legal, false, 'pdf', 'application/pdf', 'DOC-NTC-008.pdf'),
  doc(9, IDS.case2, 'DOC-CRT-009', 'Section 63 BSA Digital Evidence Admissibility Index Certificate', 'COURT_FILING', 'INTERNAL', IDS.legal, false, 'text', 'text/plain', 'DOC-CRT-009.txt'),
  doc(10, IDS.case3, 'DOC-INQ-010', 'NCRB Inter-Agency Chain of Custody & Security Audit Memorandum', 'INVESTIGATION_RECORD', 'RESTRICTED', IDS.admin, false, 'pdf', 'application/pdf', 'DOC-INQ-010.pdf'),
];

export const documents: DocumentItem[] = documentBundles.map((b) => b.document);
export const versions: DocumentVersion[] = documentBundles.map((b) => b.version);

export const permissions: DocumentPermissionItem[] = [
  {
    id: '77777777-aaaa-4aaa-8aaa-000000000001',
    document_id: documentBundles[0].document.id,
    user_id: IDS.viewer,
    role: null,
    permission_type: 'VIEW',
    expires_at: '2026-10-01T00:00:00.000Z',
    granted_by: IDS.officer,
    created_at: now,
  },
];

export const comments: CommentItem[] = [
  {
    id: '88888888-bbbb-4bbb-8bbb-000000000001',
    document_id: documentBundles[0].document.id,
    version_id: documentBundles[0].version.id,
    user_id: IDS.prosecutor,
    content: 'Demo annotation: request additional fictional exhibits before charge review.',
    page_number: 1,
    is_resolved: false,
    created_at: now,
  },
];

export const evidenceItems: EvidenceItem[] = [
  {
    id: '99999999-cccc-4ccc-8ccc-000000000001',
    case_id: IDS.case1,
    document_id: documentBundles[0].document.id,
    evidence_number: 'EVD-001',
    description: 'Fictional sealed envelope labeled Exhibit A (empty demo artifact).',
    collected_by: IDS.officer,
    collected_at: '2026-08-12T07:10:00.000Z',
    location_collected: 'Demo station lockup',
    current_custodian: IDS.officer,
    status: 'IN_CUSTODY',
    created_at: '2026-08-12T07:10:00.000Z',
  },
  {
    id: '99999999-cccc-4ccc-8ccc-000000000002',
    case_id: IDS.case1,
    document_id: documentBundles[2].document.id,
    evidence_number: 'EVD-002',
    description: 'Fictional CCTV still printed and hashed at intake.',
    collected_by: IDS.officer,
    collected_at: '2026-08-12T09:40:00.000Z',
    location_collected: 'Demo parking compound',
    current_custodian: IDS.legal,
    status: 'TRANSFERRED',
    created_at: '2026-08-12T09:40:00.000Z',
  },
  {
    id: '99999999-cccc-4ccc-8ccc-000000000003',
    case_id: IDS.case3,
    document_id: documentBundles[9].document.id,
    evidence_number: 'EVD-010',
    description: 'Fictional internal memo packet logged for inquiry.',
    collected_by: IDS.admin,
    collected_at: '2026-08-28T10:00:00.000Z',
    location_collected: 'HQ records room',
    current_custodian: IDS.auditor,
    status: 'IN_CUSTODY',
    created_at: '2026-08-28T10:00:00.000Z',
  },
];

export const custodyHistory: CustodyTransfer[] = [
  {
    id: 'aaaaaaaa-dddd-4ddd-8ddd-000000000001',
    evidence_item_id: evidenceItems[0].id,
    from_user_id: IDS.officer,
    to_user_id: IDS.officer,
    transferred_at: '2026-08-12T07:10:00.000Z',
    reason: 'Initial collection logged',
    location: 'Demo station',
    notes: 'Sealed in presence of duty officer (fictional).',
    digital_signature_reference: 'SIG-DEMO-001',
    created_at: '2026-08-12T07:10:00.000Z',
  },
  {
    id: 'aaaaaaaa-dddd-4ddd-8ddd-000000000002',
    evidence_item_id: evidenceItems[1].id,
    from_user_id: IDS.officer,
    to_user_id: IDS.legal,
    transferred_at: '2026-08-18T14:22:00.000Z',
    reason: 'Legal review of visual exhibit',
    location: 'Law wing evidence desk',
    notes: null,
    digital_signature_reference: 'SIG-DEMO-002',
    created_at: '2026-08-18T14:22:00.000Z',
  },
];

export const signatures: SignatureOut[] = [
  {
    id: 'bbbbbbbb-eeee-4eee-8eee-000000000001',
    document_id: documentBundles[0].document.id,
    version_id: documentBundles[0].version.id,
    signer_id: IDS.officer,
    document_hash: documentBundles[0].version.sha256_hash,
    algorithm: 'SHA256-MOCK',
    is_mock: true,
    signed_at: now,
  },
];

function audit(
  i: number,
  action: string,
  entity_type: string,
  entity_id: string,
  actor: string,
  case_id: string | null
): AuditLog {
  const prev = i === 1 ? '0'.repeat(64) : hash(`prev-${i - 1}`);
  const event = hash(`evt-${i}-${action}`);
  return {
    id: `cccccccc-ffff-4fff-8fff-${String(i).padStart(12, '0')}`,
    event_id: `evt-${i}`,
    actor_user_id: actor,
    action,
    entity_type,
    entity_id,
    case_id,
    timestamp: now,
    ip_address: '10.0.0.12',
    metadata_json: { demo: true },
    previous_event_hash: prev,
    event_hash: event,
  };
}

export const auditLogs: AuditLog[] = [
  audit(1, 'LOGIN', 'user', IDS.officer, IDS.officer, null),
  audit(2, 'DOCUMENT_VIEW', 'document', documentBundles[0].document.id, IDS.officer, IDS.case1),
  audit(3, 'DOCUMENT_DOWNLOAD', 'document', documentBundles[2].document.id, IDS.legal, IDS.case1),
  audit(4, 'CUSTODY_TRANSFER', 'evidence', evidenceItems[1].id, IDS.officer, IDS.case1),
  audit(5, 'CASE_UPDATE', 'case', IDS.case2, IDS.legal, IDS.case2),
  audit(6, 'INTEGRITY_VERIFY', 'document', documentBundles[5].document.id, IDS.auditor, IDS.case1),
];

export function userDisplayName(id: string): string {
  return users.find((u) => u.id === id)?.full_name ?? id.slice(0, 8);
}
