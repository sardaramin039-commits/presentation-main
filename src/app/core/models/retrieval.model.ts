import { Source } from './research.model';
import { ProvenanceChain } from './provenance.model';

export interface RetrievalFilters {
  doiRequired?: boolean;
  minYear?: number;
  allowedSourceTypes?: string[];
  verificationStatusFilter?: 'verified_only' | 'all';
  academicLevel?: 'qutabxana' | 'bachelor' | 'postgrad';
}

export interface HybridRetrievalQuery {
  rawQuery: string;
  expandedQueries: string[];
  filters?: RetrievalFilters;
  topK?: number;
}

export interface ScoreFeatureBreakdown {
  lexicalScore: number;         // BM25 term frequency / exact match
  semanticScore: number;        // Cosine / vector similarity
  sourceQualityScore: number;   // Peer review / publisher / verification
  evidenceDirectnessScore: number; // Snippet relevance
  recencyScore: number;         // Year weighting
  contradictionPenalty: number; // Penalty for conflicting data
  duplicatePenalty: number;    // Penalty for redundant items
}

export interface RetrievalCandidate {
  id: string;
  source: Source;
  matchedSnippets: string[];
  featureBreakdown: ScoreFeatureBreakdown;
  finalRankScore: number; // Combined weighted score (0-100)
  provenance: ProvenanceChain;
}

export interface HybridRetrievalResult {
  query: HybridRetrievalQuery;
  candidates: RetrievalCandidate[];
  totalRetrieved: number;
  deduplicatedCount: number;
  executedAt: string;
  provenance: ProvenanceChain;
}
