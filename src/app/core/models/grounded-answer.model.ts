import { ExtractedClaim } from './claim.model';
import { SelectedEvidenceItem } from './evidence.model';
import { ClaimEntailmentResult } from './entailment.model';
import { ContradictionItem } from './contradiction.model';
import { CalibratedConfidenceResult } from './confidence.model';
import { ProvenanceChain } from './provenance.model';
import { Citation } from './research.model';

export interface GroundedAnswerResult {
  queryId: string;
  rawUserQuery: string;
  expandedQueries: string[];
  isAbstained: boolean;
  abstentionReasonKurdish?: string;
  answerKurdish: string;
  claims: ExtractedClaim[];
  evidenceSnippets: SelectedEvidenceItem[];
  entailments: ClaimEntailmentResult[];
  contradictions: ContradictionItem[];
  citations: Citation[];
  confidence: CalibratedConfidenceResult;
  coverageMetrics: {
    evidenceCoverage: number;
    citationCoverage: number;
    verifiedSourceCoverage: number;
    contradictionCoverage: number;
    highQualitySourceCoverage: number;
    unsupportedClaimRatio: number;
  };
  provenance: ProvenanceChain;
}
