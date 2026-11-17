import {
  Source,
  Claim,
  Evidence,
  Citation,
  ResearchPlan,
  ClaimEvidenceLink,
  CitationStyle,
  ClaimStatus,
  SourceVerificationStatus,
  EvidenceLocation
} from './research.model';

export type AcademicLanguage = 'ckb' | 'ar' | 'fa' | 'en';

export interface EvidenceCoverageMetrics {
  totalClaims: number;
  supportedClaims: number;
  partiallySupportedClaims: number;
  unsupportedClaims: number;
  unverifiedClaims: number;
  coverageScore: number; // Percentage 0 to 100 (represents evidence grounding coverage, NOT truth percentage)
}

export interface AcademicClaim {
  claim: Claim;
  evidenceItems: Evidence[];
  source?: Source;
  citation?: Citation;
  status: ClaimStatus;
  unsupportedReason?: string;
}

export interface AcademicParagraph {
  id: string;
  sectionId: string;
  text: string;
  claims: AcademicClaim[];
  citations: Citation[];
  coverageMetrics: EvidenceCoverageMetrics;
  warnings: string[];
  isVerifiedAcademicText: boolean;
}

export interface AcademicSection {
  id: string;
  sectionTitle: string;
  order: number;
  paragraphs: AcademicParagraph[];
}

export interface AcademicDocument {
  id: string;
  title: string;
  academicLevel: string;
  language: AcademicLanguage;
  citationStyle: CitationStyle;
  sections: AcademicSection[];
  sources: Source[];
  claims: Claim[];
  citations: Citation[];
  createdAt: string;
  updatedAt: string;
}

export interface WritingRequest {
  topic: string;
  academicLevel: string;
  language: AcademicLanguage;
  citationStyle: CitationStyle;
  sourceIds?: string[];
  maxSections?: number;
  researchPlanId?: string;
}

export interface WritingContext {
  researchPlan?: ResearchPlan;
  sources: Source[];
  claims: Claim[];
  evidenceList: Evidence[];
  claimEvidenceLinks: ClaimEvidenceLink[];
  citationStyle: CitationStyle;
}

export interface DraftValidationCheck {
  checkName: string;
  passed: boolean;
  details: string;
}

export interface DraftValidationResult {
  status: 'valid' | 'warnings' | 'errors';
  isValid: boolean;
  checksPassed: DraftValidationCheck[];
  warnings: string[];
  errors: string[];
  validatedAt: string;
}

export interface EvidenceGroundedDraft {
  document: AcademicDocument;
  coverageMetrics: EvidenceCoverageMetrics;
  validationResult: DraftValidationResult;
}

export interface ClaimTraceability {
  claimId: string;
  statement: string;
  claimStatus: ClaimStatus;
  evidence?: {
    evidenceId: string;
    extractedSnippet: string;
    quotedText?: string;
    location: EvidenceLocation;
    confidenceScore: number;
  };
  source?: {
    sourceId: string;
    title: string;
    authors: string[];
    year?: number;
    doi?: string;
    url?: string;
    verificationStatus: SourceVerificationStatus;
  };
  provider?: {
    providerName: string;
    originalUrl?: string;
    retrievalTimestamp: string;
  };
  citation?: {
    citationId: string;
    style: CitationStyle;
    inTextParenthetical: string;
    fullReferenceText: string;
  };
  isAuditable: boolean;
  traceabilityNotes: string[];
}

export interface QualityMetrics {
  evidenceCoverageScore: number; // 0 to 100
  citationCoverageScore: number; // 0 to 100
  sourceVerificationCoverageScore: number; // 0 to 100
  provenanceCompletenessScore: number; // 0 to 100
  unsupportedClaimCount: number;
  unverifiedClaimCount: number;
  auditabilityStatus: 'full' | 'partial' | 'low';
}
