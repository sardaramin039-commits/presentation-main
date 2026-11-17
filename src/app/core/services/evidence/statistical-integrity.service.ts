import { Injectable } from '@angular/core';
import { VisualizationDataset } from '../../models/presentation.model';

export interface StatisticalViolation {
  rule:
    | 'misleadingAxis'
    | 'truncatedAxis'
    | 'inconsistentUnits'
    | 'falsePrecision'
    | 'inappropriateChartType'
    | 'unsupportedAggregation'
    | 'unsupportedNormalization';
  severity: 'error' | 'warning';
  explanation: string;
}

export interface StatisticalIntegrityReport {
  isSafe: boolean;
  violations: StatisticalViolation[];
  explanation: string;
}

@Injectable({
  providedIn: 'root'
})
export class StatisticalIntegrityService {
  /**
   * Guards against statistical dishonesty, false precision, and unsupported mathematical aggregations.
   */
  auditDataset(dataset: VisualizationDataset, chartType: string): StatisticalIntegrityReport {
    const violations: StatisticalViolation[] = [];

    if (!dataset || dataset.rows.length === 0) {
      return {
        isSafe: true,
        violations: [],
        explanation: 'داتاسێت بەتاڵە'
      };
    }

    // Check false precision (e.g., 8 decimals when data is coarse)
    for (const field of dataset.fields) {
      for (const row of dataset.rows) {
        const val = row[field.name];
        if (typeof val === 'number') {
          const str = String(val);
          if (str.includes('.') && str.split('.')[1].length > 4) {
            violations.push({
              rule: 'falsePrecision',
              severity: 'warning',
              explanation: `ژمارەی خاڵە دەیەکییەکان لە کێڵگەی "${field.name}" زۆر بەرزە (${str}) کە دەبێتە هۆی وەهمی وردبینی زێدەڕەویکراو`
            });
            break;
          }
        }
      }
    }

    // Check pie chart sum exceeding or far under 100%
    if (chartType === 'pie' || chartType === 'donut') {
      const numericField = dataset.fields.find(f => f.dataType === 'quantitative' || f.dataType === 'continuous');
      if (numericField) {
        const values = dataset.rows.map(r => Number(r[numericField.name])).filter(v => !isNaN(v));
        const sum = values.reduce((a, b) => a + b, 0);
        if (Math.abs(sum - 100) > 1 && dataset.fields.some(f => f.name.includes('%') || f.name.includes('percent'))) {
          violations.push({
            rule: 'unsupportedNormalization',
            severity: 'error',
            explanation: `کۆیی بەها ڕێژەییەکان یەکسان نییە بە ١٠٠٪ (کۆی گشتی = ${sum})؛ چارتی بازنەیی پێکداچوون دروست دەکات`
          });
        }
      }
    }

    const hasErrors = violations.some(v => v.severity === 'error');

    return {
      isSafe: !hasErrors,
      violations,
      explanation: hasErrors
        ? 'پشکنینی ئاماریی پێشێلکاری جدی نیشان دەدات؛ پێویستە چارت بگەڕێندرێتەوە بۆ باری تەندروست'
        : violations.length > 0
        ? 'ئاگاداری ئاماری هەیە بەڵام زیان بە نیشاندانی گشتی ناگەیەنێت'
        : 'سەرجەم پێوەرە ئامارییەکان بەتەواوی پارێزراون'
    };
  }
}
