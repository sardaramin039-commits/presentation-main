import { Injectable } from '@angular/core';
import { VisualizationDataset } from '../../models/presentation.model';

export interface VisualComplexityReport {
  score: number; // 0 to 1
  isOverloaded: boolean;
  categoryCount: number;
  variableCount: number;
  complexityWarning?: string;
  recommendation: string;
}

@Injectable({
  providedIn: 'root'
})
export class VisualComplexityService {
  /**
   * Evaluates cognitive load and visual clutter without deleting user evidence.
   */
  evaluateComplexity(dataset: VisualizationDataset): VisualComplexityReport {
    if (!dataset || !dataset.rows) {
      return {
        score: 0,
        isOverloaded: false,
        categoryCount: 0,
        variableCount: 0,
        recommendation: 'داتاسێت بەتاڵە'
      };
    }

    const categoryCount = dataset.rows.length;
    const variableCount = dataset.fields.length;

    // Calculate normalized visual density
    const score = Math.min(1.0, (categoryCount * 0.04) + (variableCount * 0.15));
    const isOverloaded = score > 0.8;

    let complexityWarning: string | undefined;
    if (isOverloaded) {
      complexityWarning = `چارتەکە بارگۆڕیی بینراوی بەرز نیشان دەدات (${categoryCount} پۆل، ${variableCount} گۆڕاو)؛ نیشاندانی خشتەی زانستی ڕوونترە`;
    }

    return {
      score,
      isOverloaded,
      categoryCount,
      variableCount,
      complexityWarning,
      recommendation: isOverloaded
        ? 'پێشنیار دەکرێت بۆ سەرجەم گۆڕاوەکان خشتەی زانستی بەکاربهێنرێت لەبری چارتی شڵەقاو'
        : 'بارگۆڕیی بینراو بەتەواوی هاوسەنگە'
    };
  }
}
