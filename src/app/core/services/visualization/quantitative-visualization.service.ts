import { Injectable } from '@angular/core';
import { VisualizationDataset } from '../../models/presentation.model';

export type QuantitativeDisplayType = 'metricCallout' | 'chart' | 'table' | 'textSummary';

export interface QuantitativeVisualPlan {
  displayType: QuantitativeDisplayType;
  primaryValue?: string;
  unit?: string;
  label?: string;
  rationale: string;
}

@Injectable({
  providedIn: 'root'
})
export class QuantitativeVisualizationService {
  /**
   * Decides whether quantitative data should be rendered as a metric highlight, chart, table, or text.
   */
  planQuantitativeVisual(dataset?: VisualizationDataset, textContent?: string): QuantitativeVisualPlan {
    if (dataset && dataset.rows.length > 0) {
      if (dataset.rows.length === 1) {
        const firstRow = dataset.rows[0];
        const keys = Object.keys(firstRow);
        const numKey = keys.find(k => !isNaN(Number(firstRow[k])));
        if (numKey) {
          return {
            displayType: 'metricCallout',
            primaryValue: String(firstRow[numKey]),
            label: numKey,
            rationale: 'تەنها یەک بەهای ژمارەیی گرنگ هەیە؛ نیشاندانی بەشێوەی ڕووکاری گەورەکراو (Metric Callout) بەهێزترین کاریگەری هەیە'
          };
        }
      }

      if (dataset.rows.length <= 10) {
        return {
          displayType: 'chart',
          rationale: 'داتای ژمارەیی بەراوردکاری شیاوە بۆ بینراوکردنی چارت'
        };
      }

      return {
        displayType: 'table',
        rationale: 'ژمارەی داتاکان زۆرە؛ خشتەی زانستی وردترین نیشاندان بەدەستەوە دەدات'
      };
    }

    // Extract numbers from text
    const text = textContent || '';
    const match = text.match(/(\d+(\.\d+)?%?)/);
    if (match) {
      return {
        displayType: 'metricCallout',
        primaryValue: match[1],
        label: 'ئاماژەی ژمارەیی سەرەکی',
        rationale: 'ژمارەیەکی ئاماری سەرەکی لە دەقەکەدا وەک فۆکەسی ئاماری دەرکراوە'
      };
    }

    return {
      displayType: 'textSummary',
      rationale: 'هیچ داتایەکی ژمارەیی دیاریکراو نەدۆزرایەوە؛ تەنها پوختەی دەقی بەکاردێت'
    };
  }
}
