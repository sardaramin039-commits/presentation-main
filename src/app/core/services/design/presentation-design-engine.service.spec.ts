import { TestBed } from '@angular/core/testing';
import { PresentationDesignEngineService } from '../presentation-design-engine.service';
import { PresentationPlan } from '../../models/presentation.model';

describe('PresentationDesignEngineService', () => {
  let service: PresentationDesignEngineService;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      service = new PresentationDesignEngineService();
    });
  });

  const mockPlan: PresentationPlan = {
    id: 'p1',
    title: 'توێژینەوەی ئەکادیمی',
    request: {
      topic: 'تەکنەلۆژیا',
      academicLevel: 'bachelor',
      language: 'ckb',
      targetAudience: 'undergraduate',
      presentationPurpose: 'seminar',
      slideCount: 2,
      presentationDuration: 10
    },
    context: {
      request: {
        topic: 'تەکنەلۆژیا',
        academicLevel: 'bachelor',
        targetAudience: 'undergraduate',
        presentationPurpose: 'seminar',
        slideCount: 2,
        presentationDuration: 10
      },
      audienceProfile: {
        audience: 'undergraduate',
        terminologyStyle: 'standard',
        explanationDepth: 'moderate',
        evidenceDensity: 'medium',
        slideComplexity: 'medium',
        narrativeDepth: 'detailed',
        citationDensity: 'standard',
        expectedBackgroundKnowledge: 'foundational'
      }
    },
    narrative: {
      id: 'n1',
      title: 'توێژینەوەی ئەکادیمی',
      audience: 'undergraduate',
      purpose: 'seminar',
      coreThesis: 'تەکنەلۆژیا ڕۆڵی گەورەی هەیە',
      keyTakeaways: ['پێشکەوتن'],
      sections: [],
      totalTargetSlides: 2
    },
    slides: [
      {
        slideNumber: 1,
        title: 'دەستپێک',
        purpose: 'introduce',
        slideType: 'title',
        layoutIntent: 'title_hero',
        contentPlan: {
          supportingClaims: [],
          evidence: [],
          citations: [],
          keyTerms: ['تەکنەلۆژیا'],
          explanation: 'ڕوونکردنەوە',
          takeaway: 'دەرئەنجام',
          blocks: [{ id: 'b1', text: 'دەستپێک', priority: 'essential', type: 'heading' }]
        },
        evidenceMaps: [],
        citationMaps: [],
        densityStatus: 'optimal',
        speakerNotes: '',
        visualIntentHints: [],
        dataVizType: 'none',
        imageRequired: false,
        traceabilityPath: ''
      }
    ],
    validation: {
      isValid: true,
      status: 'valid',
      missingCriticalContent: false,
      unsupportedClaimsCount: 0,
      citationLossCount: 0,
      evidenceLossCount: 0,
      overloadedSlidesCount: 0,
      repetitionCount: 0,
      narrativeGapCount: 0,
      slideValidationResults: [],
      warnings: [],
      errors: []
    },
    integrityGate: {
      status: 'PASS',
      isPassed: true,
      traceableClaimsPercentage: 100,
      preservedCitationsCount: 0,
      preservedEvidenceCount: 0,
      warnings: [],
      blockingReasons: []
    },
    createdAt: '2026-08-09'
  };

  it('should generate PresentationDesignPlan deterministically', () => {
    const designPlan = service.generateDesignPlan(mockPlan);
    expect(designPlan).toBeDefined();
    expect(designPlan.slides.length).toBe(1);
    expect(designPlan.slides[0].layout.layoutType).toBe('title_only');
    expect(designPlan.overallConsistencyScore).toBeGreaterThanOrEqual(90);
    expect(designPlan.overallValidationStatus).toBe('pass');
  });
});
