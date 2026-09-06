import { api } from './api';
import { DocumentItem, PaginatedResponse } from '@/types';

export interface DocumentSearchParams {
  page?: number;
  page_size?: number;
  case_number?: string;
  title?: string;
  document_type?: string;
  classification?: string;
  uploader?: string;
  department_id?: string;
  date_from?: string;
  date_to?: string;
  tag?: string;
  ocr_text?: string;
  hash?: string;
  evidence_number?: string;
}

export const searchService = {
  searchDocuments: async (
    params?: DocumentSearchParams
  ): Promise<PaginatedResponse<DocumentItem>> => {
    const res = await api.get<PaginatedResponse<DocumentItem>>('/search/documents', {
      params,
    });
    return res.data;
  },
};
