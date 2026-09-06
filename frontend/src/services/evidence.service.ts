import { api } from './api';
import {
  CustodyTransfer,
  CustodyTransferCreatePayload,
  EvidenceCreatePayload,
  EvidenceItem,
  PaginatedResponse,
} from '@/types';

export const evidenceService = {
  createEvidence: async (
    caseId: string,
    payload: EvidenceCreatePayload
  ): Promise<EvidenceItem> => {
    const res = await api.post<EvidenceItem>(`/cases/${caseId}/evidence`, payload);
    return res.data;
  },

  listCaseEvidence: async (
    caseId: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<EvidenceItem>> => {
    const res = await api.get<PaginatedResponse<EvidenceItem>>(`/cases/${caseId}/evidence`, {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  getEvidence: async (evidenceId: string): Promise<EvidenceItem> => {
    const res = await api.get<EvidenceItem>(`/evidence/${evidenceId}`);
    return res.data;
  },

  transferCustody: async (
    evidenceId: string,
    payload: CustodyTransferCreatePayload
  ): Promise<CustodyTransfer> => {
    const res = await api.post<CustodyTransfer>(`/evidence/${evidenceId}/transfer`, payload);
    return res.data;
  },

  getCustodyHistory: async (
    evidenceId: string,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<CustodyTransfer>> => {
    const res = await api.get<PaginatedResponse<CustodyTransfer>>(
      `/evidence/${evidenceId}/custody-history`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return res.data;
  },
};
