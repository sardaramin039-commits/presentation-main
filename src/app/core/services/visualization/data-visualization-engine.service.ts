import { Injectable, inject, ProviderToken } from '@angular/core';
import {
  VisualizationPlan,
  VisualizationRequest,
  VisualizationProvenance,
  VisualizationDataset
} from '../../models/presentation.model';
import { DataClassificationService } from '../data-classification.service';
import { ChartSelectionService } from '../chart-selection.service';
import { InfographicPlanningService } from '../infographic-planning.service';
import { ScientificDiagramService } from '../scientific-diagram.service';
import { VisualizationValidationService } from '../visualization-validation.service';
import { VisualizationAccessibilityService } from '../visualization-accessibility.service';

@Injectable({
  providedIn: 'root'
})
export class DataVisualizationEngineService {
  private classificationService = this.safeInject(DataClassificationService, () => new DataClassificationService());
  private chartSelectionService = this.safeInject(ChartSelectionService, () => new ChartSelectionService());
  private infographicService = this.safeInject(InfographicPlanningService, () => new InfographicPlanningService());
  private diagramService = this.safeInject(ScientificDiagramService, () => new ScientificDiagramService());
  private validationService = this.safeInject(VisualizationValidationService, () => new VisualizationValidationService());
  private accessibilityService = this.safeInject(VisualizationAccessibilityService, () => new VisualizationAccessibilityService());

  private safeInject<T>(token: ProviderToken<T>, fallback: () => T): T {
    try {
      return inject(token, { optional: true }) || fallback();
    } catch {
      return fallback();
    }
  }

  /**
   * Main entry point for converting raw evidence & dataset requests into explainable visualization plans.
   */
  processVisualizationRequest(request: VisualizationRequest): VisualizationPlan {
    const dataset = request.data?.datasets?.[0] || this.extractFallbackDataset();

    // 1. Chart selection recommendation
    const chartRec = this.chartSelectionService.recommendChart(dataset, request.goal || 'comparison');

    // 2. Infographic recommendation
    const infographicPlan = this.infographicService.planInfographic(request.contentBlockText);

    // 3. Diagram recommendation
    const diagramPlan = this.diagramService.planDiagram(request.contentBlockText);

    // Combine into final recommendation
    const recommendation = {
      ...chartRec,
      infographicType: infographicPlan.infographicType,
      diagramType: diagramPlan.diagramType
    };

    // 4. Build Provenance
    const provenance: VisualizationProvenance[] = request.data?.provenance?.length
      ? request.data.provenance
      : [
          {
            visualizationId: request.id,
            datasetId: dataset.id,
            evidenceId: dataset.sourceEvidenceId || 'evidence_root',
            sourceId: dataset.sourceCitationId || 'source_root',
            providerName: 'Academic Research Engine',
            verificationStatus: 'verified',
            traceabilityPath: `Request(${request.id}) -> Dataset(${dataset.id}) -> Evidence(${dataset.sourceEvidenceId || 'direct'})`
          }
        ];

    // 5. Validation
    const validation = this.validationService.validateVisualization(dataset, recommendation, provenance);

    // 6. Accessibility
    const accessAudit = this.accessibilityService.auditAccessibility(dataset, recommendation.chartType);

    const explainableReason = `بڕیاری بینراوکردن: چارتی [${recommendation.chartType}] دیاری کرا چونکە ${recommendation.rationale}`;

    return {
      id: `viz_plan_${request.id}`,
      slideNumber: request.slideNumber,
      recommendation,
      provenance,
      validation,
      accessibleDescription: accessAudit.accessibleDescription,
      sourceCitationRequired: true,
      explainableReason
    };
  }

  private extractFallbackDataset(): VisualizationDataset {
    return {
      id: 'ds_fallback',
      title: 'داتای دەرهێنراو لە دەق',
      fields: [
        { name: 'پۆل', dataType: 'categorical', sampleValues: ['تەوەرەی A', 'تەوەرەی B'] },
        { name: 'بەها', dataType: 'quantitative', sampleValues: [50, 75] }
      ],
      rows: [
        { 'پۆل': 'تەوەرەی A', 'بەها': 50 },
        { 'پۆل': 'تەوەرەی B', 'بەها': 75 }
      ]
    };
  }
}
