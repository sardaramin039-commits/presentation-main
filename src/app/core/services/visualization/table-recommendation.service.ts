import { Injectable } from '@angular/core';
import { SlidePlan, TableSpecification } from '../../models/presentation.model';

export interface TableRecommendationResult {
  tableRecommended: boolean;
  rowCount: number;
  colCount: number;
  tableOverflowWarning?: string;
  rationale: string;
  tableSpec?: TableSpecification;
}

@Injectable({
  providedIn: 'root'
})
export class TableRecommendationService {
  /**
   * Evaluates if a structured tabular visual is appropriate for a slide.
   */
  recommendTable(slide: SlidePlan): TableRecommendationResult {
    const text = (
      slide.title +
      ' ' +
      (slide.contentPlan?.explanation || '') +
      ' ' +
      slide.contentPlan?.blocks.map(b => b.text).join(' ')
    ).toLowerCase();

    const isExplicitTableType = slide.dataVizType === 'table' || slide.dataVizType === 'comparison_matrix';
    const containsTableKeywords = text.includes('خشتە') || text.includes('ماتریس') || text.includes('matrix') || text.includes('تایبەتمەندییەکان');

    if (!isExplicitTableType && !containsTableKeywords) {
      return {
        tableRecommended: false,
        rowCount: 0,
        colCount: 0,
        rationale: 'ناوەڕۆکەکە شێوازی دەقی یان خاڵیی هەیە و پێویستی بە خشتە نییە'
      };
    }

    // Estimate row and col complexity from content blocks
    const rowCount = Math.max(3, slide.contentPlan?.blocks.length || 3);
    const colCount = slide.slideType === 'comparison' ? 3 : 2;

    let tableOverflowWarning: string | undefined;

    if (rowCount > 8) {
      tableOverflowWarning = `خشتەکە ${rowCount} ڕێزی تێدایە کە سنووری ئاسایی سلاید (٨ ڕێز) دەبەزێنێت و خوێندنەوە قورس دەکات`;
    } else if (colCount > 5) {
      tableOverflowWarning = `خشتەکە ${colCount} کۆڵۆمی تێدایە کە لە ڕووبەری ئاسۆیی سلاید دەر دەچێت`;
    }

    return {
      tableRecommended: true,
      rowCount,
      colCount,
      tableOverflowWarning,
      rationale: 'داتای پێکهاتەدار بۆ گەیاندنی وردبینی زانستی پێویستی بە خشتەی ڕێکخراو هەیە'
    };
  }
}
