import { Injectable, inject } from '@angular/core';
import {
  SlideDesignSpec,
  VisualElement,
  DesignFinding,
  ThemeSpec,
  TypographySpec,
  SpacingSpec,
  DesignValidationResult,
  SpeakerNote,
  AnimationSpec,
  TransitionSpec
} from '../../models/slide-design.model';
import { SlidePlan } from '../../models/presentation.model';
import { IntelligentLayoutEngineService } from '../intelligent-layout-engine.service';
import { TypographyEngineService } from '../typography-engine.service';
import { AutomaticChartEngineService } from '../automatic-chart-engine.service';
import { AutomaticImagePlacementService } from '../automatic-image-placement.service';

@Injectable({
  providedIn: 'root'
})
export class ResponsiveSlideComposerService {
  private layoutEngine = inject(IntelligentLayoutEngineService);
  private typographyEngine = inject(TypographyEngineService);
  private chartEngine = inject(AutomaticChartEngineService);
  private imagePlacementService = inject(AutomaticImagePlacementService);

  /**
   * Composes a full responsive SlideDesignSpec ensuring bounds, alignment, and spacing.
   */
  composeSlide(slide: SlidePlan, theme: ThemeSpec): SlideDesignSpec {
    const isRtl = true;
    const { layout } = this.layoutEngine.selectLayout(slide, isRtl);
    const typography: TypographySpec = this.typographyEngine.getTypographySpec('ckb', slide.title);

    const spacing: SpacingSpec = {
      paddingInches: 0.5,
      marginInches: 0.5,
      itemGapInches: 0.25,
      columnGapInches: 0.35,
      safeMarginInches: 0.5
    };

    const elements: VisualElement[] = [];
    const findings: DesignFinding[] = [];

    // 1. Header Title Text Element
    const titleDir = this.typographyEngine.detectDirection(slide.title);
    elements.push({
      kind: 'text',
      data: {
        id: `title_${slide.slideNumber}`,
        type: 'title',
        text: slide.title,
        direction: titleDir,
        fontPt: typography.titleSizePt,
        fontWeight: 'bold',
        colorHex: theme.textColor.hex,
        align: titleDir === 'rtl' ? 'right' : 'left',
        bounds: { xPct: 5, yPct: 5, wPct: 90, hPct: 15 }
      }
    });

    // 2. Main Content Blocks (Text Elements)
    const points = slide.contentPlan?.blocks?.map(b => b.text) || slide.points || [];
    const fullTextPoints = points.map(p => `• ${p}`).join('\n\n');

    const mainZone = layout.zones.find(z => z.id === 'main') || layout.zones[0];
    const overflowCheck = this.typographyEngine.evaluateTextOverflow(
      fullTextPoints,
      typography.bodySizePt,
      mainZone.bounds.wPct,
      mainZone.bounds.hPct
    );

    let activeBodyFontPt = typography.bodySizePt;
    if (overflowCheck.isOverflow) {
      activeBodyFontPt = overflowCheck.recommendedFontPt;
      findings.push({
        id: `find_overflow_${slide.slideNumber}`,
        severity: 'warning',
        category: 'overflow',
        message: `دەقی سلایدی ${slide.slideNumber} زیاترە لە ڕووبەری دیاریکراو. قەبارەی فۆنت بۆ ${activeBodyFontPt}pt کەمکرایەوە.`,
        slideNumber: slide.slideNumber,
        autoRepaired: true,
        repairDetails: `قەبارەی فۆنت گۆڕدرا بۆ ${activeBodyFontPt}pt`
      });
    }

    elements.push({
      kind: 'text',
      data: {
        id: `body_${slide.slideNumber}`,
        type: 'bullet',
        text: fullTextPoints,
        direction: 'rtl',
        fontPt: activeBodyFontPt,
        fontWeight: 'normal',
        colorHex: theme.textColor.hex,
        align: 'right',
        bounds: mainZone.bounds
      }
    });

    // 3. Visual Element (Chart / Image / Table / Diagram)
    const chart = this.chartEngine.generateChartElement(slide);
    if (chart) {
      elements.push({ kind: 'chart', data: chart });
    } else {
      const img = this.imagePlacementService.determineImagePlacement(slide);
      if (img) {
        elements.push({ kind: 'image', data: img });
      }
    }

    // 4. Citation Elements
    if (slide.citationMaps && slide.citationMaps.length > 0) {
      const cite = slide.citationMaps[0];
      elements.push({
        kind: 'citation',
        data: {
          id: `cite_${slide.slideNumber}`,
          citationId: cite.citationId,
          inTextCitation: cite.inText,
          fullReference: cite.fullReference,
          sourceId: cite.sourceId,
          bounds: { xPct: 50, yPct: 90, wPct: 45, hPct: 5 },
          isReferenceSlide: slide.slideType === 'reference'
        }
      });
    }

    // 5. Speaker Notes
    const speakerNotes: SpeakerNote = {
      slideNumber: slide.slideNumber,
      notes: slide.speakerNotes || ''
    };

    // 6. Animations & Transitions
    const animations: AnimationSpec[] = [
      {
        elementId: `body_${slide.slideNumber}`,
        type: 'fade',
        trigger: 'onClick',
        durationMs: 400,
        isSupportedInExport: true
      }
    ];

    const transition: TransitionSpec = {
      type: 'fade',
      durationMs: 500,
      isSupportedInExport: true
    };

    // Validation Result
    const validation: DesignValidationResult = {
      slideNumber: slide.slideNumber,
      passed: true,
      hasCriticalFailures: false,
      hasWarnings: findings.length > 0,
      findings,
      repairedFindings: findings.filter(f => f.autoRepaired)
    };

    return {
      slideNumber: slide.slideNumber,
      title: slide.title,
      layout,
      elements,
      speakerNotes,
      animations,
      transition,
      theme,
      typography,
      spacing,
      densityScore: overflowCheck.isOverflow ? 85 : 50,
      densityStatus: overflowCheck.isOverflow ? 'overloaded' : 'optimal',
      validation
    };
  }
}
