import { Injectable } from '@angular/core';
import {
  SlidePlan,
  DataVisualizationSpec,
  DataVizType,
  ChartSpecification,
  VisualEvidenceLink,
  VisualDataStatus,
  VisualType
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class DataVisualizationService {
  /**
   * Generates a DataVisualizationSpec based on real slide evidence and content without fabricating values.
   */
  generateDataVizSpec(slide: SlidePlan): DataVisualizationSpec | undefined {
    if (slide.dataVizType === 'none') {
      return undefined;
    }

    const title = slide.dataVizDescription || `${slide.title} - شیکاری دراوە`;
    const chartType = slide.dataVizType;

    // Check if real evidence contains extracted numerical or structured data
    const realEvidence = slide.contentPlan.evidence.find(e => e.extractedSnippet && e.extractedSnippet.length > 0);
    const hasRealData = !!realEvidence;
    const provenanceId = realEvidence?.id;

    return {
      chartType,
      title,
      xAxisLabel: this.getXAxisLabel(chartType),
      yAxisLabel: this.getYAxisLabel(chartType),
      series: undefined, // No fake numbers created!
      categories: undefined,
      hasRealData,
      provenanceId,
      recommendedWidthPct: 45,
      recommendedHeightPct: 65,
      isFactual: hasRealData
    };
  }

  /**
   * Generates a strict ChartSpecification for BATCH 12 visual intelligence architecture.
   */
  generateChartSpecification(slide: SlidePlan): ChartSpecification | undefined {
    if (slide.dataVizType === 'none') {
      return undefined;
    }

    const visualType = this.mapDataVizToVisualType(slide.dataVizType);
    const evidence = slide.contentPlan.evidence[0];
    const citationMap = slide.citationMaps[0];
    const evidenceMap = slide.evidenceMaps[0];

    let dataStatus: VisualDataStatus = 'data_missing';
    if (evidence) {
      if (evidenceMap?.verificationStatus === 'verified') {
        dataStatus = 'verified';
      } else {
        dataStatus = 'unverified_data';
      }
    }

    const accessibilityDescription = evidence
      ? `چارتی ${slide.dataVizType} نیشاندانی داتای پاشکۆی ئەکادیمی: ${evidence.extractedSnippet.substring(0, 100)}`
      : `چارتی ${slide.dataVizType} - بەهۆی نەبوونی داتای فاکتی نەگیراو، ڕووکاری ڕێنماییکەر نیشاندراوە بێ بەکار هێنانی ژمارەی خەیاڵی.`;

    return {
      id: `chart_${slide.slideNumber}_${Date.now()}`,
      type: visualType,
      title: slide.dataVizDescription || `${slide.title} - ئاماری فاکتی`,
      xAxisLabel: this.getXAxisLabel(slide.dataVizType),
      yAxisLabel: this.getYAxisLabel(slide.dataVizType),
      series: undefined, // CRITICAL: NEVER FABRICATE NUMBERS
      categories: undefined,
      source: citationMap?.fullReference || evidenceMap?.sourceTitle,
      evidenceId: evidence?.id,
      citation: citationMap?.inText,
      accessibilityDescription,
      dataStatus
    };
  }

  /**
   * Creates a VisualEvidenceLink mapping between a visual element and academic backing.
   */
  createEvidenceLink(visualId: string, slide: SlidePlan): VisualEvidenceLink | undefined {
    const evidenceMap = slide.evidenceMaps[0];
    if (!evidenceMap) {
      return undefined;
    }

    return {
      visualId,
      claimId: evidenceMap.claimId,
      evidenceId: evidenceMap.evidenceId,
      sourceId: evidenceMap.sourceId,
      citationId: evidenceMap.citationId,
      claimStatement: evidenceMap.claimStatement,
      evidenceSnippet: evidenceMap.evidenceSnippet,
      verificationStatus: evidenceMap.verificationStatus,
      sourceTitle: evidenceMap.sourceTitle
    };
  }

  /**
   * Recommends optimal chart type for given data domain description.
   */
  recommendChartType(description: string): DataVizType {
    const text = description.toLowerCase();
    if (text.includes('کات') || text.includes('زنجیرە') || text.includes('ساڵ') || text.includes('گەشە') || text.includes('trend')) {
      return 'line_chart';
    }
    if (text.includes('بەراورد') || text.includes('کۆڵۆم') || text.includes('پلە') || text.includes('compare')) {
      return 'bar_chart';
    }
    if (text.includes('پشک') || text.includes('ڕێژە') || text.includes('دابەشبوون') || text.includes('share')) {
      return 'pie_chart';
    }
    if (text.includes('خشتە') || text.includes('لیست') || text.includes('table')) {
      return 'table';
    }
    if (text.includes('مێژوو') || text.includes('ڕووداو') || text.includes('timeline')) {
      return 'timeline';
    }
    if (text.includes('ماتریس') || text.includes('تایبەتمەندی') || text.includes('matrix')) {
      return 'comparison_matrix';
    }
    return 'bar_chart';
  }

  private mapDataVizToVisualType(type: DataVizType): VisualType {
    switch (type) {
      case 'bar_chart':
        return 'bar_chart';
      case 'line_chart':
        return 'line_chart';
      case 'pie_chart':
        return 'pie_chart';
      case 'table':
        return 'table';
      case 'timeline':
        return 'timeline';
      case 'comparison_matrix':
        return 'matrix';
      default:
        return 'chart';
    }
  }

  private getXAxisLabel(type: DataVizType): string | undefined {
    if (type === 'line_chart' || type === 'timeline') return 'سەردەم / کات';
    if (type === 'bar_chart') return 'کۆمەڵەکان';
    return undefined;
  }

  private getYAxisLabel(type: DataVizType): string | undefined {
    if (type === 'line_chart' || type === 'bar_chart') return 'بڕ / ڕێژە';
    return undefined;
  }
}
