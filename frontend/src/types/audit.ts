export interface AuditLog {
  id: string;
  event_id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  case_id: string | null;
  timestamp: string | null;
  ip_address: string | null;
  metadata_json: Record<string, any> | null;
  previous_event_hash: string;
  event_hash: string;
}

export interface AuditVerifyOut {
  valid: boolean;
  events_checked: number;
  broken_at_index: number | null;
}

export interface SignatureOut {
  id: string;
  document_id: string;
  version_id: string;
  signer_id: string;
  document_hash: string;
  algorithm: string;
  is_mock: boolean;
  signed_at: string | null;
}

export interface SignatureVerifyOut {
  valid: boolean;
  is_mock: boolean;
  disclaimer: string;
}
