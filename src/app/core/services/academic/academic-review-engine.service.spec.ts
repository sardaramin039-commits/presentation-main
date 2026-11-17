import { describe, it, expect, beforeEach } from 'vitest';
import { AcademicReviewEngineService } from '../academic-review-engine.service';
import { ResearchQuestionReviewService } from '../research-question-review.service';
import { StructureReviewService } from '../structure-review.service';
import { ArgumentCoherenceReviewService } from '../argument-coherence-review.service';
import { ClaimEvidenceReviewService } from '../claim-evidence-review.service';
import { CitationQualityReviewService } from '../citation-quality-review.service';
import { SourceQualityReviewService } from '../source-quality-review.service';
import { AcademicLanguageReviewService } from '../academic-language-review.service';
import { TerminologyConsistencyService } from '../terminology-consistency.service';
import { ContradictionReviewService } from '../contradiction-review.service';
import { CompletenessReviewService } from '../completeness-review.service';
import { ProvenanceIntegrityReviewService } from '../provenance-integrity-review.service';
import { AcademicDocument } from '../../models/academic-writing.model';
import { Claim, Source } from '../../models/research.model';
import { Contradiction } from '../../models/fact-check.model';
import { AcademicReviewRequest } from '../../models/academic-review.model';

describe('AcademicReviewEngineService & BATCH 9 Quality Assurance Tasks', () => {
  let engine: AcademicReviewEngineService;
  let rqService: ResearchQuestionReviewService;
  let structService: StructureReviewService;
  let argService: ArgumentCoherenceReviewService;
  let ceService: ClaimEvidenceReviewService;
  let citService: CitationQualityReviewService;
  let srcService: SourceQualityReviewService;
  let langService: AcademicLanguageReviewService;
  let termService: TerminologyConsistencyService;
  let contraService: ContradictionReviewService;
  let compService: CompletenessReviewService;
  let provService: ProvenanceIntegrityReviewService;

  beforeEach(() => {
    rqService = new ResearchQuestionReviewService();
    structService = new StructureReviewService();
    argService = new ArgumentCoherenceReviewService();
    ceService = new ClaimEvidenceReviewService();
    citService = new CitationQualityReviewService();
    srcService = new SourceQualityReviewService();
    langService = new AcademicLanguageReviewService();
    termService = new TerminologyConsistencyService();
    contraService = new ContradictionReviewService();
    compService = new CompletenessReviewService();
    provService = new ProvenanceIntegrityReviewService();

    // Instantiate main engine
    engine = new AcademicReviewEngineService(
      rqService,
      structService,
      argService,
      ceService,
      citService,
      srcService,
      langService,
      termService,
      contraService,
      compService,
      provService
    );
  });

  const sampleDoc: AcademicDocument = {
    id: 'doc_1',
    title: 'تەحلیلی زیرەکی دەستکرد لە پزیشکیدا',
    academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
    language: 'ckb',
    citationStyle: 'APA7',
    sections: [
      {
        id: 'sec_1',
        sectionTitle: 'پێشەکی (Introduction)',
        order: 1,
        paragraphs: [
          {
            id: 'p_1',
            sectionId: 'sec_1',
            text: 'ئەمە وایە کە زیرەکی دەستکرد گۆڕانکاری گەورەی دروست کردووە. لەسەر بنەمای هەندێک ئامراز و ئامێر و میکانیزم کار دەکات. هەموان پێیان وایە بەکارهێنانی هەموو شتێک بە سوودە.',
            claims: [],
            citations: [],
            coverageMetrics: { totalClaims: 0, supportedClaims: 0, partiallySupportedClaims: 0, unsupportedClaims: 0, unverifiedClaims: 0, coverageScore: 0 },
            warnings: [],
            isVerifiedAcademicText: true
          }
        ]
      },
      {
        id: 'sec_2',
        sectionTitle: 'دەرئەنجام (Conclusion)',
        order: 2,
        paragraphs: [
          {
            id: 'p_2',
            sectionId: 'sec_2',
            text: 'کەواتە دەسەلمێنرێت کە ئەنجامی لێکۆڵینەوەکە سەرکەوتوو بوو.',
            claims: [],
            citations: [],
            coverageMetrics: { totalClaims: 0, supportedClaims: 0, partiallySupportedClaims: 0, unsupportedClaims: 0, unverifiedClaims: 0, coverageScore: 0 },
            warnings: [],
            isVerifiedAcademicText: true
          }
        ]
      }
    ],
    sources: [],
    claims: [],
    citations: [],
    createdAt: '2026-08-09',
    updatedAt: '2026-08-09'
  };

  it('TASK 3 — Research Question Review: should detect vague or missing research questions', () => {
    const res = rqService.reviewResearchQuestions([
      { id: 'q1', question: 'هەموو شتێک چییە؟', category: 'gen', keywords: [] }
    ]);

    expect(res.dimension).toBe('research_question_quality');
    expect(res.findings.length).toBeGreaterThan(0);
    expect(res.findings[0].message).toContain('زاراوەی گشتی');
    expect(res.status).toBe('needs_revision');
  });

  it('TASK 4 — Structural Review: should check missing sections based on document type and level', () => {
    const res = structService.reviewStructure(sampleDoc, '🎓 زانکۆ - بەکالۆریۆس', 'thesis', 'empirical');

    expect(res.dimension).toBe('structure_and_organization');
    expect(res.findings.some(f => f.message.includes('میثۆدۆلۆژی'))).toBe(true);
    expect(res.status).toBe('needs_revision');
  });

  it('TASK 5 — Argument Coherence: should detect overgeneralization and logical jump without inventing facts', () => {
    const res = argService.reviewArgumentCoherence(sampleDoc);

    expect(res.dimension).toBe('argument_coherence');
    expect(res.findings.some(f => f.message.includes('گشتاندن'))).toBe(true);
    expect(res.findings.some(f => f.message.includes('بازدانی لۆجیکی'))).toBe(true);
  });

  it('TASK 6 — Claim-Evidence Alignment: should classify unsupported, unverified, and supported claims', () => {
    const claim1: Claim = { id: 'c1', statement: 'زیرەکی دەستکرد بەسوودە.', status: 'unsupported' };
    const res = ceService.reviewClaimEvidenceAlignment([claim1], [], [], []);

    expect(res.dimension).toBe('claim_evidence_alignment');
    expect(res.findings.length).toBe(1);
    expect(res.findings[0].severity).toBe('major');
  });

  it('TASK 7 — Citation Quality Review: should detect orphan references and missing citations', () => {
    const source1: Source = {
      id: 'src_orphan',
      metadata: { title: 'AI in Medicine', authors: ['Smith, A.'], sourceType: 'journal_article', verificationStatus: 'verified' },
      addedAt: '2026-08-09',
      provenance: { sourceProvider: 'Crossref', retrievalTimestamp: '2026-08-09', transformationHistory: [] }
    };
    const claim1: Claim = { id: 'c1', statement: 'فاکتێکی زانستی بەبێ ئاماژە', status: 'unsupported' };

    const res = citService.reviewCitationQuality(sampleDoc, [source1], [], [claim1]);

    expect(res.dimension).toBe('citation_quality');
    expect(res.findings.some(f => f.message.includes('سەرچاوەی هەتیو'))).toBe(true);
    expect(res.findings.some(f => f.message.includes('ئاماژەی کەمتەرخەم'))).toBe(true);
  });

  it('TASK 8 — Source Quality Review: should flag rejected sources as critical finding', () => {
    const rejectedSource: Source = {
      id: 'src_rej',
      metadata: { title: 'Fake Journal Paper', authors: ['Bad Author'], sourceType: 'webpage', verificationStatus: 'rejected' },
      addedAt: '2026-08-09',
      provenance: { sourceProvider: 'Web', retrievalTimestamp: '2026-08-09', transformationHistory: [] }
    };

    const res = srcService.reviewSourceQuality([rejectedSource]);

    expect(res.dimension).toBe('source_quality');
    expect(res.findings.some(f => f.severity === 'critical')).toBe(true);
  });

  it('TASK 9 — Academic Language Review: should detect colloquial language without mutating text', () => {
    const res = langService.reviewAcademicLanguage(sampleDoc);

    expect(res.dimension).toBe('academic_language');
    expect(res.findings.some(f => f.message.includes('ئاخاوتنی نا-ئەکادیمی'))).toBe(true);
  });

  it('TASK 10 — Terminology Consistency: should identify terminology variation candidates', () => {
    const res = termService.reviewTerminologyConsistency(sampleDoc);

    expect(res.dimension).toBe('terminology_consistency');
    expect(res.findings.some(f => f.message.includes('یەکگرتوونەنیشاندانی زاراوە'))).toBe(true);
  });

  it('TASK 11 — Contradiction Integration: should flag unresolved contradictions as major/critical', () => {
    const contradiction: Contradiction = {
      id: 'contra_1',
      claimId: 'c1',
      type: 'direct',
      statementA: 'ڕێژەی سەرکەوتن 80% بوو.',
      statementB: 'ڕێژەی سەرکەوتن 40% بوو.',
      supportingEvidence: [],
      contradictingEvidence: [],
      contradictionConfidence: 95,
      reasoning: 'داتا دژبەیەککان',
      resolutionStatus: 'unresolved',
      needsHumanReview: true
    };

    const res = contraService.reviewContradictionStatus([contradiction]);

    expect(res.dimension).toBe('contradiction_status');
    expect(res.findings[0].severity).toBe('critical');
    expect(res.status).toBe('critical_revision');
  });

  it('TASK 12 — Completeness Review: should flag missing claims and uncited sources', () => {
    const claim1: Claim = { id: 'c1', statement: 'کێشەیەکی بێ بەڵگە', status: 'unsupported' };
    const source1: Source = {
      id: 's1',
      metadata: { title: 'Book 1', authors: ['Author A'], sourceType: 'book', verificationStatus: 'verified' },
      addedAt: '2026-08-09',
      provenance: { sourceProvider: 'OpenAlex', retrievalTimestamp: '2026-08-09', transformationHistory: [] }
    };

    const res = compService.reviewCompleteness(sampleDoc, [claim1], [], [source1], []);

    expect(res.dimension).toBe('completeness');
    expect(res.findings.length).toBeGreaterThan(0);
  });

  it('TASK 13 — Provenance Integrity: should detect broken chain between claim, evidence, and provider', () => {
    const claim1: Claim = { id: 'c1', statement: 'بانگەشەی بێ بەڵگە', status: 'unsupported' };

    const res = provService.reviewProvenanceIntegrity([claim1], [], [], []);

    expect(res.dimension).toBe('provenance_integrity');
    expect(res.findings[0].severity).toBe('major');
    expect(res.findings[0].traceability?.hasBrokenChain).toBe(true);
  });

  it('TASK 14 & 15 & 16 & 17 — Academic Review Engine Execution: should build summary and trigger human escalation on unresolved contradictions', () => {
    const req: AcademicReviewRequest = {
      requestId: 'req_test_full',
      document: sampleDoc,
      claims: [{ id: 'c1', statement: 'بانگەشە 1', status: 'unsupported' }],
      sources: [],
      contradictions: [
        {
          id: 'contra_1',
          claimId: 'c1',
          type: 'direct',
          statementA: 'A',
          statementB: 'B',
          supportingEvidence: [],
          contradictingEvidence: [],
          contradictionConfidence: 90,
          reasoning: 'Conflict',
          resolutionStatus: 'unresolved',
          needsHumanReview: true
        }
      ]
    };

    const result = engine.executeAcademicReview(req);

    expect(result.requestId).toBe('req_test_full');
    expect(result.summary.humanReviewRequired).toBe(true);
    expect(result.humanReviewEscalation.required).toBe(true);
    expect(result.humanReviewEscalation.reasons.length).toBeGreaterThan(0);
    expect(result.summary.explainableQualityMetrics.length).toBe(2);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});
