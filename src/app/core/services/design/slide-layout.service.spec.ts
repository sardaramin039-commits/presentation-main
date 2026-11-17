import { SlideLayoutService } from '../slide-layout.service';
import { SlidePlan } from '../../models/presentation.model';

describe('SlideLayoutService', () => {
  let service: SlideLayoutService;

  beforeEach(() => {
    service = new SlideLayoutService();
  });

  const mockSlidePlan: SlidePlan = {
    slideNumber: 1,
    title: 'دەستپێکی توێژینەوە',
    purpose: 'introduce',
    slideType: 'title',
    layoutIntent: 'title_hero',
    contentPlan: {
      supportingClaims: [],
      evidence: [],
      citations: [],
      keyTerms: ['تەکنەلۆژیا'],
      explanation: 'ڕوونکردنەوەی دەستپێک',
      takeaway: 'دەرئەنجام',
      blocks: [
        { id: 'b1', text: 'سەردێڕی سەرەکی', priority: 'essential', type: 'heading' }
      ]
    },
    evidenceMaps: [],
    citationMaps: [],
    densityStatus: 'optimal',
    speakerNotes: 'تێبینی',
    visualIntentHints: ['conceptual_diagram'],
    dataVizType: 'none',
    imageRequired: false,
    traceabilityPath: 'intro'
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate title_only layout for title slide', () => {
    const layout = service.generateLayoutSpec(mockSlidePlan, true);
    expect(layout.layoutType).toBe('title_only');
    expect(layout.rtl).toBe(true);
    expect(layout.zones.length).toBeGreaterThan(0);
  });

  it('should generate chart layout when dataVizType is bar_chart', () => {
    const chartSlide: SlidePlan = {
      ...mockSlidePlan,
      slideType: 'data',
      dataVizType: 'bar_chart'
    };
    const layout = service.generateLayoutSpec(chartSlide, true);
    expect(layout.layoutType).toBe('chart');
    expect(layout.zones.some(z => z.type === 'visual_container')).toBe(true);
  });
});
