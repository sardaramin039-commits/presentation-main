import { TableRecommendationService } from '../table-recommendation.service';
import { SlidePlan } from '../../models/presentation.model';

describe('TableRecommendationService', () => {
  let service: TableRecommendationService;

  beforeEach(() => {
    service = new TableRecommendationService();
  });

  const createMockSlide = (title: string, text: string, dataVizType: SlidePlan['dataVizType'] = 'none'): SlidePlan => ({
    slideNumber: 2,
    title,
    purpose: 'explain',
    slideType: 'context',
    layoutIntent: 'bullet_summary',
    contentPlan: {
      supportingClaims: [],
      evidence: [],
      citations: [],
      keyTerms: [],
      explanation: text,
      takeaway: '',
      blocks: [
        { id: 'b1', text: 'ڕێزی یەکەم', priority: 'essential', type: 'bullet' },
        { id: 'b2', text: 'ڕێزی دووەم', priority: 'essential', type: 'bullet' }
      ]
    },
    evidenceMaps: [],
    citationMaps: [],
    densityStatus: 'optimal',
    speakerNotes: '',
    visualIntentHints: [],
    dataVizType,
    imageRequired: false,
    traceabilityPath: 't2'
  });

  it('should return false for slides without tabular structure or matrix request', () => {
    const slide = createMockSlide('ناساندن', 'ئەمە دەقێکی ئاساییە');
    const res = service.recommendTable(slide);

    expect(res.tableRecommended).toBe(false);
  });

  it('should recommend table when dataVizType is table or comparison_matrix', () => {
    const slide = createMockSlide('خشتەی تایبەتمەندییەکان', 'خشتە و ماتریس', 'table');
    const res = service.recommendTable(slide);

    expect(res.tableRecommended).toBe(true);
    expect(res.rowCount).toBeGreaterThan(0);
  });
});
