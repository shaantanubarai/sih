import { api } from './api';
import { AuditLog, AuditVerifyOut, PaginatedResponse } from '@/types';

export const auditService = {
  listAuditLogs: async (
    page = 1,
    pageSize = 30
  ): Promise<PaginatedResponse<AuditLog>> => {
    const res = await api.get<PaginatedResponse<AuditLog>>('/audit-logs', {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  listEntityAudit: async (
    entityType: string,
    entityId: string,
    page = 1,
    pageSize = 30
  ): Promise<PaginatedResponse<AuditLog>> => {
    const res = await api.get<PaginatedResponse<AuditLog>>(
      `/audit-logs/${entityType}/${entityId}`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return res.data;
  },

  verifyAuditChain: async (): Promise<AuditVerifyOut> => {
    const res = await api.post<AuditVerifyOut>('/audit-logs/verify-integrity');
    return res.data;
  },
};
