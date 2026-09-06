// @ts-nocheck
// Prototype-only in-memory transport; axios-mock-adapter callback declarations
// differ between axios releases, while production service calls remain typed.
import type { InternalAxiosRequestConfig } from 'axios';
import MockAdapter from 'axios-mock-adapter';
import type { PaginatedResponse, User } from '@/types';
import { api } from '@/services/api';
import {
  DEMO_MFA_CODE,
  DEMO_PASSWORDS,
  auditLogs,
  caseMembers,
  cases,
  comments,
  custodyHistory,
  departments,
  documentBundles,
  documents,
  evidenceItems,
  permissions,
  signatures,
  users,
  versions,
} from './data';
import { demoSvgImage, demoText, miniPdf, placeholderVideo, silentWav } from './media';

const store = {
  users: [...users],
  cases: [...cases],
  members: [...caseMembers],
  documents: [...documents],
  versions: [...versions],
  comments: [...comments],
  evidence: [...evidenceItems],
  custody: [...custodyHistory],
  audit: [...auditLogs],
  permissions: [...permissions],
  signatures: [...signatures],
  departments: [...departments],
};

let sessionUserId: string | null = null;

function paginate<T>(items: T[], page = 1, pageSize = 20): PaginatedResponse<T> {
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    page_size: pageSize,
  };
}

function bearerUser(config: InternalAxiosRequestConfig): User | null {
  const header = String(config.headers?.Authorization || '');
  const token = header.replace(/^Bearer\s+/i, '');
  if (!token.startsWith('mock-access-')) {
    if (sessionUserId) return store.users.find((u) => u.id === sessionUserId) ?? null;
    return store.users[1] ?? null;
  }
  const email = token.replace('mock-access-', '');
  return store.users.find((u) => u.email === email) ?? store.users[1] ?? null;
}

function requireUser(config: InternalAxiosRequestConfig): User | null {
  return bearerUser(config);
}

function unauthorized() {
  return [401, { error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } }];
}

function forbidden(msg = 'Insufficient clearance for this resource.') {
  return [403, { error: { code: 'FORBIDDEN', message: msg } }];
}

const ROLE_AUTH_MAP: Record<string, number> = {
  SYSTEM_ADMIN: 100,
  INVESTIGATING_OFFICER: 80,
  LEGAL_OFFICER: 60,
  PROSECUTOR: 60,
  COURT_USER: 40,
  AUDITOR: 40,
  VIEWER: 10,
};

const CLASS_MIN_AUTH: Record<string, number> = {
  PUBLIC: 10,
  INTERNAL: 40,
  CONFIDENTIAL: 60,
  RESTRICTED: 80,
};

function userAuthority(user: User | null): number {
  if (!user) return 0;
  return ROLE_AUTH_MAP[user.role] ?? 10;
}

function canUserAccessClassification(user: User | null, classification: string): boolean {
  if (!user) return false;
  if (user.role === 'SYSTEM_ADMIN') return true;
  const minReq = CLASS_MIN_AUTH[classification] ?? 10;
  return userAuthority(user) >= minReq;
}

function mediaFor(documentId: string): Blob {
  const bundle = documentBundles.find((b) => b.document.id === documentId);
  if (!bundle) return new Blob(['missing']);
  switch (bundle.mediaKind) {
    case 'image':
      return demoSvgImage(bundle.document.title);
    case 'audio':
      return silentWav(3);
    case 'video':
      return placeholderVideo();
    case 'text':
      return demoText(bundle.document.title);
    default:
      return miniPdf(bundle.document.title);
  }
}

function query(config: InternalAxiosRequestConfig): Record<string, string> {
  const params = (config.params || {}) as Record<string, string | number | undefined>;
  const out: Record<string, string> = {};
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) out[k] = String(v);
  });
  return out;
}

