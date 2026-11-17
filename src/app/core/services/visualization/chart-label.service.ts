import { Injectable } from '@angular/core';

export interface ChartLabelPlan {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  unit?: string;
  legendRequired: boolean;
  sourceAttributionRequired: boolean;
  isValid: boolean;
  warnings: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChartLabelService {
  /**
   * Evaluates label clarity, source attribution requirements, and legibility.
   */
  planLabels(
    title: string,
    xField: string,
    yField: string,
    unit?: string,
    hasSourceEvidence = true
  ): ChartLabelPlan {
    const warnings: string[] = [];

    if (!title || title.trim().length === 0) {
      warnings.push('چارت ناونیشانی پێناسەکراوی نییە');
    }

    if (!xField) {
      warnings.push('تەوەرەی X ناونیشانی کێڵگەی نییە');
    }

    if (!yField) {
      warnings.push('تەوەرەی Y ناونیشانی کێڵگەی نییە');
    }

    return {
      title: title || 'چارتی زانیاری زانستی',
      xAxisLabel: xField || 'پۆلەکان',
      yAxisLabel: yField ? (unit ? `${yField} (${unit})` : yField) : 'بەهاکان',
      unit,
      legendRequired: false,
      sourceAttributionRequired: hasSourceEvidence,
      isValid: warnings.length === 0,
      warnings
    };
  }
}
