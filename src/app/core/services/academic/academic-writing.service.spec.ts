import { TestBed } from '@angular/core/testing';
import { AcademicWritingService } from '../academic-writing.service';
import { CitationGeneratorService } from '../citation-generator.service';
import { CitationValidationService } from '../citation-validation.service';
import { EvidenceCoverageService } from '../evidence-coverage.service';
import { EvidenceGroundingGuard } from '../evidence-grounding-guard.service';
import { AcademicLanguageService } from '../academic-language.service';
import { DraftValidationService } from '../draft-validation.service';
import { ClaimTraceabilityService } from '../claim-traceability.service';
import { Source, Claim, Evidence, ResearchPlan } from '../../models/research.model';
import { WritingRequest, WritingContext } from '../../models/academic-writing.model';

describe('AcademicWritingService', () => {
  let service: AcademicWritingService;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      const validator = new CitationValidationService();
      const generator = new CitationGeneratorService(validator);
      const coverage = new EvidenceCoverageService();
      const guard = new EvidenceGroundingGuard(coverage);
      const lang = new AcademicLanguageService();
      const trace = new ClaimTraceabilityService();
      const draftVal = new DraftValidationService(trace);
      service = new AcademicWritingService(generator, coverage, guard, lang, draftVal);
    });
  });

  const verifiedSource: Source = {
    id: 'src_writing_1',
    addedAt: '2023-01-01',
    metadata: {
      title: 'Machine Learning in Medical Diagnostics',
      authors: ['Alice Smith', 'Bob Jones'],
      publicationYear: 2023,
      journal: 'Journal of AI Medicine',
      sourceType: 'journal_article',
      verificationStatus: 'verified'
    },
    provenance: {
      sourceProvider: 'Crossref',
      retrievalTimestamp: '2023-01-01',
      transformationHistory: []
    }
  };

  const sampleClaim: Claim = {
    id: 'claim_w1',
    statement: 'Deep learning models achieve high sensitivity in radiology.',
    status: 'supported'
  };

  const sampleEvidence: Evidence = {
    id: 'ev_w1',
    sourceId: 'src_writing_1',
    evidenceType: 'direct',
    extractedSnippet: 'Model sensitivity reached 98.4% on test cohort.',
    location: { page: '12' },
    confidenceScore: 0.96,
    verificationStatus: 'verified',
    provenance: {
      sourceProvider: 'Crossref',
      retrievalTimestamp: '2023-01-01',
      transformationHistory: []
    }
  };

  const researchPlan: ResearchPlan = {
    id: 'plan_1',
    topic: 'AI in Healthcare',
    academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
    objective: 'Synthesize AI diagnostics literature',
    questions: [],
    subtopics: ['Radiology Applications', 'Diagnostic Accuracy'],
    keywords: ['AI', 'Radiology'],
    alternativeKeywords: [],
    languageVariants: {},
    targetSourceTypes: ['journal_article'],
    searchStrategy: 'boolean',
    createdAt: '2023-01-01'
  };

  it('should execute claim-first pipeline and generate grounded draft with citations', () => {
    const request: WritingRequest = {
      topic: 'AI in Healthcare',
      academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
      language: 'ckb',
      citationStyle: 'APA7'
    };

    const context: WritingContext = {
      researchPlan,
      sources: [verifiedSource],
      claims: [sampleClaim],
      evidenceList: [sampleEvidence],
      claimEvidenceLinks: [],
      citationStyle: 'APA7'
    };

    const draft = service.generateGroundedDraft(request, context);

    expect(draft.document).toBeDefined();
    expect(draft.document.sections.length).toBe(2); // Based on researchPlan subtopics
    expect(draft.document.citations.length).toBeGreaterThan(0);
    expect(draft.coverageMetrics.supportedClaims).toBe(1);
    expect(draft.validationResult.isValid).toBe(true);
  });

  it('should flag claims lacking evidence as unverified without fabricating evidence', () => {
    const claimNoEvidence: Claim = {
      id: 'claim_unverified',
      statement: 'AI completely eliminates medical error.',
      status: 'unverified'
    };

    const request: WritingRequest = {
      topic: 'Unverified Claim Test',
      academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
      language: 'ckb',
      citationStyle: 'APA7'
    };

    const context: WritingContext = {
      researchPlan: undefined,
      sources: [verifiedSource],
      claims: [claimNoEvidence],
      evidenceList: [], // NO EVIDENCE
      claimEvidenceLinks: [],
      citationStyle: 'APA7'
    };

    const draft = service.generateGroundedDraft(request, context);

    const firstSection = draft.document.sections[0];
    const firstParagraph = firstSection.paragraphs[0];

    expect(firstParagraph.coverageMetrics.unverifiedClaims).toBe(1);
    expect(firstParagraph.text).toContain('UNVERIFIED CLAIM');
    expect(draft.validationResult.isValid).toBe(false); // Flagged because claim lacks evidence
  });
});
