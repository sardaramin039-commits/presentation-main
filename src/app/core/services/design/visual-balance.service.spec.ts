import { VisualBalanceService } from '../visual-balance.service';
import { SlideDesignSpec } from '../../models/presentation.model';

describe('VisualBalanceService', () => {
  let service: VisualBalanceService;

  beforeEach(() => {
    service = new VisualBalanceService();
  });

  const mockDesignSpec: SlideDesignSpec = {
    slideNumber: 1,
    slideType: 'title',
    layout: {
      layoutType: 'two_column',
      zones: [
        { id: 'left_zone', name: 'Left', type: 'main_content', bounds: { topPct: 20, leftPct: 5, widthPct: 40, heightPct: 60 }, capacity: {}, contentIds: ['1', '2', '3', '4'] },
        { id: 'right_zone', name: 'Right', type: 'secondary_content', bounds: { topPct: 20, leftPct: 55, widthPct: 40, heightPct: 60 }, capacity: {}, contentIds: ['5'] }
      ],
      alignment: 'right',
      columnCount: 2,
      contentCapacityScore: 90,
      visualEmphasisZone: 'left_zone',
      rtl: true
    },
    visualHierarchy: {
      primaryMessage: 'Title',
      focalPointZoneId: 'left_zone',
      readingOrder: ['left_zone', 'right_zone'],
      emphasisLevels: { left_zone: 'high', right_zone: 'low' },
      informationDensityScore: 50
    },
    typography: { language: 'ckb', direction: 'rtl', slideTitle: { fontFamily: 'Vazirmatn', fontSizePx: 32, fontWeight: 700, lineHeightEm: 1.2, letterSpacingEm: 0, colorCss: '#000', alignment: 'right' } } as SlideDesignSpec['typography'],
    colorPalette: { name: 'emerald', theme: 'emerald', primary: '#000', secondary: '#000', accent: '#000', background: '#fff', surface: '#fff', text: '#000', mutedText: '#555', border: '#ccc', positive: '#0f0', warning: '#f00', negative: '#f00', contrastRatioScore: 100, academicAppropriatenessScore: 100 },
    spacing: { paddingPx: 20, marginPx: 20, itemGapPx: 10, sectionGapPx: 20, scaleFactor: 1 },
    grid: { slideWidthPx: 1920, slideHeightPx: 1080, margins: { top: 50, right: 50, bottom: 50, left: 50 }, safeZone: { top: 50, right: 50, bottom: 50, left: 50 }, columns: 2, columnWidthPx: 800, gutterWidthPx: 32, verticalRhythmPx: 24, alignmentGuides: [] },
    contentMappings: [],
    shapes: [],
    validation: { slideNumber: 1, status: 'pass', overflowRisk: false, densityStatus: 'optimal', contrastPass: true, hierarchyValid: true, citationVisible: true, provenanceIntact: true, findings: [] }
  };

  it('should evaluate visual balance across columns', () => {
    const result = service.evaluateBalance(mockDesignSpec);
    expect(result.balanceScore).toBeGreaterThan(0);
    expect(result).toBeDefined();
  });
});
