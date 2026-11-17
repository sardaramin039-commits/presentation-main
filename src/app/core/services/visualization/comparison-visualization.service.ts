import { Injectable } from '@angular/core';
import { VisualizationDataset } from '../../models/presentation.model';

export type ComparisonType =
  | 'featureComparison'
  | 'quantitativeComparison'
  | 'temporalComparison'
  | 'conceptualComparison'
  | 'sourceComparison';

export interface ComparisonVisualPlan {
  type: ComparisonType;
  recommendedLayout: 'sideBySideCard' | 'matrixTable' | 'groupedColumnChart' | 'splitTextList';
  comparisonWarning?: string;
  rationale: string;
}

@Injectable({
  providedIn: 'root'
})
export class ComparisonVisualizationService {
  /**
   * Evaluates comparison requirements and suggests structured comparative layouts.
   */
  planComparison(dataset?: VisualizationDataset, textContent?: string): ComparisonVisualPlan {
    const text = (textContent || '').toLowerCase();

    if (dataset && dataset.rows.length > 0) {
      const hasNumeric = dataset.fields.some(f => f.dataType === 'quantitative' || f.dataType === 'discrete' || f.dataType === 'continuous');
      if (hasNumeric) {
        return {
          type: 'quantitativeComparison',
          recommendedLayout: dataset.rows.length > 6 ? 'matrixTable' : 'groupedColumnChart',
          rationale: 'داتای ژمارەیی بەراوردکاری هەیە؛ چارتی ستوونی بە کۆمەڵ یان خشتە نایابترین بژاردەیە'
        };
      }
    }

    if (text.includes('تایبەتمەندی') || text.includes('تایبەتمەندییەکان')) {
      return {
        type: 'featureComparison',
        recommendedLayout: 'matrixTable',
        rationale: 'بەراوردکاری تایبەتمەندی لەسەر ماتریکسی ڕیز و ستوون ئاسانتر دەخوێندرێتەوە'
      };
    }

    return {
      type: 'conceptualComparison',
      recommendedLayout: 'sideBySideCard',
      rationale: 'بەراوردکاری نێوان بیرۆکەکان بەشێوەی ڕووکاری پاڵپشت بە پاڵپشت رێکخراوە'
    };
  }
}
