import { VisualNecessityService } from '../visual-necessity.service';
import { SlidePlan } from '../../models/presentation.model';

describe('VisualNecessityService', () => {
  let service: VisualNecessityService;

  beforeEach(() => {
    service = new VisualNecessityService();
  });

  const mockSlide: SlidePlan = {
    slideNumber: 2,
    title: 'تێپەڕبوونی مێژوو لە ساڵی 1990 تا 2020',
    purpose: 'contextualize',
    slideType: 'context',
    layoutIntent: 'timeline',
    contentPlan: {
      supportingClaims: [],
      evidence: [],
      citations: [],
      keyTerms: [],
      explanation: 'زنجیرەی ڕووداوە مێژووییەکان لە ساڵی 1990 و 2000 و 2020',
      takeaway: '',
      blocks: []
    },
    evidenceMaps: [],
    citationMaps: [],
    densityStatus: 'optimal',
    speakerNotes: '',
    visualIntentHints: ['timeline'],
    dataVizType: 'timeline',
    imageRequired: false,
    traceabilityPath: 't2'
  };

  it('should evaluate necessity as not_needed for title slide', () => {
    const titleSlide = { ...mockSlide, slideType: 'title' as const };
    const req = service.evaluateNecessity(titleSlide);

    expect(req.necessity).toBe('not_needed');
    expect(req.primaryVisualType).toBe('text_only');
  });

  it('should evaluate necessity as required for temporal slide with historical dates', () => {
    const req = service.evaluateNecessity(mockSlide);

    expect(req.necessity).toBe('required');
    expect(req.primaryVisualType).toBe('timeline');
    expect(req.reason).toContain('Timeline');
  });
});
