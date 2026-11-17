import { ProvenanceChain } from './provenance.model';

export type ConfidenceLevel =
  | 'VERY_LOW'   // 0-29
  | 'LOW'        // 30-49
  | 'MODERATE'   // 50-69
  | 'HIGH'       // 70-84
  | 'VERY_HIGH'; // 85-100

export interface ConfidenceBreakdown {
  evidenceStrengthScore: number;     // 0 to +25
  sourceQualityScore: number;        // 0 to +20
  entailmentStrengthScore: number;    // 0 to +25
  verificationStatusScore: number;   // 0 to +15
  citationMatchScore: number;        // 0 to +10
  retrievalConsistencyScore: number; // 0 to +10
  contradictionPenalty: number;      // 0 to -30
  missingEvidencePenalty: number;    // 0 to -25
  uncertaintyPenalty: number;        // 0 to -15
}

export interface CalibratedConfidenceResult {
  finalScore: number; // 0-100
  level: ConfidenceLevel;
  breakdown: ConfidenceBreakdown;
  explanationKurdish: string;
  isEvidenceBacked: boolean;
  provenance: ProvenanceChain;
}
