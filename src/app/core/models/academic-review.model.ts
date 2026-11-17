import {
  Source,
  Claim,
  Evidence,
  Citation,
  ResearchPlan
} from './research.model';
import { AcademicDocument } from './academic-writing.model';
import { Contradiction } from './fact-check.model';

export type ReviewSeverity = 'critical' | 'major' | 'moderate' | 'minor' | 'informational';

export type ReviewStatus = 'pass' | 'pass_with_warnings' | 'needs_revision' | 'critical_revision';

export type ReviewDimension =
  | 'research_question_quality'
  | 'structure_and_organization'
  | 'argument_coherence'
  | 'claim_evidence_alignment'
  | 'citation_quality'
  | 'source_quality'
  | 'source_verification'
  | 'academic_language'
  | 'terminology_consistency'
  | 'logical_consistency'
  | 'contradiction_status'
  | 'completeness'
  | 'provenance_integrity';

export type FindingLocationType = 'section' | 'paragraph' | 'sentence' | 'claim';

export interface ReviewLocation {
  type: FindingLocationType;
  sectionId?: string;
  sectionTitle?: string;
  paragraphId?: string;
  sentenceText?: string;
  claimId?: string;
  details?: string;
}

export interface ReviewTraceability {
  claimId?: string;
  evidenceId?: string;
  sourceId?: string;
  citationId?: string;
  providerName?: string;
  verificationStatus?: string;
  hasBrokenChain: boolean;
  chainNotes: string[];
}

export interface ReviewRecommendation {
  id: string;
  findingId: string;
  action: string; // Specific actionable recommendation in Kurdish
  explanation: string;
  evidenceLink?: string;
  suggestedFix?: string;
}

export interface ReviewFinding {
  id: string;
  dimension: ReviewDimension;
  severity: ReviewSeverity;
  message: string; // Clear explanation in Kurdish
  location: ReviewLocation;
  relatedClaimId?: string;
  relatedEvidenceId?: string;
  relatedSourceId?: string;
  recommendation?: ReviewRecommendation;
  traceability?: ReviewTraceability;
}

export interface DimensionReviewResult {
  dimension: ReviewDimension;
  status: ReviewStatus;
  findings: ReviewFinding[];
  evidence: string[];
  recommendations: ReviewRecommendation[];
}

export interface ExplainableQualityMetric {
  metricName: string;
  score: number; // 0 to 100
  description: string;
  methodology: string;
}

export interface ReviewSummary {
  criticalFindings: number;
  majorFindings: number;
  moderateFindings: number;
  minorFindings: number;
  informationalFindings: number;
  passedDimensions: ReviewDimension[];
  failedDimensions: ReviewDimension[];
  requiresRevision: boolean;
  humanReviewRequired: boolean;
  escalationReasons: string[];
  overallStatus: ReviewStatus;
  explainableQualityMetrics: ExplainableQualityMetric[];
}

export interface HumanReviewEscalationItem {
  type: string;
  itemId: string;
  reason: string;
}

export interface HumanReviewEscalation {
  required: boolean;
  reasons: string[];
  escalatedItems: HumanReviewEscalationItem[];
}

export interface AcademicReviewRequest {
  requestId: string;
  document: AcademicDocument;
  researchPlan?: ResearchPlan;
  claims?: Claim[];
  evidenceList?: Evidence[];
  sources?: Source[];
  citations?: Citation[];
  contradictions?: Contradiction[];
  academicLevel?: string;
  documentType?: 'research_paper' | 'thesis' | 'essay' | 'report' | 'article';
  researchType?: 'empirical' | 'theoretical' | 'review' | 'case_study' | 'qualitative' | 'quantitative';
  strictMode?: boolean;
}

export interface AcademicReviewResult {
  requestId: string;
  overallStatus: ReviewStatus;
  dimensions: Record<ReviewDimension, DimensionReviewResult>;
  findings: ReviewFinding[];
  recommendations: ReviewRecommendation[];
  summary: ReviewSummary;
  humanReviewEscalation: HumanReviewEscalation;
  reviewedAt: string;
}
