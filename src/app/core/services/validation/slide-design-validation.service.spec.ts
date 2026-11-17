import { TestBed } from '@angular/core/testing';
import { SlideDesignValidationService } from '../slide-design-validation.service';
import { SlideDesignSpec, SlidePlan } from '../../models/presentation.model';

describe('SlideDesignValidationService', () => {
  let service: SlideDesignValidationService;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      service = new SlideDesignValidationService();
    });
  });

  const mockSlidePlan: SlidePlan = {
    slideNumber: 1,
    title: 'تەوەرەی سەرەکی',
    purpose: 'introduce',
    slideType: 'title',
    layoutIntent: 'title_hero',
    contentPlan: {
      supportingClaims: [],
      evidence: [],
      citations: [],
      keyTerms: [],
      explanation: '',
      takeaway: '',
      blocks: [{ id: 'b1', text: 'سەردێڕی کورت', priority: 'essential', type: 'heading' }]
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

  const mockSlideSpec: SlideDesignSpec = {
    slideNumber: 1,
    slideType: 'title',
    layout: {
      layoutType: 'title_only',
      zones: [{ id: 'z1', name: 'Header', type: 'header', bounds: { topPct: 0, leftPct: 0, widthPct: 100, heightPct: 20 }, capacity: {}, contentIds: ['b1'] }],
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
      emphasisLevels: { z1: 'high' },
      informationDensityScore: 20
    },
    typography: { language: 'ckb', direction: 'rtl', slideTitle: { fontFamily: 'Vazirmatn', fontSizePx: 32, fontWeight: 700, lineHeightEm: 1.2, letterSpacingEm: 0, colorCss: '#0f172a', alignment: 'right' } } as SlideDesignSpec['typography'],
    colorPalette: { text: '#0f172a', surface: '#ffffff', name: 'emerald', theme: 'emerald', primary: '#000', secondary: '#000', accent: '#000', background: '#fff', mutedText: '#555', border: '#ccc', positive: '#0f0', warning: '#f00', negative: '#f00', contrastRatioScore: 100, academicAppropriatenessScore: 100 },
    spacing: { paddingPx: 20, marginPx: 20, itemGapPx: 10, sectionGapPx: 20, scaleFactor: 1 },
    grid: { slideWidthPx: 1920, slideHeightPx: 1080, margins: { top: 50, right: 50, bottom: 50, left: 50 }, safeZone: { top: 50, right: 50, bottom: 50, left: 50 }, columns: 1, columnWidthPx: 1600, gutterWidthPx: 32, verticalRhythmPx: 24, alignmentGuides: [] },
    contentMappings: [],
    shapes: [],
    validation: { slideNumber: 1, status: 'pass', overflowRisk: false, densityStatus: 'optimal', contrastPass: true, hierarchyValid: true, citationVisible: true, provenanceIntact: true, findings: [] }
  };

  it('should validate slide design as pass for optimal slide', () => {
    const res = service.validateSlideDesign(mockSlideSpec, mockSlidePlan);
    expect(res.status).toBe('pass');
    expect(res.contrastPass).toBe(true);
    expect(res.provenanceIntact).toBe(true);
  });
});
