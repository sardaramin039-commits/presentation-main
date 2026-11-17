import { SlideDensityService } from '../slide-density.service';
import { SlidePlan } from '../../models/presentation.model';

describe('SlideDensityService', () => {
  let service: SlideDensityService;

  beforeEach(() => {
    service = new SlideDensityService();
  });

  const normalSlidePlan: SlidePlan = {
    slideNumber: 1,
    title: 'کورتییەکی گشتی',
    purpose: 'explain',
    slideType: 'context',
    layoutIntent: 'bullet_summary',
    contentPlan: {
      supportingClaims: [],
      evidence: [],
      citations: [],
      keyTerms: [],
      explanation: 'ڕوونکردنەوە',
      takeaway: 'دەرئەنجام',
      blocks: [
        { id: 'b1', text: 'خاڵی یەکەم دەربارەی بابەتەکە', priority: 'essential', type: 'bullet' },
        { id: 'b2', text: 'خاڵی دووەم بۆ ڕوونکردنەوە', priority: 'important', type: 'bullet' }
      ]
    },
    evidenceMaps: [],
    citationMaps: [],
    densityStatus: 'optimal',
    speakerNotes: '',
    visualIntentHints: [],
    dataVizType: 'none',
    imageRequired: false,
    traceabilityPath: ''
  };

  it('should evaluate density status for concise slide', () => {
    const res = service.analyzeDensity(normalSlidePlan);
    expect(res.densityStatus).toBe('spacious');
    expect(res.findings.length).toBe(0);
  });

  it('should report overloaded density when slide has excessive words and bullets', () => {
    const wordyBlocks = Array.from({ length: 10 }, (_, i) => ({
      id: `b_${i}`,
      text: `ئەمە دەقێکی زۆر درێژ و پر وشەیە کە لەگەڵ چەندین خاڵی تردا دەبێتە هۆی لۆدکردنی زۆری سڵایدەکە و تێکدانی هاوسەنگی بینراو ${i}`,
      priority: 'important' as const,
      type: 'bullet' as const
    }));

    const overloadedSlide = {
      ...normalSlidePlan,
      contentPlan: {
        ...normalSlidePlan.contentPlan,
        blocks: wordyBlocks
      }
    };

    const res = service.analyzeDensity(overloadedSlide);
    expect(res.densityStatus).toBe('overloaded');
    expect(res.findings.some(f => f.category === 'density')).toBe(true);
  });
});
