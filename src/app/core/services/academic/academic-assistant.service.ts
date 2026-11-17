import { Injectable, inject } from '@angular/core';
import { AcademicAssistantQuery, AcademicAssistantResponse } from '../../models/project-workspace.model';
import { Source, Evidence, Citation, Claim } from '../../models/research.model';

import { QueryExpansionService } from '../query-expansion.service';
import { HybridRetrievalService } from '../hybrid-retrieval.service';
import { RerankingService } from '../reranking.service';
import { EvidenceSelectionService } from '../evidence-selection.service';
import { ClaimExtractionService } from '../claim-extraction.service';
import { ClaimEntailmentService } from '../claim-entailment.service';
import { ContradictionAwareRetrievalService } from '../contradiction-aware-retrieval.service';
import { CitationEvidenceVerifierService } from '../citation-evidence-verifier.service';
import { ConfidenceCalibrationService } from '../confidence-calibration.service';
import { AbstentionService } from '../abstention.service';
import { EvidenceCoverageService } from '../evidence-coverage.service';
import { GroundedAnswerResult } from '../../models/grounded-answer.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicAssistantService {
  private queryExpansionService = inject(QueryExpansionService);
  private hybridRetrievalService = inject(HybridRetrievalService);
  private rerankingService = inject(RerankingService);
  private evidenceSelectionService = inject(EvidenceSelectionService);
  private claimExtractionService = inject(ClaimExtractionService);
  private claimEntailmentService = inject(ClaimEntailmentService);
  private contradictionService = inject(ContradictionAwareRetrievalService);
  private citationVerifierService = inject(CitationEvidenceVerifierService);
  private confidenceService = inject(ConfidenceCalibrationService);
  private abstentionService = inject(AbstentionService);
  private coverageService = inject(EvidenceCoverageService);

  /**
   * Responds to research queries using the complete P1 Evidence Intelligence Pipeline
   */
  public answerQuery(
    query: AcademicAssistantQuery,
    sources: Source[] = [],
    evidenceList: Evidence[] = [],
    citations: Citation[] = [],
    claims: Claim[] = []
  ): AcademicAssistantResponse {
    const groundedResult = this.executeGroundedPipeline(query.question, sources, citations);
    groundedResult.provenance.auditTrail.push({
      timestamp: new Date().toISOString(),
      operation: 'answer_generation',
      actor: 'academic_assistant',
      details: `Workspace context: ${evidenceList.length} evidence items, ${claims.length} claims`
    });

    const verifiedStatus: 'verified' | 'partially_verified' | 'unverified' =
      groundedResult.confidence.level === 'VERY_HIGH' || groundedResult.confidence.level === 'HIGH'
        ? 'verified'
        : (groundedResult.confidence.level === 'MODERATE' ? 'partially_verified' : 'unverified');

    return {
      queryId: query.id,
      answerKurdish: groundedResult.answerKurdish,
      referencedSources: groundedResult.isAbstained ? [] : sources,
      referencedEvidence: groundedResult.evidenceSnippets.map(e => ({
        id: e.id,
        sourceId: e.sourceId,
        evidenceType: 'direct',
        extractedSnippet: e.extractedSnippet,
        location: { page: e.locator.page || '1' },
        confidenceScore: e.confidenceScore,
        verificationStatus: e.verificationStatus,
        provenance: {
          sourceProvider: 'P1-Evidence-Pipeline',
          retrievalTimestamp: new Date().toISOString(),
          transformationHistory: []
        }
      })),
      citations,
      provenanceSummary: groundedResult.provenance.auditTrail.map(a => a.details).join(' | '),
      confidenceScore: groundedResult.confidence.finalScore,
      verificationStatus: verifiedStatus,
      derivationReason: groundedResult.confidence.explanationKurdish
    };
  }

  /**
   * Executes the P1 Grounded Evidence Intelligence Pipeline
   */
  public executeGroundedPipeline(
    userQuery: string,
    sources: Source[] = [],
    citations: Citation[] = []
  ): GroundedAnswerResult {
    // 1. Query Expansion
    const expandedQuerySet = this.queryExpansionService.expandQuery(userQuery);

    // 2. Hybrid Retrieval (BM25 + Semantic)
    const rawRetrieval = this.hybridRetrievalService.retrieve(expandedQuerySet, sources, 10);

    // 3. Retrieval Reranking
    const rerankedCandidates = this.rerankingService.rerank(rawRetrieval.candidates);

    // 4. Evidence Selection
    const selectedEvidence = this.evidenceSelectionService.selectEvidence(rerankedCandidates);

    // 5. Claim Extraction
    const extractedClaims = this.claimExtractionService.extractClaims(selectedEvidence);

    // 6. Claim-Evidence Entailment
    const entailments = this.claimEntailmentService.evaluateEntailment(extractedClaims, selectedEvidence);

    // 7. Contradiction-aware Retrieval
    const contradictionsGraph = this.contradictionService.analyzeContradictions(
      sources,
      extractedClaims,
      selectedEvidence
    );

    // 8. Citation Verification
    const citationReports = this.citationVerifierService.verifyCitations(
      citations,
      sources,
      selectedEvidence,
      extractedClaims
    );

    // 9. Calibrated Confidence
    const calibratedConfidence = this.confidenceService.calibrateConfidence(
      selectedEvidence,
      entailments,
      contradictionsGraph.items,
      citationReports
    );

    // 10. Abstention Check
    const abstentionEval = this.abstentionService.evaluateAbstention(
      selectedEvidence,
      calibratedConfidence,
      userQuery
    );

    // 11. Evidence Coverage Metrics
    const coverageMetrics = this.coverageService.calculateP1Coverage(
      extractedClaims,
      selectedEvidence,
      entailments,
      contradictionsGraph.items,
      sources
    );

    let answerKurdish = '';

    if (abstentionEval.shouldAbstain) {
      answerKurdish = `⚠️ **پێویست بە وەستان/پاشەکشە هەیە (Abstention / Insufficient Evidence)**:\n\n` +
        `${abstentionEval.abstentionReasonKurdish}\n\n` +
        `**پێشنیاری بوارەکانی توێژینەوە:**\n` +
        abstentionEval.suggestedResearchDirectionsKurdish.map(d => `- ${d}`).join('\n');
    } else {
      answerKurdish = `**وەڵامی ئەکادیمیی سەلمێنراو لەسەر بنەمای زنجیرەی بەڵگەكان (P1 Grounded Answer):**\n\n`;

      entailments.forEach((ent, idx) => {
        const statusBadge = ent.label === 'SUPPORTED' ? '✅ [پشتیوانیکراو]' : '⚠️ [کەمێک پشتگیری کراو]';
        answerKurdish += `${idx + 1}. **ئیدیعا**: ${ent.claimStatement}\n` +
          `   - **دۆخ**: ${statusBadge} (${ent.reasoningKurdish})\n`;

        if (ent.supportingEvidence.length > 0) {
          const ev = ent.supportingEvidence[0];
          answerKurdish += `   - **بەڵگە**: ${ev.quotedText} — *سەرچاوە: ${ev.sourceTitle} (DOI: ${ev.sourceDoi || 'تۆمارکراو'})*\n\n`;
        }
      });

      if (contradictionsGraph.hasUnresolvedContradictions) {
        answerKurdish += `\n**تێبینی جیاوازی و ناکۆکیی زانستی (Scientific Disagreements):**\n`;
        contradictionsGraph.items.forEach(c => {
          answerKurdish += `- ${c.explanationKurdish}\n`;
        });
      }

      answerKurdish += `\n*ئاستی متمانەی هەڵسەنگێنراو (Calibrated Confidence): ${calibratedConfidence.finalScore}% (${calibratedConfidence.level})*`;
    }

    return {
      queryId: `query-${Date.now()}`,
      rawUserQuery: userQuery,
      expandedQueries: expandedQuerySet.expandedQueries,
      isAbstained: abstentionEval.shouldAbstain,
      abstentionReasonKurdish: abstentionEval.abstentionReasonKurdish,
      answerKurdish,
      claims: extractedClaims,
      evidenceSnippets: selectedEvidence,
      entailments,
      contradictions: contradictionsGraph.items,
      citations,
      confidence: calibratedConfidence,
      coverageMetrics,
      provenance: calibratedConfidence.provenance
    };
  }
}
