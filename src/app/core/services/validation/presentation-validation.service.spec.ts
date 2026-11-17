import { TestBed } from '@angular/core/testing';
import { PresentationValidationService } from '../presentation-validation.service';
import { SlidePlan, PresentationNarrative, PresentationContext } from '../../models/presentation.model';

describe('PresentationValidationService', () => {
  let service: PresentationValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresentationValidationService);
  });

  it('should validate presentation and run Academic Integrity Gate', () => {
    const slides: SlidePlan[] = [
      {
        slideNumber: 1,
        title: 'دەروازە',
        purpose: 'introduce',
        slideType: 'title',
        layoutIntent: 'title_hero',
        contentPlan: {
          supportingClaims: [],
          evidence: [],
          citations: [],
          keyTerms: [],
          explanation: 'دەروازە',
          takeaway: 'پوختە',
          blocks: [{ id: 'b1', text: 'سڵایدی دەروازە', priority: 'essential', type: 'heading' }]
        },
        evidenceMaps: [],
        citationMaps: [],
        densityStatus: 'optimal',
        speakerNotes: '',
        visualIntentHints: [],
        dataVizType: 'none',
        imageRequired: false,
        traceabilityPath: 'Slide#1'
      },
      {
        slideNumber: 2,
        title: 'سەرچاوەکان',
        purpose: 'citeSources',
        slideType: 'reference',
        layoutIntent: 'reference_list',
        contentPlan: {
          supportingClaims: [],
          evidence: [],
          citations: [],
          keyTerms: [],
          explanation: 'سەرچاوەکان',
          takeaway: 'پوختە',
          blocks: [{ id: 'b2', text: 'سەرچاوەی ئەکادیمی', priority: 'essential', type: 'bullet' }]
        },
        evidenceMaps: [],
        citationMaps: [],
        densityStatus: 'optimal',
        speakerNotes: '',
        visualIntentHints: [],
        dataVizType: 'none',
        imageRequired: false,
        traceabilityPath: 'Slide#2'
      }
    ];

    const narrative: PresentationNarrative = {
      id: 'n1',
      title: 'تەوەر',
      audience: 'undergraduate',
      purpose: 'research_presentation',
      coreThesis: 'تێز',
      keyTakeaways: ['خاڵ'],
      sections: [],
      totalTargetSlides: 2
    };

    const context: PresentationContext = {
      request: {
        topic: 'تەوەر',
        academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
        targetAudience: 'undergraduate',
        presentationPurpose: 'research_presentation',
        slideCount: 2,
        presentationDuration: 5
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
    };

    const result = service.validatePresentation(slides, narrative, context);
    expect(result.validation).toBeTruthy();
    expect(result.integrityGate.isPassed).toBeTrue();
  });
});
