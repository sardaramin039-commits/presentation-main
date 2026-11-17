import { Injectable, inject, ProviderToken } from '@angular/core';
import {
  SlidePlan,
  VisualDesignRequest,
  VisualDesignPlan,
  VisualComposition,
  CompositionLayoutType,
  VisualElement,
  AcademicLevel
} from '../../models/presentation.model';
import { VisualIntentService } from '../visual-intent.service';
import { VisualNecessityService } from '../visual-necessity.service';
import { DataVisualizationService } from '../data-visualization.service';
import { ChartRecommendationService } from '../chart-recommendation.service';
import { TableRecommendationService } from '../table-recommendation.service';
import { ImageIntentService } from '../image-intent.service';
import { SlideCompositionService } from '../slide-composition.service';
import { VisualDesignSystemService } from '../visual-design-system.service';
import { VisualDesignValidationService } from '../visual-design-validation.service';

@Injectable({
  providedIn: 'root'
})
export class SlideCompositionEngineService {
  private intentService = this.safeInject(VisualIntentService, () => new VisualIntentService());
  private necessityService = this.safeInject(VisualNecessityService, () => new VisualNecessityService());
  private dataVizService = this.safeInject(DataVisualizationService, () => new DataVisualizationService());
  private chartRecService = this.safeInject(ChartRecommendationService, () => new ChartRecommendationService());
  private tableRecService = this.safeInject(TableRecommendationService, () => new TableRecommendationService());
  private imageIntentService = this.safeInject(ImageIntentService, () => new ImageIntentService());
  private compositionService = this.safeInject(SlideCompositionService, () => new SlideCompositionService());
  private designSystemService = this.safeInject(VisualDesignSystemService, () => new VisualDesignSystemService());
  private validationService = this.safeInject(VisualDesignValidationService, () => new VisualDesignValidationService());

  private safeInject<T>(token: ProviderToken<T>, fallback: () => T): T {
    try {
      return inject(token, { optional: true }) || fallback();
    } catch {
      return fallback();
    }
  }

  /**
   * Generates a complete VisualDesignPlan for a full presentation request.
   */
  generateDesignPlan(request: VisualDesignRequest): VisualDesignPlan {
    const aspectRatio = request.aspectRatio || '16:9';
    const designSystem = this.designSystemService.getDesignSystem(request.academicLevel, aspectRatio);

    const slideCompositions: VisualComposition[] = [];
    const explainableDecisions: VisualDesignPlan['explainableDecisions'] = [];

    let overallValid = true;
    const allWarnings: string[] = [];

    for (const slide of request.slidePlans) {
      const { composition, rationale, layoutChosen } = this.processSlideComposition(slide, request.topic, request.academicLevel);

      slideCompositions.push(composition);
      explainableDecisions.push({
        slideNumber: slide.slideNumber,
        layoutChosen,
        rationale,
        evidenceLinked: slide.evidenceMaps.length > 0
      });

      const val = this.validationService.validateComposition(composition, slide);
      if (!val.valid) {
        overallValid = false;
      }
      allWarnings.push(...val.warnings);
    }

    return {
      presentationId: `design_plan_${Date.now()}`,
      aspectRatio,
      designSystem,
      slideCompositions,
      validation: {
        valid: overallValid,
        status: overallValid ? (allWarnings.length > 0 ? 'warning' : 'valid') : 'invalid',
        overflowDetected: false,
        collisionDetected: false,
        densityStatus: 'balanced',
        citationVisibilityPass: true,
        evidenceVisibilityPass: true,
        academicIntegrityPass: true,
        contentChangeRequired: false,
        warnings: allWarnings,
        errors: [],
        recommendations: []
      },
      explainableDecisions
    };
  }

  /**
   * Processes a single slide through the automatic visual design composition pipeline.
   */
  processSlideComposition(slide: SlidePlan, topic = '', academicLevel: AcademicLevel = 'bachelor'): {
    composition: VisualComposition;
    layoutChosen: CompositionLayoutType;
    rationale: string;
  } {
    // 0. Fetch design system for academic level
    this.designSystemService.getDesignSystem(academicLevel);
    // 1. Semantic Analysis & Visual Intent
    const intent = this.intentService.analyzeVisualIntent(slide);
    const necessity = this.necessityService.evaluateNecessity(slide, intent);

    // 2. Recommendations
    const chartRec = this.chartRecService.recommendChart(slide);
    const tableRec = this.tableRecService.recommendTable(slide);
    const imageIntent = this.imageIntentService.evaluateImageIntent(slide, topic);

    // 3. Select Layout Pattern
    const layoutChosen = this.selectOptimalLayout(slide, intent.informationType, chartRec.chartType, tableRec.tableRecommended, imageIntent.status);

    // 4. Construct Visual Elements
    const visualElements: VisualElement[] = [];

    if (chartRec.chartType !== 'chartNotRecommended' && chartRec.dataPresent) {
      const chartSpec = this.dataVizService.generateChartSpecification(slide);
      const evidenceLink = this.dataVizService.createEvidenceLink(`chart_${slide.slideNumber}`, slide);
      visualElements.push({
        id: `vis_chart_${slide.slideNumber}`,
        type: necessity.primaryVisualType,
        title: slide.title,
        chartSpec,
        evidenceLinks: evidenceLink ? [evidenceLink] : [],
        altText: `چارتی ${chartRec.chartType} بۆ سلایدی ${slide.title}`,
        semanticDescription: chartRec.rationale,
        accessibilityNotes: `پیشاندانی داتای ڕاستەقینەی بەڵگەنامەیی بە شێوەی چارت`
      });
    } else if (imageIntent.status === 'imageRequired' && imageIntent.imageSpec) {
      visualElements.push({
        id: `vis_img_${slide.slideNumber}`,
        type: 'image',
        title: slide.title,
        imageSpec: imageIntent.imageSpec,
        evidenceLinks: [],
        altText: `وێنەی ڕوونکردنەوەیی بۆ ${slide.title}`,
        semanticDescription: imageIntent.rationale,
        accessibilityNotes: `وێنەی بەڵگەنامەیی زانستی`
      });
    }

    // 5. Plan Spatial Composition
    const composition = this.compositionService.planComposition(slide, visualElements);
    composition.layoutPattern = layoutChosen;

    const rationale = `دیزاینی سلاید بە شێوەی ${layoutChosen} ڕێکخراوە: ${necessity.reason}`;

    return {
      composition,
      layoutChosen,
      rationale
    };
  }

  private selectOptimalLayout(
    slide: SlidePlan,
    infoType: string,
    chartType: string,
    isTable: boolean,
    imageStatus: string
  ): CompositionLayoutType {
    if (slide.slideType === 'title') return 'title';
    if (slide.slideType === 'reference') return 'title-content';
    if (slide.slideType === 'comparison' || infoType === 'comparison') return 'comparison';
    if (infoType === 'temporal') return 'timeline';
    if (infoType === 'sequential_process') return 'process';
    if (isTable) return 'table-focused';
    if (chartType !== 'chartNotRecommended') return 'chart-focused';
    if (imageStatus === 'imageRequired') return 'image-text';

    return 'title-content';
  }
}
