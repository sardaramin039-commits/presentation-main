import { ProvenanceChain } from './provenance.model';

export type AcademicEvidenceType =
  | 'direct'
  | 'indirect'
  | 'contextual'
  | 'quantitative'
  | 'definition'
  | 'methodological'
  | 'contradictory';

export interface EvidenceLocator {
  page?: string;
  section?: string;
  paragraph?: string;
  line?: string;
}

export interface SelectedEvidenceItem {
  id: string;
  sourceId: string;
  sourceTitle: string;
  sourceDoi?: string;
  claimId?: string;
  evidenceType: AcademicEvidenceType;
  extractedSnippet: string; // Exact text from source (no hallucination)
  quotedText?: string;
  locator: EvidenceLocator;
  qualityScore: number;     // 0-100
  confidenceScore: number;  // 0-100
  verificationStatus: 'verified' | 'partially_verified' | 'unverified';
  provenance: ProvenanceChain;
}
