import { Injectable } from '@angular/core';
import { VisualizationDataset } from '../../models/presentation.model';

export interface DataIssue {
  issueType:
    | 'missingValues'
    | 'duplicateValues'
    | 'invalidNumeric'
    | 'inconsistentUnits'
    | 'inconsistentCategories'
    | 'invalidDates'
    | 'emptyDataset'
    | 'insufficientObservations';
  severity: 'warning' | 'error';
  field?: string;
  description: string;
  affectedRowCount: number;
}

export interface DataIntegrityReport {
  isValid: boolean;
  issues: DataIssue[];
  totalRows: number;
  totalFields: number;
  explanation: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataIntegrityGuardService {
  /**
   * Performs rigorous data validation checks without mutating or auto-correcting any user evidence.
   */
  inspectDataset(dataset: VisualizationDataset): DataIntegrityReport {
    const issues: DataIssue[] = [];

    if (!dataset || !dataset.rows || dataset.rows.length === 0) {
      return {
        isValid: false,
        issues: [
          {
            issueType: 'emptyDataset',
            severity: 'error',
            description: 'داتاسێتەکە بەتاڵە و هیچ ڕیزێک داتا لەخۆناگرێت',
            affectedRowCount: 0
          }
        ],
        totalRows: 0,
        totalFields: dataset?.fields?.length || 0,
        explanation: 'پشکنینی داتا شکستی هێنا بەهۆی بەتاڵی داتاسێتەکەوە'
      };
    }

    const rows = dataset.rows;
    const fields = dataset.fields;

    if (rows.length < 2) {
      issues.push({
        issueType: 'insufficientObservations',
        severity: 'warning',
        description: 'کەمی ژمارەی ڕیزەکان (کەمتر لە ٢ داتا) توانای بەرھەمھێنانی چارتی بڕواپێکراو سنوردار دەکات',
        affectedRowCount: rows.length
      });
    }

    // Check for missing values & invalid numerics
    for (const f of fields) {
      let missingCount = 0;
      let invalidNumCount = 0;

      for (const row of rows) {
        const val = row[f.name];
        if (val === undefined || val === null || String(val).trim() === '') {
          missingCount++;
        } else if (f.dataType === 'quantitative' || f.dataType === 'continuous' || f.dataType === 'discrete') {
          if (isNaN(Number(val))) {
            invalidNumCount++;
          }
        }
      }

      if (missingCount > 0) {
        issues.push({
          issueType: 'missingValues',
          severity: missingCount / rows.length > 0.3 ? 'error' : 'warning',
          field: f.name,
          description: `کێڵگەی "${f.name}" ژمارەی ${missingCount} بەهای ونبووی (Missing Value) تێدایە`,
          affectedRowCount: missingCount
        });
      }

      if (invalidNumCount > 0) {
        issues.push({
          issueType: 'invalidNumeric',
          severity: 'error',
          field: f.name,
          description: `کێڵگەی ژمارەیی "${f.name}" ژمارەی ${invalidNumCount} بەهای نەگونجاوی نازانستی تێدایە`,
          affectedRowCount: invalidNumCount
        });
      }
    }

    const hasErrors = issues.some(i => i.severity === 'error');

    return {
      isValid: !hasErrors,
      issues,
      totalRows: rows.length,
      totalFields: fields.length,
      explanation: hasErrors
        ? 'پشکنینی داتا هەڵەی جدی تێدا دۆزرایەوە؛ ناتوانرێت چارت بەبێ خاوێنکردنەوە ڕاستەوخۆ بەکاربهێنرێت'
        : issues.length > 0
        ? 'پشکنینی داتا چەند تێبینییەکی ئاگاداری دروستکرد بەڵام شیاوە بۆ بەکارهێنان'
        : 'داتاکە تەواو بێگەرد و بێ کەمەکورتییە'
    };
  }
}
