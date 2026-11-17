import { ProvenanceChain } from './provenance.model';

export type ClaimCategory =
  | 'factual'
  | 'interpretive'
  | 'comparative'
  | 'causal'
  | 'quantitative'
  | 'historical'
  | 'definitional'
  | 'methodological'
  | 'opinion';

export type ClaimEntailmentStatus =
  | 'supported'
  | 'partially_supported'
  | 'unsupported'
  | 'contradicted'
  | 'unverified';

export interface ExtractedClaim {
  id: string;
  statement: string;
  normalizedStatement: string;
  category: ClaimCategory;
  isFactual: boolean; // Distinguishes factual from interpretive/opinion claims
  sourceIds: string[];
  evidenceIds: string[];
  status: ClaimEntailmentStatus;
  notes?: string;
  provenance: ProvenanceChain;
}
