import { Injectable, inject } from '@angular/core';
import {
  ResearchProject,
  ResearchPlan,
  Source,
  Claim,
  ResearchResult,
  RankingScore,
  EvidenceType,
  EvidenceLocation,
  DuplicateMatchCandidate
} from '../../models/research.model';
import { ResearchPlannerService } from '../research-planner.service';
import { SourceDiscoveryService, SearchOptions } from '../source-discovery.service';
import { SourceRankingService } from '../source-ranking.service';
import { ClaimEvidenceService, ClaimWithEvidence } from '../claim-evidence.service';
import { SourceVerificationService } from '../source-verification.service';
import { EvidenceValidationService } from '../evidence-validation.service';
import { DuplicateDetectionService } from '../duplicate-detection.service';

@Injectable({
  providedIn: 'root'
})
export class ResearchEngineService {
  private planner = inject(ResearchPlannerService);
  private discovery = inject(SourceDiscoveryService);
  private ranking = inject(SourceRankingService);
  private claimEvidence = inject(ClaimEvidenceService);
  private verification = inject(SourceVerificationService);
  private evidenceValidation = inject(EvidenceValidationService);
  private duplicateDetection = inject(DuplicateDetectionService);

  createProject(topic: string, academicLevel = 'bachelor'): ResearchProject {
    const plan = this.planner.createResearchPlan(topic, academicLevel);
    return {
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      plan,
      sources: [],
      evidenceItems: [],
      claims: [],
      links: [],
      updatedAt: new Date().toISOString()
    };
  }

  async discoverSourcesForPlan(plan: ResearchPlan, options?: SearchOptions): Promise<Source[]> {
    const queries = [plan.topic, ...plan.keywords.slice(0, 3)];
    const primaryQuery = queries.join(' ');
    return this.discovery.searchAll(primaryQuery, {
      ...options,
      sourceType: options?.sourceType || plan.targetSourceTypes[0]
    });
  }

  rankProjectSources(project: ResearchProject): RankingScore[] {
    return this.ranking.rankSources(
      project.sources,
      project.plan.keywords,
      project.plan.academicLevel
    );
  }

  async verifyAndAttachResult(source: Source): Promise<Source> {
    const vResult = await this.verification.verifySource(source);
    return {
      ...source,
      metadata: {
        ...source.metadata,
        verificationStatus: vResult.status
      },
      verificationResult: vResult
    };
  }

  async addSourceToProject(project: ResearchProject, source: Source): Promise<ResearchProject> {
    if (project.sources.some(s => s.id === source.id)) {
      return project;
    }
    const verifiedSource = await this.verifyAndAttachResult(source);
    const updatedSources = [...project.sources, verifiedSource];
    return {
      ...project,
      sources: updatedSources,
      updatedAt: new Date().toISOString()
    };
  }

  checkForDuplicates(project: ResearchProject): DuplicateMatchCandidate[] {
    return this.duplicateDetection.findDuplicates(project.sources);
  }

  addClaimToProject(project: ResearchProject, statement: string, notes?: string): { project: ResearchProject; claim: Claim } {
    const claim = this.claimEvidence.createClaim(statement, notes);
    const updatedProject: ResearchProject = {
      ...project,
      claims: [...project.claims, claim],
      updatedAt: new Date().toISOString()
    };
    return { project: updatedProject, claim };
  }

  async addEvidenceAndLinkToClaim(
    project: ResearchProject,
    claimId: string,
    sourceId: string,
    snippet: string,
    evidenceType: EvidenceType = 'direct',
    locationInput?: Partial<EvidenceLocation>,
    quotedText?: string,
    relevanceScore = 0.8,
    explanation = 'دەقی پشتڕاستکەرەوە لە سەرچاوەوە وەرگیراوە'
  ): Promise<ResearchProject> {
    const source = project.sources.find(s => s.id === sourceId);
    if (!source) {
      throw new Error(`Source with ID ${sourceId} not found in project.`);
    }

    const valResult = await this.evidenceValidation.validateAndCreateEvidence(
      source,
      snippet,
      evidenceType,
      locationInput,
      quotedText
    );

    const evidence = valResult.evidence;
    const link = this.claimEvidence.linkEvidenceToClaim(claimId, evidence.id, relevanceScore, explanation);

    const updatedEvidenceItems = [...project.evidenceItems, evidence];
    const updatedLinks = [...project.links, link];

    // Re-evaluate claim statuses
    const updatedClaims = project.claims.map(claim => {
      const status = this.claimEvidence.evaluateClaimStatus(claim.id, updatedLinks, updatedEvidenceItems, project.sources);
      return { ...claim, status };
    });

    return {
      ...project,
      claims: updatedClaims,
      evidenceItems: updatedEvidenceItems,
      links: updatedLinks,
      updatedAt: new Date().toISOString()
    };
  }

  getClaimTree(project: ResearchProject, claimId: string): ClaimWithEvidence | null {
    const claim = project.claims.find(c => c.id === claimId);
    if (!claim) return null;

    return this.claimEvidence.getClaimWithEvidenceTree(
      claim,
      project.links,
      project.evidenceItems,
      project.sources
    );
  }

  getResearchResult(project: ResearchProject): ResearchResult {
    const rankedScores = this.rankProjectSources(project);
    return {
      project,
      rankedScores
    };
  }
}
