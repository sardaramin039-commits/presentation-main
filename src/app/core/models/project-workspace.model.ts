import { Claim, Evidence, Citation, Source } from './research.model';
import { AcademicDocument } from './academic-writing.model';
import { PresentationPlan } from './presentation.model';
import { VisualStory } from './visual-storytelling.model';

export type UserRole = 'researcher' | 'student' | 'supervisor' | 'professor' | 'reviewer';

export interface ResearchGap {
  id: string;
  topicArea: string;
  description: string;
  impactLevel: 'high' | 'medium' | 'low';
  suggestedFocus: string;
}

export interface ResearchQuestionRefinement {
  originalQuestion: string;
  refinedQuestion: string;
  rationale: string;
  academicFeasibilityScore: number; // 0 - 100
}

export interface HypothesisAnalysis {
  hypothesis: string;
  supportingEvidenceCount: number;
  conflictingEvidenceCount: number;
  confidenceScore: number; // 0 - 100
  verdict: 'strong_support' | 'partial_support' | 'conflicting' | 'insufficient_evidence';
}

export interface LiteratureTrend {
  keyword: string;
  growthDirection: 'emerging' | 'dominant' | 'declining' | 'stable';
  relevanceScore: number;
  keyAuthors: string[];
}

export interface ResearchTopicMapNode {
  id: string;
  label: string;
  category: 'core' | 'subtopic' | 'methodology' | 'theory' | 'application';
  connectedNodeIds: string[];
}

export interface ResearchIntelligencePlan {
  id: string;
  topic: string;
  researchGaps: ResearchGap[];
  questionRefinements: ResearchQuestionRefinement[];
  hypotheses: HypothesisAnalysis[];
  literatureTrends: LiteratureTrend[];
  topicMapNodes: ResearchTopicMapNode[];
  createdAt: string;
}

export interface EvidenceGraphNode {
  id: string;
  type: 'claim' | 'evidence' | 'source' | 'author' | 'doi' | 'citation';
  label: string;
  subText?: string;
  confidenceScore: number;
  status: 'verified' | 'unverified' | 'conflicting';
}

export interface EvidenceGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: 'supports' | 'contradicts' | 'authored_by' | 'published_in' | 'cites' | 'derived_from';
  strength: number; // 0 - 1
}

export interface EvidenceGraph {
  nodes: EvidenceGraphNode[];
  edges: EvidenceGraphEdge[];
  overallGraphConfidence: number;
}

export interface AcademicAssistantQuery {
  id: string;
  question: string;
  academicLevel: 'qutabxana' | 'bachelor' | 'postgrad';
  projectId?: string;
  timestamp: string;
}

export interface AcademicAssistantResponse {
  queryId: string;
  answerKurdish: string;
  referencedSources: Source[];
  referencedEvidence: Evidence[];
  citations: Citation[];
  provenanceSummary: string;
  confidenceScore: number;
  verificationStatus: 'verified' | 'partially_verified' | 'unverified';
  derivationReason?: string;
}

export interface AcademicComment {
  id: string;
  projectId: string;
  authorName: string;
  authorRole: UserRole;
  sectionTarget: string;
  commentText: string;
  createdAt: string;
  resolved: boolean;
  replies?: AcademicComment[];
}

export interface AcademicReviewWorkflowStep {
  stepId: string;
  stageName: string;
  reviewerRole: UserRole;
  status: 'pending' | 'in_review' | 'approved' | 'revision_requested';
  comments: string;
  reviewedAt?: string;
}

export interface AcademicProjectVersion {
  versionNumber: number;
  versionLabel: string;
  timestamp: string;
  author: string;
  summaryOfChanges: string;
  documentSnapshot?: AcademicDocument;
  presentationSnapshot?: PresentationPlan;
}

export interface AcademicProject {
  id: string;
  title: string;
  topic: string;
  academicLevel: 'qutabxana' | 'bachelor' | 'postgrad';
  projectType: 'thesis' | 'dissertation' | 'seminar' | 'journal_article' | 'research_paper' | 'presentation';
  ownerEmail: string;
  userRole: UserRole;
  sources: Source[];
  evidenceList: Evidence[];
  claims: Claim[];
  citations: Citation[];
  intelligencePlan?: ResearchIntelligencePlan;
  evidenceGraph?: EvidenceGraph;
  currentDocument?: AcademicDocument;
  currentPresentation?: PresentationPlan;
  visualStory?: VisualStory;
  comments: AcademicComment[];
  workflowSteps: AcademicReviewWorkflowStep[];
  versions: AcademicProjectVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDashboardStats {
  totalProjects: number;
  totalSources: number;
  verifiedSourcesCount: number;
  totalEvidenceCount: number;
  totalClaimsCount: number;
  unverifiedClaimsCount: number;
  reviewPendingCount: number;
  exportReadyCount: number;
}
