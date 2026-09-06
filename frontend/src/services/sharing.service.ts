import { api } from './api';
import { PaginatedResponse, ShareLinkItem } from '@/types';

export interface ShareLinkCreatePayload {
  recipient_email?: string;
  expires_minutes?: number;
  max_downloads?: number;
}

export const sharingService = {
  createShareLink: async (
    documentId: string,
    payload: ShareLinkCreatePayload
  ): Promise<ShareLinkItem> => {
    const res = await api.post<ShareLinkItem>(
      `/documents/${documentId}/share-links`,
      payload
    );
    return res.data;
  },

  listShareLinks: async (
    documentId: string,
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<ShareLinkItem>> => {
    const res = await api.get<PaginatedResponse<ShareLinkItem>>(
      `/documents/${documentId}/share-links`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return res.data;
  },

  revokeShareLink: async (shareToken: string): Promise<void> => {
    await api.post(`/share-links/${shareToken}/revoke`);
  },
};
