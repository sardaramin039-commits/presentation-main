import { SelectedEvidenceItem } from './evidence.model';
import { ProvenanceChain } from './provenance.model';

export type EntailmentLabel =
  | 'SUPPORTED'
  | 'PARTIALLY_SUPPORTED'
  | 'NOT_SUPPORTED'
  | 'CONTRADICTED'
  | 'INSUFFICIENT_EVIDENCE';

export interface ClaimEntailmentResult {
  claimId: string;
  claimStatement: string;
  label: EntailmentLabel;
  entailmentScore: number; // 0-100
  supportingEvidence: SelectedEvidenceItem[];
  contradictoryEvidence: SelectedEvidenceItem[];
  reasoningKurdish: string;
  provenance: ProvenanceChain;
}
