import {
  Source,
  Claim,
  Evidence,
  Citation,
  SourceVerificationStatus,
  EvidenceLocation
} from './research.model';

export type ClaimAssessmentStatus =
  | 'supported'
  | 'partially_supported'
  | 'unsupported'
  | 'unverified'
  | 'contradicted';

export type EvidenceAssessmentType =
  | 'supporting'
  | 'contradicting'
  | 'contextual'
  | 'insufficient';

export type ContradictionType =
  | 'direct'
  | 'numerical'
  | 'date'
  | 'attribution'
  | 'definition_conflict'
  | 'scope_conflict'
  | 'contextual_disagreement';

export type ConflictResolutionStatus =
  | 'resolved'
  | 'partially_resolved'
  | 'unresolved'
  | 'not_a_true_conflict';

export interface DecomposedAssertion {
  id: string;
  originalClaimId: string;
  statement: string;
  assertionType: 'date' | 'numerical' | 'fact' | 'attribution' | 'general';
  numericValue?: number;
  unit?: string;
  yearValue?: number;
}

export interface EvidenceAssessment {
  evidence: Evidence;
  source?: Source;
  type: EvidenceAssessmentType;
  relevanceScore: number;
  confidenceScore: number;
  assessmentReason: string;
  isDirectEvidence: boolean;
  hasLocator: boolean;
  provenanceComplete: boolean;
}

export interface Contradiction {
  id: string;
  claimId: string;
  type: ContradictionType;
  statementA: string;
  statementB: string;
  sourceA?: Source;
  sourceB?: Source;
  supportingEvidence: Evidence[];
  contradictingEvidence: Evidence[];
  contradictionConfidence: number; // 0 to 100, confidence in contradiction presence, NOT scientific truth
  reasoning: string;
  resolutionStatus: ConflictResolutionStatus;
  resolutionNotes?: string;
  needsHumanReview: boolean;
}

export interface ContradictionGroup {
  topic: string;
  contradictions: Contradiction[];
  unresolvedCount: number;
}

export interface ClaimAssessment {
  claim: Claim;
  assertions: DecomposedAssertion[];
  assessmentStatus: ClaimAssessmentStatus;
  evidenceAssessments: EvidenceAssessment[];
  contradictions: Contradiction[];
  citations: Citation[];
  needsHumanReview: boolean;
  assessmentSummary: string;
}

export interface FactCheckRequest {
  claims: Claim[];
  sources: Source[];
  evidenceList: Evidence[];
  citations?: Citation[];
  strictMode?: boolean;
}

export interface FactCheckResult {
  requestId: string;
  claimAssessments: ClaimAssessment[];
  contradictions: Contradiction[];
  unresolvedContradictionsCount: number;
  needsHumanReviewCount: number;
  evaluatedAt: string;
}

export interface FactCheckReport {
  reportId: string;
  checkedClaimsCount: number;
  supportedClaimsCount: number;
  partiallySupportedClaimsCount: number;
  unsupportedClaimsCount: number;
  contradictedClaimsCount: number;
  unresolvedContradictionsCount: number;
  needsHumanReviewCount: number;
  evidenceCoverageRatio: number; // 0 to 1
  claimAssessments: ClaimAssessment[];
  contradictionGroups: ContradictionGroup[];
  warnings: string[];
  generatedAt: string;
}

export interface FactCheckTraceability {
  claimId: string;
  assertionStatement: string;
  assessmentStatus: ClaimAssessmentStatus;
  evidenceItems: {
    evidenceId: string;
    extractedSnippet: string;
    assessmentType: EvidenceAssessmentType;
    location: EvidenceLocation;
  }[];
  sources: {
    sourceId: string;
    title: string;
    verificationStatus: SourceVerificationStatus;
    provider: string;
    doi?: string;
  }[];
  contradictionsDetected: number;
  needsHumanReview: boolean;
}
