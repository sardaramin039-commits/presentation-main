import { TestBed } from '@angular/core/testing';
import { PresentationNarrativeService } from '../presentation-narrative.service';
import { PresentationRequest, PresentationContext } from '../../models/presentation.model';

describe('PresentationNarrativeService', () => {
  let service: PresentationNarrativeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresentationNarrativeService);
  });

  it('should generate presentation narrative structure matching target slides', () => {
    const request: PresentationRequest = {
      topic: 'زیرەکیی دەستکرد لە پەروەردەدا',
      academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
      targetAudience: 'undergraduate',
      presentationPurpose: 'research_presentation',
      slideCount: 8,
      presentationDuration: 15
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
      }
    };

    const narrative = service.generateNarrative(request, context);
    expect(narrative).toBeTruthy();
    expect(narrative.totalTargetSlides).toBe(8);
    expect(narrative.sections.length).toBeGreaterThan(0);
  });

  it('should evaluate slide count intelligence and raise warnings if slides are too few', () => {
    const request: PresentationRequest = {
      topic: 'تەوەرەی زانستی',
      academicLevel: '🧠 ماستەر و دکتۆرا',
      targetAudience: 'doctoral',
      presentationPurpose: 'thesis_defense',
      slideCount: 2,
      presentationDuration: 30
    };

    const result = service.evaluateSlideCountIntelligence(request, 10, 15);
    expect(result.isOptimal).toBeFalse();
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});
