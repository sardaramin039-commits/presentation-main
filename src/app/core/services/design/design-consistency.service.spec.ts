import { DesignConsistencyService } from '../design-consistency.service';
import { SlideDesignSpec } from '../../models/presentation.model';

describe('DesignConsistencyService', () => {
  let service: DesignConsistencyService;

  beforeEach(() => {
    service = new DesignConsistencyService();
  });

  const createMockSlideSpec = (slideNumber: number, theme: string, lang: string): SlideDesignSpec => ({
    slideNumber,
    slideType: 'title',
    layout: {
      layoutType: 'title_content',
      zones: [],
      alignment: 'right',
      columnCount: 1,
      contentCapacityScore: 100,
      visualEmphasisZone: 'z1',
      rtl: true
    },
    visualHierarchy: {
      primaryMessage: 'Title',
      focalPointZoneId: 'z1',
      readingOrder: ['z1'],
      emphasisLevels: {},
      informationDensityScore: 50
    },
    typography: {
      language: lang,
      direction: 'rtl',
      slideTitle: { fontFamily: 'Vazirmatn', fontSizePx: 32, fontWeight: 700, lineHeightEm: 1.2, letterSpacingEm: 0, colorCss: '#000', alignment: 'right' }
    } as SlideDesignSpec['typography'],
    colorPalette: {
      theme,
      name: theme,
      primary: '#000',
      secondary: '#000',
      accent: '#000',
      background: '#fff',
      surface: '#fff',
      text: '#000',
      mutedText: '#555',
      border: '#ccc',
      positive: '#0f0',
      warning: '#f00',
      negative: '#f00',
      contrastRatioScore: 100,
      academicAppropriatenessScore: 100
    },
    spacing: { paddingPx: 20, marginPx: 20, itemGapPx: 10, sectionGapPx: 20, scaleFactor: 1 },
    grid: { slideWidthPx: 1920, slideHeightPx: 1080, margins: { top: 50, right: 50, bottom: 50, left: 50 }, safeZone: { top: 50, right: 50, bottom: 50, left: 50 }, columns: 1, columnWidthPx: 1600, gutterWidthPx: 32, verticalRhythmPx: 24, alignmentGuides: [] },
    contentMappings: [],
    shapes: [],
    validation: { slideNumber, status: 'pass', overflowRisk: false, densityStatus: 'optimal', contrastPass: true, hierarchyValid: true, citationVisible: true, provenanceIntact: true, findings: [] }
  });

  it('should evaluate 100% consistency when themes match', () => {
    const slides = [createMockSlideSpec(1, 'emerald', 'ckb'), createMockSlideSpec(2, 'emerald', 'ckb')];
    const res = service.evaluateConsistency(slides);
    expect(res.consistencyScore).toBe(100);
    expect(res.findings.length).toBe(0);
  });

  it('should detect inconsistency when theme changes across slides', () => {
    const slides = [createMockSlideSpec(1, 'emerald', 'ckb'), createMockSlideSpec(2, 'cosmic', 'ckb')];
    const res = service.evaluateConsistency(slides);
    expect(res.consistencyScore).toBeLessThan(100);
    expect(res.findings.some(f => f.category === 'consistency')).toBe(true);
  });
});
