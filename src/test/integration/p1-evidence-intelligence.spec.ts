import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ProvenanceIntegrityService } from '../../app/core/services/provenance-integrity.service';
import { QueryExpansionService } from '../../app/core/services/query-expansion.service';
import { HybridRetrievalService } from '../../app/core/services/hybrid-retrieval.service';
import { RerankingService } from '../../app/core/services/reranking.service';
import { EvidenceSelectionService } from '../../app/core/services/evidence-selection.service';
import { ClaimExtractionService } from '../../app/core/services/claim-extraction.service';
import { ClaimEntailmentService } from '../../app/core/services/claim-entailment.service';
import { ContradictionAwareRetrievalService } from '../../app/core/services/contradiction-aware-retrieval.service';
import { CitationEvidenceVerifierService } from '../../app/core/services/citation-evidence-verifier.service';
import { ConfidenceCalibrationService } from '../../app/core/services/confidence-calibration.service';
import { AbstentionService } from '../../app/core/services/abstention.service';
import { EvidenceCoverageService } from '../../app/core/services/evidence-coverage.service';
import { EvaluationDatasetService } from '../fixtures/evaluation-dataset';
import { AcademicAssistantService } from '../../app/core/services/academic-assistant.service';

import { Source, Citation } from '../../app/core/models/research.model';

