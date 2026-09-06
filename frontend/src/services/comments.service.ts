import { api } from './api';
import {
  CommentCreatePayload,
  CommentItem,
  CommentUpdatePayload,
  PaginatedResponse,
} from '@/types';

export const commentsService = {
  listComments: async (
    documentId: string,
    page = 1,
    pageSize = 50
  ): Promise<PaginatedResponse<CommentItem>> => {
    const res = await api.get<PaginatedResponse<CommentItem>>(
      `/documents/${documentId}/comments`,
      {
        params: { page, page_size: pageSize },
      }
    );
    return res.data;
  },

  createComment: async (
    documentId: string,
    payload: CommentCreatePayload
  ): Promise<CommentItem> => {
    const res = await api.post<CommentItem>(`/documents/${documentId}/comments`, payload);
    return res.data;
  },

  updateComment: async (
    commentId: string,
    payload: CommentUpdatePayload
  ): Promise<CommentItem> => {
    const res = await api.patch<CommentItem>(`/comments/${commentId}`, payload);
    return res.data;
  },

  resolveComment: async (commentId: string): Promise<CommentItem> => {
    const res = await api.post<CommentItem>(`/comments/${commentId}/resolve`);
    return res.data;
  },
};
