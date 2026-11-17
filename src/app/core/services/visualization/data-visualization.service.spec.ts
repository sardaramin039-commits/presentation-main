import { DataVisualizationService } from '../data-visualization.service';
import { SlidePlan } from '../../models/presentation.model';

describe('DataVisualizationService', () => {
  let service: DataVisualizationService;

  beforeEach(() => {
    service = new DataVisualizationService();
  });

  const mockSlidePlan: SlidePlan = {
    slideNumber: 3,
    title: 'شیکاری ڕێژەی سەرکەوتن',
    purpose: 'analyze',
    slideType: 'data',
    layoutIntent: 'data_viz',
    contentPlan: {
      supportingClaims: [],
      evidence: [
        {
          id: 'ev1',
          claimId: 'c1',
          sourceId: 's1',
          evidenceType: 'statistical',
          extractedSnippet: 'ڕێژەی گەشە ٪۸٥ بەپێی ئاماری ۲۰۲٤',
          location: { page: '12' },
          confidenceScore: 0.95,
          verificationStatus: 'verified',
          provenance: { sourceProvider: 'internal', retrievalTimestamp: '2026', transformationHistory: [] }
        }
      ],
      citations: [],
      keyTerms: [],
      explanation: 'شیکاری ئاماری',
      takeaway: 'گەشەی بەرچاو',
      blocks: []
    },
    evidenceMaps: [],
    citationMaps: [],
    densityStatus: 'optimal',
    speakerNotes: '',
    visualIntentHints: ['quantitative_data'],
    dataVizType: 'bar_chart',
    dataVizDescription: 'ڕێژەی گەشەی ئابووری',
    imageRequired: false,
    traceabilityPath: ''
  };

  it('should generate DataVizSpec without fabricating numbers', () => {
    const spec = service.generateDataVizSpec(mockSlidePlan);
    expect(spec).toBeDefined();
    expect(spec?.chartType).toBe('bar_chart');
    expect(spec?.hasRealData).toBeTrue();
    expect(spec?.series).toBeUndefined(); // Strictly no fake numbers
  });

  it('should recommend line_chart for time series description', () => {
    const chartType = service.recommendChartType('گۆڕانکارییەکانی ساڵانی ۲۰۲۰ تا ۲۰۲٤');
    expect(chartType).toBe('line_chart');
  });
});
