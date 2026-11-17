import { TestBed } from '@angular/core/testing';
import { PresentationAllocationService } from '../presentation-allocation.service';
import { PresentationRequest, PresentationContext, PresentationNarrative } from '../../models/presentation.model';
import { Claim, Evidence, Citation, Source } from '../../models/research.model';

describe('PresentationAllocationService', () => {
  let service: PresentationAllocationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresentationAllocationService);
  });

  it('should prioritize content into essential and supporting tiers', () => {
    const claims: Claim[] = [
      { id: 'c1', statement: 'بانگەشەی ۱', status: 'supported' },
      { id: 'c2', statement: 'بانگەشەی ۲', status: 'unverified' }
    ];
    const evidenceList: Evidence[] = [
      {
        id: 'e1',
        claimId: 'c1',
        sourceId: 's1',
        evidenceType: 'direct',
        extractedSnippet: 'بەڵگە ۱',
        location: { page: '1' },
        confidenceScore: 0.9,
        verificationStatus: 'verified',
        provenance: { sourceProvider: 'internal', retrievalTimestamp: new Date().toISOString(), transformationHistory: [] }
      }
    ];

    const prioritized = service.prioritizeContent(claims, evidenceList);
    expect(prioritized.length).toBe(2);
    expect(prioritized[0].priority).toBe('essential');
  });

  it('should allocate content into slide plans and preserve claims and citations', () => {
    const request: PresentationRequest = {
      topic: 'کاریگەری تەکنەلۆژیا',
      academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
      targetAudience: 'undergraduate',
      presentationPurpose: 'research_presentation',
      slideCount: 5,
      presentationDuration: 10
    };

    const claim: Claim = { id: 'c1', statement: 'تەکنەلۆژیا کاریگەری ئەرێنی هەیە', status: 'supported' };
    const evidence: Evidence = {
      id: 'e1',
      claimId: 'c1',
      sourceId: 's1',
      evidenceType: 'direct',
      extractedSnippet: 'بەڵگەی توێژینەوە',
      location: { page: '1' },
      confidenceScore: 0.9,
      verificationStatus: 'verified',
      provenance: { sourceProvider: 'internal', retrievalTimestamp: new Date().toISOString(), transformationHistory: [] }
    };
    const source: Source = {
      id: 's1',
      metadata: {
        title: 'توێژینەوەی ئەکادیمی',
        authors: ['ئەحمەد'],
        publicationYear: 2024,
        sourceType: 'journal_article',
        verificationStatus: 'verified'
      },
      addedAt: new Date().toISOString(),
      provenance: { sourceProvider: 'internal', retrievalTimestamp: new Date().toISOString(), transformationHistory: [] }
    };
    const citation: Citation = {
      citationId: 'cit1',
      sourceId: 's1',
      style: 'APA7',
      inTextParenthetical: '(ئەحمەد، 2024)',
      fullReferenceText: 'ئەحمەد (2024). توێژینەوەی ئەکادیمی.'
    };

    const context: PresentationContext = {
      request,
      audienceProfile: {
        audience: 'undergraduate',
        terminologyStyle: 'standard',
        explanationDepth: 'moderate',
        evidenceDensity: 'medium',
        slideComplexity: 'medium',
        narrativeDepth: 'detailed',
        citationDensity: 'standard',
        expectedBackgroundKnowledge: 'foundational'
      },
      claims: [claim],
      evidenceList: [evidence],
      sources: [source],
      citations: [citation]
    };

    const narrative: PresentationNarrative = {
      id: 'n1',
      title: 'کاریگەری تەکنەلۆژیا',
      audience: 'undergraduate',
      purpose: 'research_presentation',
      coreThesis: 'تەکنەلۆژیا کاریگەری هەیە',
      keyTakeaways: ['پوختە'],
      sections: [
        { id: 'sec1', title: 'دەروازە', purpose: 'ناساندن', targetSlideCount: 1, slideIndices: [1] },
        { id: 'sec2', title: 'بەڵگەکان', purpose: 'خستنەڕوو', targetSlideCount: 2, slideIndices: [2, 3] },
        { id: 'sec3', title: 'کۆتایی', purpose: 'کۆبەند', targetSlideCount: 2, slideIndices: [4, 5] }
      ],
      totalTargetSlides: 5
    };

    const slides = service.allocateContentToSlides(narrative, context, request);
    expect(slides.length).toBe(5);
    expect(slides[0].slideType).toBe('title');
    expect(slides[4].slideType).toBe('reference');
  });
});
