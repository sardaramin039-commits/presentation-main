import { VisualIntentService } from '../visual-intent.service';
import { SlidePlan, SlideType } from '../../models/presentation.model';

describe('VisualIntentService', () => {
  let service: VisualIntentService;

  beforeEach(() => {
    service = new VisualIntentService();
  });

  const createMockSlide = (title: string, text: string, type: SlideType = 'context'): SlidePlan => ({
    slideNumber: 1,
    title,
    purpose: 'explain',
    slideType: type,
    layoutIntent: 'bullet_summary',
    contentPlan: {
      supportingClaims: [],
      evidence: [],
      citations: [],
      keyTerms: [],
      explanation: text,
      takeaway: text,
      blocks: [{ id: 'b1', text, priority: 'essential', type: 'bullet' }]
    },
    evidenceMaps: [],
    citationMaps: [],
    densityStatus: 'optimal',
    speakerNotes: '',
    visualIntentHints: [],
    dataVizType: 'none',
    imageRequired: false,
    traceabilityPath: 't1'
  });

  it('should detect temporal information type for historical chronology', () => {
    const slide = createMockSlide('مێژووی پەرەسەندن', 'ئەم ڕووداوە لە ساڵی 1991 تێپەڕبوونی کات دەسەلمێنێت');
    const intent = service.analyzeVisualIntent(slide);

    expect(intent.informationType).toBe('temporal');
    expect(intent.primaryVisualCandidate).toBe('timeline');
  });

  it('should detect numerical comparison for percentages and stats', () => {
    const slide = createMockSlide('ڕێژەی گەشە', 'ڕێژەی سەدی 45% بەراورد بە 85% زیادیکردووە');
    const intent = service.analyzeVisualIntent(slide);

    expect(intent.informationType).toBe('numerical_comparison');
    expect(intent.primaryVisualCandidate).toBe('bar_chart');
  });

  it('should detect comparison information type', () => {
    const slide = createMockSlide('بەراوردی میتۆدەکان', 'جیاوازی و بەراوردی نێوان کلتورەکان', 'comparison');
    const intent = service.analyzeVisualIntent(slide);

    expect(intent.informationType).toBe('comparison');
    expect(intent.primaryVisualCandidate).toBe('comparison');
  });
});
