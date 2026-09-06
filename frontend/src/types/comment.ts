export interface CommentItem {
  id: string;
  document_id: string;
  version_id: string | null;
  user_id: string;
  content: string;
  page_number: number | null;
  is_resolved: boolean;
  created_at: string | null;
  user?: {
    id: string;
    full_name: string;
    role: string;
  };
}

export interface CommentCreatePayload {
  content: string;
  version_id?: string;
  page_number?: number;
}

export interface CommentUpdatePayload {
  content: string;
}
