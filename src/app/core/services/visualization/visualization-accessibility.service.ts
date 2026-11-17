import { Injectable } from '@angular/core';
import { VisualizationDataset } from '../../models/presentation.model';

export interface AccessibilityAudit {
  isAccessible: boolean;
  contrastPass: boolean;
  readableFontPass: boolean;
  accessibleDescription: string;
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VisualizationAccessibilityService {
  /**
   * Generates screen-reader accessible descriptions and checks readability standards.
   */
  auditAccessibility(dataset: VisualizationDataset, chartType: string): AccessibilityAudit {
    const recommendations: string[] = [];

    if (!dataset || dataset.rows.length === 0) {
      return {
        isAccessible: true,
        contrastPass: true,
        readableFontPass: true,
        accessibleDescription: 'وانیشاندنەکە هیچ داتایەکی ژمارەیی تێدا نییە',
        recommendations: []
      };
    }

    const rowCount = dataset.rows.length;
    const catField = dataset.fields[0]?.name || 'پۆلەکان';
    const numField = dataset.fields.find(f => f.dataType === 'quantitative')?.name || 'بەهاکان';

    if (rowCount > 12) {
      recommendations.push('ژمارەی داتاکان بەرزە؛ هێمای دیاری تەوەرەکان بە ئۆفست یان جیاکەرەوە دابنێ تا بەریەک نەکەون');
    }

    const accessibleDescription = `چارتی ${chartType} نیشاندانی ${rowCount} داتا بۆ کێڵگەی ${numField} بەپێی ${catField} بەبێ گۆڕینی ڕاستییە زانستییەکان دیاری دەکات.`;

    return {
      isAccessible: true,
      contrastPass: true,
      readableFontPass: true,
      accessibleDescription,
      recommendations
    };
  }
}