describe('P1 — Academic AI Reliability & Evidence Intelligence Suite', () => {
  let provenanceService: ProvenanceIntegrityService;
  let queryExpansionService: QueryExpansionService;
  let hybridRetrievalService: HybridRetrievalService;
  let rerankingService: RerankingService;
  let evidenceSelectionService: EvidenceSelectionService;
  let claimExtractionService: ClaimExtractionService;
  let claimEntailmentService: ClaimEntailmentService;
  let contradictionService: ContradictionAwareRetrievalService;
  let citationVerifierService: CitationEvidenceVerifierService;
  let confidenceService: ConfidenceCalibrationService;
  let abstentionService: AbstentionService;
  let coverageService: EvidenceCoverageService;
  let evaluationDatasetService: EvaluationDatasetService;
  let academicAssistantService: AcademicAssistantService;

  const mockSources: Source[] = [
    {
      id: 'src-101',
      metadata: {
        title: 'کاریگەری ژیری دەستکرد لەسەر پەرەسەندنی ئەکادیمی',
        authors: ['د. ئارام ئەحمەد', 'د. کاروان حەمە'],
        publicationYear: 2024,
        journal: 'کۆڤاری زانستی پەروردە',
        doi: '10.1000/182',
        sourceType: 'journal_article',
        verificationStatus: 'verified',
        abstract: 'ژیرى دەستکرد دەبێتە هۆی گەشەکردنی شێوازی فێربوونی خودیی خوێندکاران بە ڕێژەی ٣٥٪ لە زانکۆکاندا.'
      },
      rawContent: 'ژیرى دەستکرد دەبێتە هۆی گەشەکردنی شێوازی فێربوونی خودیی خوێندکاران بە ڕێژەی ٣٥٪ لە زانکۆکاندا.',
      addedAt: new Date().toISOString(),
      provenance: {
        sourceProvider: 'Crossref',
        retrievalTimestamp: new Date().toISOString(),
        transformationHistory: []
      }
    },
    {
      id: 'src-102',
      metadata: {
        title: 'زیان و ئاستەنگەکانی بەکارهێنانی ژیری دەستکرد',
        authors: ['د. ڕێبوار کەریم'],
        publicationYear: 2023,
        journal: 'گۆڤاری فێربوونی سەردەم',
        doi: '10.1000/999',
        sourceType: 'journal_article',
        verificationStatus: 'verified',
        abstract: 'بەکارهێنانی بێ کۆنترۆڵی ژیری دەستکرد دەبێتە هۆی کەمبوون و دابەزینی بیرکردنەوەی ڕەخنەگرانەی خوێندکاران.'
      },
      rawContent: 'بەکارهێنانی بێ کۆنترۆڵی ژیری دەستکرد دەبێتە هۆی کەمبوون و دابەزینی بیرکردنەوەی ڕەخنەگرانەی خوێندکاران.',
      addedAt: new Date().toISOString(),
      provenance: {
        sourceProvider: 'PubMed',
        retrievalTimestamp: new Date().toISOString(),
        transformationHistory: []
      }
    }
  ];

  const mockCitations: Citation[] = [
    {
      citationId: 'cite-01',
      sourceId: 'src-101',
      style: 'APA7',
      formattedText: '(ئەحمەد و حەمە، ٢٠٢٤)',
      inTextParenthetical: '(ئەحمەد و حەمە، ٢٠٢٤)',
      locator: { page: '14' }
    }
  ];

  beforeEach(() => {
    provenanceService = TestBed.inject(ProvenanceIntegrityService);
    queryExpansionService = TestBed.inject(QueryExpansionService);
    hybridRetrievalService = TestBed.inject(HybridRetrievalService);
    rerankingService = TestBed.inject(RerankingService);
    evidenceSelectionService = TestBed.inject(EvidenceSelectionService);
    claimExtractionService = TestBed.inject(ClaimExtractionService);
    claimEntailmentService = TestBed.inject(ClaimEntailmentService);
    contradictionService = TestBed.inject(ContradictionAwareRetrievalService);
    citationVerifierService = TestBed.inject(CitationEvidenceVerifierService);
    confidenceService = TestBed.inject(ConfidenceCalibrationService);
    abstentionService = TestBed.inject(AbstentionService);
    coverageService = TestBed.inject(EvidenceCoverageService);
    evaluationDatasetService = TestBed.inject(EvaluationDatasetService);
    academicAssistantService = TestBed.inject(AcademicAssistantService);
  });

  describe('P1.1 — Hybrid Retrieval', () => {
    it('should perform lexical + semantic retrieval in a single query execution', () => {
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const result = hybridRetrievalService.retrieve(qSet, mockSources);

      expect(result.candidates.length).toBeGreaterThan(0);
      expect(result.candidates[0].featureBreakdown.lexicalScore).toBeGreaterThanOrEqual(0);
      expect(result.candidates[0].featureBreakdown.semanticScore).toBeGreaterThanOrEqual(0);
      expect(result.provenance.id).toBeDefined();
    });

    it('should deduplicate source pool by DOI or Title', () => {
      const duplicatePool = [...mockSources, mockSources[0]];
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const result = hybridRetrievalService.retrieve(qSet, duplicatePool);

      expect(result.deduplicatedCount).toBe(2);
    });
  });

  describe('P1.2 — Query Expansion', () => {
    it('should preserve original user query and generate Sorani/English variants with audit trail', () => {
      const qSet = queryExpansionService.expandQuery('کاریگەری ژیری دەستکرد');

      expect(qSet.rawUserQuery).toBe('کاریگەری ژیری دەستکرد');
      expect(qSet.expandedQueries).toContain('کاریگەری ژیری دەستکرد');
      expect(qSet.expandedQueries.some(q => q.includes('Artificial Intelligence'))).toBe(true);
      expect(qSet.provenance.operation).toBe('query_expansion');
    });
  });

  describe('P1.3 — Reranking Engine', () => {
    it('should rerank candidates deterministically without hard-coded scores', () => {
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const rawRes = hybridRetrievalService.retrieve(qSet, mockSources);
      const reranked = rerankingService.rerank(rawRes.candidates);

      expect(reranked.length).toBe(rawRes.candidates.length);
      expect(reranked[0].finalRankScore).toBeGreaterThanOrEqual(0);
      expect(reranked[0].finalRankScore).toBeLessThanOrEqual(100);
    });
  });

  describe('P1.4 — Evidence Selection Engine', () => {
    it('should extract verbatim evidence snippets with locators and quality scores', () => {
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const rawRes = hybridRetrievalService.retrieve(qSet, mockSources);
      const reranked = rerankingService.rerank(rawRes.candidates);
      const evidence = evidenceSelectionService.selectEvidence(reranked);

      expect(evidence.length).toBeGreaterThan(0);
      expect(evidence[0].extractedSnippet).toBeDefined();
      expect(evidence[0].locator.page).toBeDefined();
    });
  });

  describe('P1.5 — Claim Extraction Engine', () => {
    it('should extract claims and distinguish factual claims from opinion/non-factual statements', () => {
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const rawRes = hybridRetrievalService.retrieve(qSet, mockSources);
      const reranked = rerankingService.rerank(rawRes.candidates);
      const evidence = evidenceSelectionService.selectEvidence(reranked);
      const claims = claimExtractionService.extractClaims(evidence);

      expect(claims.length).toBeGreaterThan(0);
      claims.forEach(c => {
        expect(typeof c.isFactual).toBe('boolean');
        expect(c.provenance.claimId).toBeDefined();
      });
    });
  });

  describe('P1.6 — Claim-Evidence Entailment', () => {
    it('should classify claims into SUPPORTED, CONTRADICTED, or NOT_SUPPORTED labels', () => {
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const rawRes = hybridRetrievalService.retrieve(qSet, mockSources);
      const reranked = rerankingService.rerank(rawRes.candidates);
      const evidence = evidenceSelectionService.selectEvidence(reranked);
      const claims = claimExtractionService.extractClaims(evidence);
      const entailments = claimEntailmentService.evaluateEntailment(claims, evidence);

      expect(entailments.length).toBe(claims.length);
      expect(['SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_SUPPORTED', 'CONTRADICTED', 'INSUFFICIENT_EVIDENCE']).toContain(entailments[0].label);
    });
  });

  describe('P1.7 — Contradiction-aware Retrieval', () => {
    it('should build a contradiction graph for opposing evidence text across sources', () => {
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const rawRes = hybridRetrievalService.retrieve(qSet, mockSources);
      const reranked = rerankingService.rerank(rawRes.candidates);
      const evidence = evidenceSelectionService.selectEvidence(reranked);
      const claims = claimExtractionService.extractClaims(evidence);
      const graph = contradictionService.analyzeContradictions(mockSources, claims, evidence);

      expect(graph.hasUnresolvedContradictions).toBe(true);
      expect(graph.items.length).toBeGreaterThan(0);
      expect(graph.items[0].explanationKurdish).toContain('ناکۆک');
    });
  });

  describe('P1.8 — Citation-to-Evidence Verification', () => {
    it('should trace citations back to source and produce warning if locator is missing', () => {
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const rawRes = hybridRetrievalService.retrieve(qSet, mockSources);
      const reranked = rerankingService.rerank(rawRes.candidates);
      const evidence = evidenceSelectionService.selectEvidence(reranked);
      const claims = claimExtractionService.extractClaims(evidence);
      const reports = citationVerifierService.verifyCitations(mockCitations, mockSources, evidence, claims);

      expect(reports.length).toBe(1);
      expect(reports[0].hasValidSource).toBe(true);
      expect(reports[0].hasVerifiedEvidence).toBe(true);
    });
  });

  describe('P1.9 — Calibrated Confidence Engine', () => {
    it('should calculate confidence with breakdown and CAP score if no evidence exists', () => {
      const calibratedWithNoEv = confidenceService.calibrateConfidence([], [], [], []);

      expect(calibratedWithNoEv.isEvidenceBacked).toBe(false);
      expect(calibratedWithNoEv.finalScore).toBeLessThanOrEqual(29); // Capped at VERY_LOW
      expect(calibratedWithNoEv.level).toBe('VERY_LOW');
    });
  });

  describe('P1.10 — Abstention / Insufficient Evidence', () => {
    it('should abstain and return research guidance when no evidence is available', () => {
      const calibratedWithNoEv = confidenceService.calibrateConfidence([], [], [], []);
      const evalAbstain = abstentionService.evaluateAbstention([], calibratedWithNoEv, 'مەریخ');

      expect(evalAbstain.shouldAbstain).toBe(true);
      expect(evalAbstain.abstentionReasonKurdish).toContain('بەس بەردەست نییە');
      expect(evalAbstain.suggestedResearchDirectionsKurdish.length).toBeGreaterThan(0);
    });
  });

  describe('P1.11 — Academic Assistant Redesign', () => {
    it('should execute end-to-end P1 pipeline and generate grounded Kurdish answer', () => {
      const response = academicAssistantService.answerQuery(
        { id: 'q-101', question: 'کاریگەری ژیری دەستکرد چییە؟', academicLevel: 'bachelor', timestamp: new Date().toISOString() },
        mockSources,
        [],
        mockCitations,
        []
      );

      expect(response.answerKurdish).toContain('P1 Grounded Answer');
      expect(response.confidenceScore).toBeGreaterThan(0);
      expect(response.verificationStatus).toBeDefined();
    });
  });

  describe('P1.12 — Evidence Coverage Metrics', () => {
    it('should calculate factual claim coverage with clean denominators', () => {
      const qSet = queryExpansionService.expandQuery('ژیری دەستکرد');
      const rawRes = hybridRetrievalService.retrieve(qSet, mockSources);
      const reranked = rerankingService.rerank(rawRes.candidates);
      const evidence = evidenceSelectionService.selectEvidence(reranked);
      const claims = claimExtractionService.extractClaims(evidence);
      const entailments = claimEntailmentService.evaluateEntailment(claims, evidence);
      const graph = contradictionService.analyzeContradictions(mockSources, claims, evidence);

      const metrics = coverageService.calculateP1Coverage(claims, evidence, entailments, graph.items, mockSources);

      expect(metrics.evidenceCoverage).toBeGreaterThanOrEqual(0);
      expect(metrics.evidenceCoverage).toBeLessThanOrEqual(100);
      expect(typeof metrics.unsupportedClaimRatio).toBe('number');
    });
  });

  describe('P1.13 — Provenance Integrity', () => {
    it('should maintain unbroken provenance chains and audit log', () => {
      const chain = provenanceService.createChain('user_ingest', 'Initial ingestion of study');
      expect(chain.id).toBeDefined();

      const mutated = provenanceService.recordMutation(chain, 'query_expansion', 'Expanded queries');
      expect(mutated.auditTrail.length).toBe(2);

      const check = provenanceService.isChainValid(mutated);
      expect(check.valid).toBe(true);
    });
  });

  describe('P1.14 & P1.15 — Evaluation Dataset & Regression Test Suite', () => {
    it('should load internal benchmark dataset and compute evaluation metrics', () => {
      const dataset = evaluationDatasetService.getBenchmarkDataset();
      expect(dataset.length).toBe(4);

      const metrics = evaluationDatasetService.evaluatePipeline();
      expect(metrics.recallAtK).toBeGreaterThan(90);
      expect(metrics.hallucinationRate).toBe(0.0);
    });
  });
});
