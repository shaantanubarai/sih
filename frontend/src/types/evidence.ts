export type EvidenceStatus =
  | 'COLLECTED'
  | 'IN_CUSTODY'
  | 'TRANSFERRED'
  | 'SUBMITTED_TO_COURT'
  | 'DISPOSED';

export interface EvidenceItem {
  id: string;
  case_id: string;
  document_id: string | null;
  evidence_number: string;
  description: string;
  collected_by: string;
  collected_at: string;
  location_collected: string | null;
  current_custodian: string;
  status: EvidenceStatus;
  created_at: string | null;
}

export interface EvidenceCreatePayload {
  evidence_number: string;
  description: string;
  document_id?: string;
  collected_at: string;
  location_collected?: string;
}

export interface CustodyTransfer {
  id: string;
  evidence_item_id: string;
  from_user_id: string;
  to_user_id: string;
  transferred_at: string | null;
  reason: string;
  location: string | null;
  notes: string | null;
  digital_signature_reference: string | null;
  created_at: string | null;
}

export interface CustodyTransferCreatePayload {
  to_user_id: string;
  reason: string;
  location?: string;
  notes?: string;
  digital_signature_reference?: string;
}
