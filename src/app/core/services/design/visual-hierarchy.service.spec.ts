import { VisualHierarchyService } from '../visual-hierarchy.service';
import { SlidePlan, SlideLayoutSpec } from '../../models/presentation.model';

describe('VisualHierarchyService', () => {
  let service: VisualHierarchyService;

  beforeEach(() => {
    service = new VisualHierarchyService();
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
      keyTerms: [],
      explanation: 'ڕوونکردنەوە',
      takeaway: 'دەرئەنجام',
      blocks: [{ id: 'b1', text: 'سەردێڕ', priority: 'essential', type: 'heading' }]
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

  const mockLayout: SlideLayoutSpec = {
    layoutType: 'title_only',
    zones: [
      { id: 'h1', name: 'Header', type: 'header', bounds: { topPct: 0, leftPct: 0, widthPct: 100, heightPct: 20 }, capacity: {}, contentIds: ['b1'] }
    ],
    alignment: 'right',
    columnCount: 1,
    contentCapacityScore: 100,
    visualEmphasisZone: 'h1',
    rtl: true
  };

  it('should establish correct visual hierarchy', () => {
    const hierarchy = service.establishHierarchy(mockSlidePlan, mockLayout);
    expect(hierarchy.primaryMessage).toBe('دەستپێکی توێژینەوە');
    expect(hierarchy.focalPointZoneId).toBe('h1');
    expect(hierarchy.emphasisLevels['h1']).toBe('high');
  });
});
