import { SlideCompositionService } from '../slide-composition.service';
import { SlidePlan } from '../../models/presentation.model';

describe('SlideCompositionService', () => {
  let service: SlideCompositionService;

  beforeEach(() => {
    service = new SlideCompositionService();
  });

  const mockSlide: SlidePlan = {
    slideNumber: 4,
    title: 'شیکاری بەراوردکاری',
    purpose: 'compare',
    slideType: 'comparison',
    layoutIntent: 'two_column',
    contentPlan: {
      supportingClaims: [],
      evidence: [],
      citations: [],
      keyTerms: [],
      explanation: 'دەقی روونکردنەوە',
      takeaway: '',
      blocks: []
    },
    evidenceMaps: [],
    citationMaps: [],
    densityStatus: 'optimal',
    speakerNotes: '',
    visualIntentHints: ['comparison'],
    dataVizType: 'comparison_matrix',
    imageRequired: false,
    traceabilityPath: 't4'
  };

  it('should plan two_column visual composition for comparison slide with visual elements', () => {
    const comp = service.planComposition(mockSlide, [
      {
        id: 'v1',
        type: 'comparison',
        title: 'ماتریس',
        evidenceLinks: [],
        altText: 'matrix',
        semanticDescription: 'matrix',
        accessibilityNotes: ''
      }
    ]);

    expect(comp.layoutPattern).toBe('two_column');
    expect(comp.titleRegion.topPct).toBeLessThan(20);
    expect(comp.visualRegion.widthPct).toBeGreaterThan(0);
    expect(comp.cognitiveLoadStatus).toBe('balanced');
  });
});
