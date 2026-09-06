import { api } from './api';
import {
  DocumentItem,
  DocumentPermissionItem,
  DocumentVersion,
  IntegrityVerificationResult,
  PaginatedResponse,
  PermissionType,
} from '@/types';

export interface DocumentUploadParams {
  file: File;
  document_number: string;
  title: string;
  document_type: string;
  description?: string;
  classification?: string;
  is_evidence?: boolean;
  tags?: string;
  change_reason?: string;
}

export const documentsService = {
  createDocument: async (
    caseId: string,
    params: DocumentUploadParams,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<{ document: DocumentItem; version: DocumentVersion }> => {
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('document_number', params.document_number);
    formData.append('title', params.title);
    formData.append('document_type', params.document_type);
    if (params.description) formData.append('description', params.description);
    if (params.classification) formData.append('classification', params.classification);
    formData.append('is_evidence', String(params.is_evidence ?? false));
    if (params.tags) formData.append('tags', params.tags);
    if (params.change_reason) formData.append('change_reason', params.change_reason);

    const res = await api.post<{ document: DocumentItem; version: DocumentVersion }>(
      `/cases/${caseId}/documents`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
      }
    );
    return res.data;
  },

  listCaseDocuments: async (
    caseId: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<DocumentItem>> => {
    const res = await api.get<PaginatedResponse<DocumentItem>>(`/cases/${caseId}/documents`, {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  getDocument: async (documentId: string): Promise<DocumentItem> => {
    const res = await api.get<DocumentItem>(`/documents/${documentId}`);
    return res.data;
  },

  updateMetadata: async (
    documentId: string,
    payload: {
      title?: string;
      description?: string;
      classification?: string;
      status?: string;
      tags?: string[];
    }
  ): Promise<DocumentItem> => {
    const res = await api.patch<DocumentItem>(`/documents/${documentId}/metadata`, payload);
    return res.data;
  },

  addVersion: async (
    documentId: string,
    file: File,
    changeReason?: string,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<DocumentVersion> => {
    const formData = new FormData();
    formData.append('file', file);
    if (changeReason) formData.append('change_reason', changeReason);

    const res = await api.post<DocumentVersion>(`/documents/${documentId}/versions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
    return res.data;
  },

  listVersions: async (
    documentId: string,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<DocumentVersion>> => {
    const res = await api.get<PaginatedResponse<DocumentVersion>>(
      `/documents/${documentId}/versions`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return res.data;
  },

  getVersion: async (documentId: string, versionId: string): Promise<DocumentVersion> => {
    const res = await api.get<DocumentVersion>(`/documents/${documentId}/versions/${versionId}`);
    return res.data;
  },

  downloadDocument: async (
    documentId: string,
    versionId?: string
  ): Promise<{ data: Blob; filename: string; contentType: string }> => {
    const res = await api.get(`/documents/${documentId}/download`, {
      params: versionId ? { version_id: versionId } : undefined,
      responseType: 'blob',
    });

    const disposition = res.headers['content-disposition'] || '';
    let filename = `document-${documentId}.bin`;
    const filenameMatch = disposition.match(/filename=["']?([^"';]+)["']?/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1];
    }

    return {
      data: res.data,
      filename,
      contentType: String(res.headers['content-type'] || 'application/octet-stream'),
    };
  },

  verifyIntegrity: async (
    documentId: string,
    versionId?: string
  ): Promise<IntegrityVerificationResult> => {
    const res = await api.get<IntegrityVerificationResult>(
      `/documents/${documentId}/verify-integrity`,
      {
        params: versionId ? { version_id: versionId } : undefined,
      }
    );
    return res.data;
  },

  listPermissions: async (
    documentId: string,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<DocumentPermissionItem>> => {
    const res = await api.get<PaginatedResponse<DocumentPermissionItem>>(
      `/documents/${documentId}/permissions`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return res.data;
  },

  grantPermission: async (
    documentId: string,
    payload: {
      user_id?: string;
      role?: string;
      permission_type: PermissionType;
      expires_at?: string;
    }
  ): Promise<DocumentPermissionItem> => {
    const res = await api.post<DocumentPermissionItem>(
      `/documents/${documentId}/permissions`,
      payload
    );
    return res.data;
  },

  revokePermission: async (documentId: string, permissionId: string): Promise<void> => {
    await api.delete(`/documents/${documentId}/permissions/${permissionId}`);
  },
};