export function installApiMocks(): MockAdapter | null {
  if (import.meta.env.VITE_USE_MOCKS === 'false') {
    return null;
  }

  const mock = new MockAdapter(api, { delayResponse: 180, onNoMatch: 'passthrough' });

  mock.onPost('/auth/login').reply((config) => {
    const body = JSON.parse(config.data || '{}') as { email?: string; password?: string; mfa_code?: string };
    const user = store.users.find((u) => u.email === body.email);
    if (!user || DEMO_PASSWORDS[user.email] !== body.password) {
      return [401, { error: { code: 'INVALID', message: 'Invalid authentication credentials or disabled account.' } }];
    }
    if (!body.mfa_code) {
      return [
        200,
        { access_token: '', refresh_token: '', token_type: 'bearer', mfa_required: true },
      ];
    }
    if (body.mfa_code !== DEMO_MFA_CODE) {
      return [401, { error: { code: 'MFA_INVALID', message: 'Invalid authenticator code. Demo code is 123456.' } }];
    }
    sessionUserId = user.id;
    return [
      200,
      {
        access_token: `mock-access-${user.email}`,
        refresh_token: `mock-refresh-${user.email}`,
        token_type: 'bearer',
        mfa_required: false,
      },
    ];
  });

  mock.onPost('/auth/refresh').reply((config) => {
    const body = JSON.parse(config.data || '{}') as { refresh_token?: string };
    const email = (body.refresh_token || '').replace('mock-refresh-', '');
    const user = store.users.find((u) => u.email === email);
    if (!user) return unauthorized();
    sessionUserId = user.id;
    return [
      200,
      {
        access_token: `mock-access-${user.email}`,
        refresh_token: `mock-refresh-${user.email}`,
        token_type: 'bearer',
      },
    ];
  });

  mock.onPost('/auth/logout').reply(() => {
    sessionUserId = null;
    return [204];
  });

  mock.onGet('/auth/me').reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    return [200, user];
  });

  mock.onPost('/auth/change-password').reply((config) => {
    if (!requireUser(config)) return unauthorized();
    return [204];
  });

  mock.onGet('/users').reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'AUDITOR') return forbidden();
    const q = query(config);
    return [200, paginate(store.users, Number(q.page || 1), Number(q.page_size || 30))];
  });

  mock.onPatch(/\/users\/.+\/status$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN') return forbidden();
    const id = config.url?.split('/')[2];
    const target = store.users.find((u) => u.id === id);
    if (!target) return [404, { error: { code: 'NOT_FOUND', message: 'User not found.' } }];
    const body = JSON.parse(config.data || '{}');
    Object.assign(target, body);
    return [200, target];
  });

  mock.onGet(/\/users\/.+/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    const id = config.url?.split('/')[2];
    const found = store.users.find((u) => u.id === id);
    if (!found) return [404, { error: { code: 'NOT_FOUND', message: 'User not found.' } }];
    return [200, found];
  });

  mock.onGet('/departments').reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    const q = query(config);
    return [200, paginate(store.departments, Number(q.page || 1), Number(q.page_size || 50))];
  });

  mock.onPost('/departments').reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN') return forbidden();
    const body = JSON.parse(config.data || '{}');
    const dept = {
      id: crypto.randomUUID(),
      name: body.name,
      code: body.code,
      description: body.description ?? null,
      created_at: new Date().toISOString(),
    };
    store.departments.push(dept);
    return [201, dept];
  });

  mock.onGet('/cases').reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    const q = query(config);
    return [200, paginate(store.cases, Number(q.page || 1), Number(q.page_size || 20))];
  });

  mock.onPost('/cases').reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'INVESTIGATING_OFFICER') {
      return forbidden();
    }
    const body = JSON.parse(config.data || '{}');
    const created = {
      id: crypto.randomUUID(),
      case_number: body.case_number,
      title: body.title,
      description: body.description ?? null,
      case_type: body.case_type,
      status: 'OPEN' as const,
      priority: body.priority ?? 'MEDIUM',
      investigating_department_id: body.investigating_department_id ?? user.department_id,
      created_by: user.id,
      assigned_officer_id: body.assigned_officer_id ?? user.id,
      opened_at: new Date().toISOString(),
      closed_at: null,
      created_at: new Date().toISOString(),
    };
    store.cases.unshift(created);
    return [201, created];
  });

  mock.onGet(/\/cases\/[^/]+\/summary(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    const caseId = config.url?.split('?')[0]?.split('/')[2];
    const c = store.cases.find((x) => x.id === caseId);
    if (!c) return [404, { error: { code: 'NOT_FOUND', message: 'Case not found.' } }];
    return [
      200,
      {
        case: c,
        document_count: store.documents.filter((d) => d.case_id === caseId).length,
        evidence_count: store.evidence.filter((e) => e.case_id === caseId).length,
        member_count: store.members.filter((m) => m.case_id === caseId).length,
      },
    ];
  });

  mock.onGet(/\/cases\/[^/]+\/documents(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const caseId = config.url?.split('?')[0]?.split('/')[2];
    const q = query(config);
    const items = store.documents.filter((d) => d.case_id === caseId);
    return [200, paginate(items, Number(q.page || 1), Number(q.page_size || 20))];
  });

  mock.onPost(/\/cases\/[^/]+\/documents(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'INVESTIGATING_OFFICER') {
      return forbidden();
    }
    const caseId = config.url?.split('?')[0]?.split('/')[2] as string;
    const id = crypto.randomUUID();
    const vid = crypto.randomUUID();

    let title = 'Uploaded exhibit';
    let document_number = `DOC-UPL-${id.slice(0, 6).toUpperCase()}`;
    let description = 'Uploaded file';
    let document_type: any = 'OTHER';
    let classification: any = 'CONFIDENTIAL';
    let is_evidence = false;
    let original_filename = 'upload.bin';
    let mime_type = 'application/octet-stream';
    let file_size = 1024;

    if (config.data instanceof FormData) {
      title = (config.data.get('title') as string) || title;
      document_number = (config.data.get('document_number') as string) || document_number;
      description = (config.data.get('description') as string) || description;
      document_type = (config.data.get('document_type') as any) || document_type;
      classification = (config.data.get('classification') as any) || classification;
      is_evidence = config.data.get('is_evidence') === 'true' || config.data.get('is_evidence') === true;
      const file = config.data.get('file');
      if (file && typeof file === 'object' && 'name' in file) {
        original_filename = (file as File).name || original_filename;
        mime_type = (file as File).type || mime_type;
        file_size = (file as File).size || file_size;
      }
    } else if (config.data && typeof config.data === 'object') {
      title = config.data.title || title;
      document_number = config.data.document_number || document_number;
      description = config.data.description || description;
      document_type = config.data.document_type || document_type;
      classification = config.data.classification || classification;
      is_evidence = Boolean(config.data.is_evidence);
    }

    const document = {
      id,
      case_id: caseId,
      document_number,
      title,
      description,
      document_type,
      classification,
      status: 'ACTIVE' as const,
      current_version_id: vid,
      uploaded_by: user.id,
      owner_department_id: user.department_id,
      retention_until: null,
      is_evidence,
      created_at: new Date().toISOString(),
    };
    const version = {
      id: vid,
      document_id: id,
      version_number: 1,
      original_filename,
      mime_type,
      file_size,
      sha256_hash: 'a'.repeat(64),
      uploaded_by: user.id,
      change_reason: 'Upload',
      virus_scan_status: 'CLEAN' as const,
      ocr_status: 'QUEUED' as const,
      created_at: new Date().toISOString(),
    };
    store.documents.unshift(document);
    store.versions.unshift(version);
    return [201, { document, version }];
  });

  mock.onGet(/\/cases\/[^/]+\/evidence(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const caseId = config.url?.split('?')[0]?.split('/')[2];
    const items = store.evidence.filter((e) => e.case_id === caseId);
    return [200, paginate(items, 1, 50)];
  });

  mock.onPost(/\/cases\/[^/]+\/evidence(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'INVESTIGATING_OFFICER') {
      return forbidden();
    }
    const caseId = config.url?.split('?')[0]?.split('/')[2] as string;
    const body = JSON.parse(config.data || '{}');
    const item = {
      id: crypto.randomUUID(),
      case_id: caseId,
      document_id: body.document_id ?? null,
      evidence_number: body.evidence_number,
      description: body.description,
      collected_by: user.id,
      collected_at: body.collected_at,
      location_collected: body.location_collected ?? null,
      current_custodian: user.id,
      status: 'COLLECTED' as const,
      created_at: new Date().toISOString(),
    };
    store.evidence.unshift(item);
    return [201, item];
  });

  mock.onGet(/\/cases\/[^/]+\/members(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const caseId = config.url?.split('?')[0]?.split('/')[2];
    const items = store.members.filter((m) => m.case_id === caseId);
    return [200, paginate(items, 1, 50)];
  });

  mock.onPost(/\/cases\/[^/]+\/close(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'INVESTIGATING_OFFICER') {
      return forbidden();
    }
    const caseId = config.url?.split('?')[0]?.split('/')[2];
    const c = store.cases.find((x) => x.id === caseId);
    if (!c) return [404, { error: { code: 'NOT_FOUND', message: 'Case not found.' } }];
    c.status = 'CLOSED';
    c.closed_at = new Date().toISOString();
    return [200, c];
  });

  mock.onGet(/\/cases\/[^/]+(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const caseId = config.url?.split('?')[0]?.split('/')[2];
    const c = store.cases.find((x) => x.id === caseId);
    if (!c) return [404, { error: { code: 'NOT_FOUND', message: 'Case not found.' } }];
    return [200, c];
  });

  mock.onPatch(/\/cases\/[^/]+(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'INVESTIGATING_OFFICER') {
      return forbidden();
    }
    const caseId = config.url?.split('?')[0]?.split('/')[2];
    const c = store.cases.find((x) => x.id === caseId);
    if (!c) return [404, { error: { code: 'NOT_FOUND', message: 'Case not found.' } }];
    Object.assign(c, JSON.parse(config.data || '{}'));
    return [200, c];
  });

  mock.onGet('/search/documents').reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const q = query(config);
    let items = [...store.documents];
    if (q.title) items = items.filter((d) => d.title.toLowerCase().includes(q.title.toLowerCase()));
    if (q.document_type) items = items.filter((d) => d.document_type === q.document_type);
    if (q.classification) items = items.filter((d) => d.classification === q.classification);
    if (q.ocr_text) {
      items = items.filter((d) => {
        const bundle = documentBundles.find((b) => b.document.id === d.id);
        return bundle?.ocr?.includes(q.ocr_text.toLowerCase());
      });
    }
    return [200, paginate(items, Number(q.page || 1), Number(q.page_size || 15))];
  });

  mock.onGet(/\/documents\/[^/]+\/versions(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    const id = config.url?.split('?')[0]?.split('/')[2];
    const doc = store.documents.find((d) => d.id === id);
    if (doc && !canUserAccessClassification(user, doc.classification)) {
      return forbidden();
    }
    const items = store.versions.filter((v) => v.document_id === id);
    return [200, paginate(items, 1, 50)];
  });

  mock.onGet(/\/documents\/[^/]+\/comments(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    const id = config.url?.split('?')[0]?.split('/')[2];
    const doc = store.documents.find((d) => d.id === id);
    if (doc && !canUserAccessClassification(user, doc.classification)) {
      return forbidden();
    }
    const items = store.comments.filter((c) => c.document_id === id);
    return [200, paginate(items, 1, 50)];
  });

  mock.onPost(/\/documents\/[^/]+\/comments(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role === 'VIEWER') return forbidden();
    const id = config.url?.split('?')[0]?.split('/')[2] as string;
    const body = JSON.parse(config.data || '{}');
    const comment = {
      id: crypto.randomUUID(),
      document_id: id,
      version_id: body.version_id ?? null,
      user_id: user.id,
      content: body.content,
      page_number: body.page_number ?? null,
      is_resolved: false,
      created_at: new Date().toISOString(),
    };
    store.comments.push(comment);
    return [201, comment];
  });

  mock.onGet(/\/documents\/[^/]+\/signatures(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const id = config.url?.split('?')[0]?.split('/')[2];
    const items = store.signatures.filter((s) => s.document_id === id);
    return [
      200,
      { items, disclaimer: 'Demo signatures are mock attestations and are not legally binding.' },
    ];
  });

  mock.onGet(/\/documents\/[^/]+\/permissions(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const id = config.url?.split('?')[0]?.split('/')[2];
    const items = store.permissions.filter((p) => p.document_id === id);
    return [200, paginate(items, 1, 50)];
  });

  mock.onGet(/\/documents\/[^/]+\/verify-integrity(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const id = config.url?.split('?')[0]?.split('/')[2];
    const version = store.versions.find((v) => v.document_id === id);
    if (!version) return [404, { error: { code: 'NOT_FOUND', message: 'Version not found.' } }];
    return [
      200,
      {
        document_id: id,
        version_id: version.id,
        stored_sha256: version.sha256_hash,
        computed_sha256: version.sha256_hash,
        matches: true,
      },
    ];
  });

  mock.onGet(/\/documents\/[^/]+\/download(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    // Viewers cannot download files
    if (user.role === 'VIEWER') {
      return forbidden('Viewer role does not have authorization to download forensic files.');
    }
    const id = config.url?.split('?')[0]?.split('/')[2] as string;
    const doc = store.documents.find((d) => d.id === id);
    if (doc && !canUserAccessClassification(user, doc.classification)) {
      return forbidden(`Authority Level (${userAuthority(user)}) is insufficient for ${doc.classification} documents.`);
    }
    const blob = mediaFor(id);
    const version = store.versions.find((v) => v.document_id === id);
    return [
      200,
      blob,
      {
        'content-type': version?.mime_type || blob.type,
        'content-disposition': `attachment; filename="${version?.original_filename || 'file.bin'}"`,
      },
    ];
  });

  mock.onGet(/\/documents\/[^/]+(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    const id = config.url?.split('?')[0]?.split('/')[2];
    const doc = store.documents.find((d) => d.id === id);
    if (!doc) return [404, { error: { code: 'NOT_FOUND', message: 'Document not found.' } }];
    if (!canUserAccessClassification(user, doc.classification)) {
      return forbidden(`Access Denied: Your authority level (${userAuthority(user)}) does not grant clearance to inspect ${doc.classification} records.`);
    }
    return [200, doc];
  });

  mock.onGet(/\/evidence\/[^/]+\/custody-history(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const id = config.url?.split('?')[0]?.split('/')[2];
    const items = store.custody.filter((c) => c.evidence_item_id === id);
    return [200, paginate(items, 1, 50)];
  });

  mock.onPost(/\/evidence\/[^/]+\/transfer(\?.*)?$/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'INVESTIGATING_OFFICER') {
      return forbidden();
    }
    const id = config.url?.split('?')[0]?.split('/')[2] as string;
    const body = JSON.parse(config.data || '{}');
    const ev = store.evidence.find((e) => e.id === id);
    if (!ev) return [404, { error: { code: 'NOT_FOUND', message: 'Evidence not found.' } }];
    const transfer = {
      id: crypto.randomUUID(),
      evidence_item_id: id,
      from_user_id: ev.current_custodian,
      to_user_id: body.to_user_id,
      transferred_at: new Date().toISOString(),
      reason: body.reason,
      location: body.location ?? null,
      notes: body.notes ?? null,
      digital_signature_reference: body.digital_signature_reference ?? 'SIG-DEMO-LIVE',
      created_at: new Date().toISOString(),
    };
    ev.current_custodian = body.to_user_id;
    ev.status = 'TRANSFERRED';
    store.custody.push(transfer);
    return [201, transfer];
  });

  mock.onGet(/\/evidence\/[^/]+(\?.*)?$/).reply((config) => {
    if (!requireUser(config)) return unauthorized();
    const id = config.url?.split('?')[0]?.split('/')[2];
    const ev = store.evidence.find((e) => e.id === id);
    if (!ev) return [404, { error: { code: 'NOT_FOUND', message: 'Evidence not found.' } }];
    return [200, ev];
  });

  mock.onGet('/audit-logs').reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    if (user.role !== 'SYSTEM_ADMIN' && user.role !== 'AUDITOR') return forbidden();
    const q = query(config);
    return [200, paginate(store.audit, Number(q.page || 1), Number(q.page_size || 30))];
  });

  mock.onPost('/audit-logs/verify-integrity').reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    return [200, { valid: true, events_checked: store.audit.length, broken_at_index: null }];
  });

  mock.onGet(/\/audit-logs\/.+/).reply((config) => {
    const user = requireUser(config);
    if (!user) return unauthorized();
    const parts = config.url?.split('/') || [];
    const entityId = parts[3];
    const items = store.audit.filter((a) => a.entity_id === entityId);
    return [200, paginate(items, 1, 30)];
  });

  return mock;
}
