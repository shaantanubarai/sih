import { api } from './api';
import {
  Case,
  CaseCreatePayload,
  CaseMember,
  CaseSummary,
  CaseUpdatePayload,
  MemberCreatePayload,
  PaginatedResponse,
} from '@/types';

export interface CaseFilterParams {
  page?: number;
  page_size?: number;
  status?: string;
  case_type?: string;
  priority?: string;
  search?: string;
}

export const casesService = {
  listCases: async (params?: CaseFilterParams): Promise<PaginatedResponse<Case>> => {
    const res = await api.get<PaginatedResponse<Case>>('/cases', {
      params: {
        page: params?.page || 1,
        page_size: params?.page_size || 20,
      },
    });
    return res.data;
  },

  getCase: async (caseId: string): Promise<Case> => {
    const res = await api.get<Case>(`/cases/${caseId}`);
    return res.data;
  },

  createCase: async (payload: CaseCreatePayload): Promise<Case> => {
    const res = await api.post<Case>('/cases', payload);
    return res.data;
  },

  updateCase: async (caseId: string, payload: CaseUpdatePayload): Promise<Case> => {
    const res = await api.patch<Case>(`/cases/${caseId}`, payload);
    return res.data;
  },

  closeCase: async (caseId: string): Promise<Case> => {
    const res = await api.post<Case>(`/cases/${caseId}/close`);
    return res.data;
  },

  getCaseSummary: async (caseId: string): Promise<CaseSummary> => {
    const res = await api.get<CaseSummary>(`/cases/${caseId}/summary`);
    return res.data;
  },

  listMembers: async (
    caseId: string,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<CaseMember>> => {
    const res = await api.get<PaginatedResponse<CaseMember>>(`/cases/${caseId}/members`, {
      params: { page, page_size: pageSize },
    });
    return res.data;
  },

  addMember: async (caseId: string, payload: MemberCreatePayload): Promise<CaseMember> => {
    const res = await api.post<CaseMember>(`/cases/${caseId}/members`, payload);
    return res.data;
  },

  removeMember: async (caseId: string, userId: string): Promise<void> => {
    await api.delete(`/cases/${caseId}/members/${userId}`);
  },
};
