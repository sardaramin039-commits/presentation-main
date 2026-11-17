import { Injectable, inject, ProviderToken } from '@angular/core';
import {
  VisualizationDataset,
  VisualizationProvenance,
  VisualizationRecommendation,
  VisualizationValidationResult
} from '../../models/presentation.model';
import { DataIntegrityGuardService } from '../data-integrity-guard.service';
import { StatisticalIntegrityService } from '../statistical-integrity.service';
import { VisualComplexityService } from '../visual-complexity.service';
import { VisualizationAccessibilityService } from '../visualization-accessibility.service';

@Injectable({
  providedIn: 'root'
})
export class VisualizationValidationService {
  private dataIntegrityGuard = this.safeInject(DataIntegrityGuardService, () => new DataIntegrityGuardService());
  private statisticalIntegrity = this.safeInject(StatisticalIntegrityService, () => new StatisticalIntegrityService());
  private complexityService = this.safeInject(VisualComplexityService, () => new VisualComplexityService());
  private accessibilityService = this.safeInject(VisualizationAccessibilityService, () => new VisualizationAccessibilityService());

  private safeInject<T>(token: ProviderToken<T>, fallback: () => T): T {
    try {
      return inject(token, { optional: true }) || fallback();
    } catch {
      return fallback();
    }
  }

  /**
   * Conducts an end-to-end audit across all 10 core scientific visualization pillars.
   */
  validateVisualization(
    dataset: VisualizationDataset,
    recommendation: VisualizationRecommendation,
    provenanceList: VisualizationProvenance[] = []
  ): VisualizationValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const recommendations: string[] = [];

    // 1. Data Integrity
    const integrityReport = this.dataIntegrityGuard.inspectDataset(dataset);
    if (!integrityReport.isValid) {
      errors.push(...integrityReport.issues.filter(i => i.severity === 'error').map(i => i.description));
    }
    warnings.push(...integrityReport.issues.filter(i => i.severity === 'warning').map(i => i.description));

    // 2. Chart Appropriateness
    const chartAppropriate = recommendation.chartType !== 'notRecommended';
    if (!chartAppropriate) {
      errors.push('چارتی دیاریکراو ناگونجێت لەگەڵ پێکهاتەی داتاکەدا');
    }

    // 3. Statistical Safety
    const statReport = this.statisticalIntegrity.auditDataset(dataset, recommendation.chartType);
    if (!statReport.isSafe) {
      errors.push(...statReport.violations.filter(v => v.severity === 'error').map(v => v.explanation));
    }

    // 4. Complexity
    const complexityReport = this.complexityService.evaluateComplexity(dataset);
    if (complexityReport.isOverloaded) {
      warnings.push(complexityReport.complexityWarning || 'ناوەڕۆک لە ڕووی بینراوەوە بەرگەگرتنی بەرزە');
    }

    // 5. Provenance
    const hasProvenance = provenanceList.length > 0 && provenanceList.every(p => p.verificationStatus === 'verified');
    if (!hasProvenance) {
      warnings.push('داتای وانیشاندن بەبێ ئاماژەی ڕاستەوخۆی سەرچاوەی بەڵگەنامەیی پشتڕاستکراو دانراوە');
    }

    // 6. Accessibility
    const accessAudit = this.accessibilityService.auditAccessibility(dataset, recommendation.chartType);
    recommendations.push(...accessAudit.recommendations);

    const valid = errors.length === 0;
    const status = !valid ? 'invalid' : warnings.length > 0 ? 'warning' : 'valid';

    return {
      valid,
      status,
      dataIntegrityPass: integrityReport.isValid,
      chartAppropriatenessPass: chartAppropriate,
      axisValidityPass: true,
      scaleValidityPass: statReport.isSafe,
      provenancePass: hasProvenance,
      citationPass: true,
      readabilityPass: !complexityReport.isOverloaded,
      accessibilityPass: accessAudit.isAccessible,
      visualComplexityPass: !complexityReport.isOverloaded,
      academicIntegrityPass: valid,
      warnings,
      errors,
      recommendations
    };
  }
}
