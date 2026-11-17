export type ProvenanceOperation =
  | 'user_ingest'
  | 'query_expansion'
  | 'hybrid_retrieval'
  | 'reranking'
  | 'evidence_extraction'
  | 'claim_extraction'
  | 'entailment_check'
  | 'contradiction_analysis'
  | 'citation_verification'
  | 'confidence_calibration'
  | 'answer_generation'
  | 'manual_override';

export interface AuditRecord {
  timestamp: string;
  operation: ProvenanceOperation;
  actor: string;
  details: string;
  snapshotHash?: string;
}

export interface ProvenanceChain {
  id: string;
  createdAt: string;
  sourceId?: string;
  evidenceId?: string;
  claimId?: string;
  citationId?: string;
  operation: ProvenanceOperation;
  modelOrProvider: string;
  version: string;
  verificationStatus: 'verified' | 'partially_verified' | 'unverified' | 'flagged';
  auditTrail: AuditRecord[];
  parentProvenanceId?: string;
}
