export type SourceType =
  | 'journal_article'
  | 'book'
  | 'book_chapter'
  | 'conference_paper'
  | 'thesis'
  | 'report'
  | 'webpage'
  | 'other';

export type SourceVerificationStatus =
  | 'verified'
  | 'partially_verified'
  | 'unverified'
  | 'rejected';

export type ClaimStatus =
  | 'supported'
  | 'partially_supported'
  | 'unsupported'
  | 'unverified';

export type EvidenceType =
  | 'direct'
  | 'indirect'
  | 'contextual'
  | 'bibliographic';

export type FieldVerificationStatus =
  | 'verified'
  | 'partially_verified'
  | 'unverified'
  | 'rejected';

export interface SourceMetadata {
  title: string;
  authors: string[];
  publicationYear?: number;
  publisher?: string;
  journal?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  doi?: string;
  isbn?: string;
  url?: string;
  language?: string;
  abstract?: string;
  sourceType: SourceType;
  databaseProvider?: string;
  verificationStatus: SourceVerificationStatus;
}

export interface TransformationLog {
  timestamp: string;
  action: string;
  actor: string;
  details?: string;
}

export interface Provenance {
  sourceProvider: string;
  providerSourceId?: string;
  retrievalTimestamp: string;
  originalUrl?: string;
  retrievedMetadataSnapshot?: Record<string, unknown>;
  verificationTimestamp?: string;
  verificationProvider?: string;
  transformationHistory: TransformationLog[];
}

export interface FieldVerification {
  fieldName: keyof SourceMetadata;
  status: FieldVerificationStatus;
  note?: string;
}

export interface VerificationCheck {
  checkName: string;
  passed: boolean;
  score: number;
  message: string;
}

export interface VerificationResult {
  sourceId: string;
  status: SourceVerificationStatus;
  verifiedAt: string;
  verificationProvider: string;
  checks: VerificationCheck[];
  fieldVerifications: FieldVerification[];
  confidence: number;
  warnings: string[];
  errors: string[];
}

export interface Source {
  id: string;
  metadata: SourceMetadata;
  addedAt: string;
  provenance: Provenance;
  rawContent?: string;
  verificationResult?: VerificationResult;
}

export interface EvidenceLocation {
  page: string; // Defaults to 'unknown' if not available
  section?: string;
  paragraph?: string;
}

export interface Evidence {
  id: string;
  sourceId: string;
  claimId?: string;
  evidenceType: EvidenceType;
  extractedSnippet: string;
  quotedText?: string;
  location: EvidenceLocation;
  contextNote?: string;
  confidenceScore: number;
  verificationStatus: SourceVerificationStatus;
  provenance: Provenance;
}

export interface Claim {
  id: string;
  statement: string;
  status: ClaimStatus;
  notes?: string;
}

export interface ClaimEvidenceLink {
  id: string;
  claimId: string;
  evidenceId: string;
  relevanceScore: number;
  explanation: string;
}

// CITATION & REFERENCE ENGINE DOMAIN MODELS
export type CitationStyle = 'APA7' | 'IEEE' | 'MLA9' | 'CHICAGO17' | 'ChicagoAuthorDate' | 'ChicagoNotes' | 'HARVARD' | 'Harvard' | 'VANCOUVER';
export type CitationType = 'parenthetical' | 'narrative' | 'numeric' | 'footnote';

export interface CitationLocator {
  page?: string;
  pageRange?: string;
  section?: string;
  paragraph?: string;
  timestamp?: string;
}

export interface CitationContext {
  surroundingText?: string;
  prefix?: string;
  suffix?: string;
  positionIndex?: number;
  source: Source;
  citationNumber?: number;
  locator?: CitationLocator;
  claim?: Claim;
  evidence?: Evidence;
}

export type CitationValidationStatus = 'verified' | 'partially_verified' | 'unverified' | 'rejected' | 'invalid' | 'valid' | 'partially_valid';

export interface CitationValidationResult {
  citationId: string;
  status: CitationValidationStatus;
  isValid?: boolean;
  checksPassed?: boolean | string[];
  issues?: string[];
  warnings: string[];
  errors: string[];
  validatedAt: string;
  providerVerificationPassed?: boolean;
  metadataMatchesSource?: boolean;
}

export interface CitationProvenance {
  sourceId: string;
  citationStyle: CitationStyle;
  generatedAt: string;
  formatterVersion: string;
  evidenceId?: string;
  claimId?: string;
  transformationHistory?: TransformationLog[];
}

export interface Citation {
  citationId: string;
  sourceId: string;
  claimId?: string;
  evidenceId?: string;
  style: CitationStyle;
  citationType?: CitationType;
  formattedText?: string;
  inTextNarrative?: string;
  inTextParenthetical?: string;
  inTextNumeric?: string;
  footnoteText?: string;
  fullReferenceText?: string;
  locator?: CitationLocator;
  context?: CitationContext;
  createdFromStructuredDataOnly?: boolean;
  validationResult?: CitationValidationResult;
  validationStatus?: string;
  provenance?: CitationProvenance;
}

export interface Reference {
  referenceId: string;
  sourceId: string;
  style: CitationStyle;
  formattedBibliographicEntry: string;
  formattedText?: string;
  doi?: string;
  url?: string;
  authorYearKey: string;
  sortKey?: string;
  citationIds?: string[];
}

export interface DuplicateMatchCandidate {
  sourceAId?: string;
  sourceBId?: string;
  sourceA?: Source;
  sourceB?: Source;
  matchScore?: number;
  confidence: number;
  isDuplicate: boolean;
  matchCriteria?: string[];
  matchingCriteria: string[];
  explanation?: string;
}

export interface Pagination {
  page: number;
  limit: number;
  totalPages?: number;
  totalResults?: number;
  hasMore?: boolean;
}

export interface ResearchQuestion {
  id: string;
  question: string;
  category: string;
  keywords: string[];
}

export interface ResearchPlan {
  id: string;
  topic: string;
  academicLevel: string;
  objective: string;
  questions: ResearchQuestion[];
  subtopics: string[];
  keywords: string[];
  alternativeKeywords: string[];
  languageVariants: Record<string, string[]>;
  targetSourceTypes: SourceType[];
  searchStrategy: string;
  createdAt: string;
}

export interface ResearchProject {
  id: string;
  plan: ResearchPlan;
  sources: Source[];
  evidenceItems: Evidence[];
  claims: Claim[];
  links: ClaimEvidenceLink[];
  updatedAt: string;
}

export interface RankingScore {
  sourceId: string;
  overallScore: number; // 0 to 1
  relevanceScore: number;
  recencyScore: number;
  authorCompletenessScore: number;
  publisherQualityScore: number;
  metadataCompletenessScore: number;
  hasDoiBonus: number;
  verificationBonus: number;
  explanation: string[];
}

export interface ResearchResult {
  project: ResearchProject;
  rankedScores: RankingScore[];
}

export interface ProviderError {
  providerName: string;
  errorMessage: string;
  statusCode?: number;
}

export interface ResearchSearchResult {
  query: string;
  providersUsed: string[];
  results: Source[];
  totalKnownResults: number;
  providerErrors?: ProviderError[];
  retrievedAt: string;
  pagination?: Pagination;
}
