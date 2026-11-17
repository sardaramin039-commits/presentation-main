import { Injectable, inject, ProviderToken } from '@angular/core';
import {
  VisualizationDataset,
  VisualizationRecommendation,
  VisualizationMapping
} from '../../models/presentation.model';
import { DataClassificationService } from '../data-classification.service';

@Injectable({
  providedIn: 'root'
})
export class ChartSelectionService {
  private dataClassification = this.safeInject(DataClassificationService, () => new DataClassificationService());

  private safeInject<T>(token: ProviderToken<T>, fallback: () => T): T {
    try {
      return inject(token, { optional: true }) || fallback();
    } catch {
      return fallback();
    }
  }

  /**
   * Evaluates dataset structure and visualization goal to recommend an optimal chart type.
   */
  recommendChart(
    dataset: VisualizationDataset,
    goal: 'comparison' | 'trend' | 'distribution' | 'composition' | 'relationship' | 'process' = 'comparison'
  ): VisualizationRecommendation {
    if (!dataset || dataset.rows.length === 0 || dataset.fields.length === 0) {
      return {
        chartType: 'notRecommended',
        confidenceScore: 0,
        rationale: 'هیچ داتایەکی بەسوود لە داتاسێتەکەدا بەردەست نییە',
        dataRequirementsSatisfied: false,
        limitations: ['داتاسێتەکە بەتاڵە یان کێڵگەی تێدا نییە'],
        mappings: []
      };
    }

    const fields = dataset.fields;
    const rowCount = dataset.rows.length;

    // Classify fields
    const classifiedFields = fields.map(f => ({
      field: f,
      classification: this.dataClassification.classifyField(f)
    }));

    const numericFields = classifiedFields.filter(c => c.classification.isNumeric);
    const temporalFields = classifiedFields.filter(c => c.classification.isTemporal);
    const categoricalFields = classifiedFields.filter(c => c.classification.isCategorical || c.classification.primaryType === 'categorical');

    // Rule 1: No numeric fields -> Cannot form standard charts
    if (numericFields.length === 0) {
      return {
        chartType: 'notRecommended',
        confidenceScore: 1.0,
        rationale: 'هیچ بەهایەکی ژمارەیی بۆ پێوانەکردنی چارت بەردەست نییە',
        dataRequirementsSatisfied: false,
        limitations: ['چارت پێویستی بە لانیکەم یەک کێڵگەی ژمارەیی هەیە'],
        mappings: []
      };
    }

    // Rule 2: Trend goal or Temporal data
    if (goal === 'trend' || temporalFields.length > 0) {
      const timeField = temporalFields[0]?.field.name || classifiedFields[0].field.name;
      const numField = numericFields[0].field.name;

      const mappings: VisualizationMapping[] = [
        { field: timeField, channel: 'x', scaleType: 'time', label: 'کات / بەروار' },
        { field: numField, channel: 'y', scaleType: 'linear', label: 'بەها' }
      ];

      return {
        chartType: rowCount > 15 ? 'area' : 'line',
        confidenceScore: 0.95,
        rationale: 'کێڵگەی کاتی بدۆزرایەوە؛ چارتی هێڵی یان ڕووبەر شیاوترینە بۆ نیشاندانی گۆڕانکارییەکانی کات',
        dataRequirementsSatisfied: true,
        limitations: rowCount < 3 ? ['تەنها چەند داتایەکی کەمی کاتی بەردەستە'] : [],
        mappings
      };
    }

    // Rule 3: Composition / Part-to-whole
    if (goal === 'composition') {
      if (rowCount <= 5 && numericFields.length === 1 && categoricalFields.length >= 1) {
        const catField = categoricalFields[0].field.name;
        const numField = numericFields[0].field.name;

        return {
          chartType: rowCount <= 3 ? 'donut' : 'pie',
          confidenceScore: 0.90,
          rationale: 'داتای پێکهاتەی کەمی پۆلەکان (<=5 کاتگۆری) بۆ چارتی بازنەیی گونجاوە',
          dataRequirementsSatisfied: true,
          limitations: ['چارتی بازنەیی بۆ کاتگۆری زیاتر لە ٥ ناکارامەیە'],
          mappings: [
            { field: catField, channel: 'color', scaleType: 'ordinal', label: 'پۆلەکان' },
            { field: numField, channel: 'y', scaleType: 'linear', label: 'بەها' }
          ]
        };
      } else if (numericFields.length >= 2 && categoricalFields.length >= 1) {
        return {
          chartType: 'stackedColumn',
          confidenceScore: 0.88,
          rationale: 'چەند بەهایەکی ژمارەیی بەسەر کاتگۆرییەکاندا؛ چارتی دوورگەیی کۆکراوە (Stacked Column) شیاوە',
          dataRequirementsSatisfied: true,
          limitations: [],
          mappings: [
            { field: categoricalFields[0].field.name, channel: 'x', scaleType: 'band' },
            { field: numericFields[0].field.name, channel: 'y', scaleType: 'linear' }
          ]
        };
      }
    }

    // Rule 4: Relationship / Scatter
    if (goal === 'relationship' || numericFields.length >= 2) {
      if (numericFields.length >= 2 && rowCount >= 5) {
        return {
          chartType: numericFields.length >= 3 ? 'bubble' : 'scatter',
          confidenceScore: 0.89,
          rationale: 'پەیوەندی نێوان بەها ژمارەیییەکان بە چارتی بڵاوبوونەوە (Scatter/Bubble) نیشان دەدرێت',
          dataRequirementsSatisfied: true,
          limitations: ['پێویستی بە بینەری شارەزا هەیە بۆ تێگەیشتن لە هاوپەیوەندی'],
          mappings: [
            { field: numericFields[0].field.name, channel: 'x', scaleType: 'linear' },
            { field: numericFields[1].field.name, channel: 'y', scaleType: 'linear' }
          ]
        };
      }
    }

    // Rule 5: Standard Comparison (Bar / Column)
    const catName = categoricalFields[0]?.field.name || fields[0].name;
    const numName = numericFields[0].field.name;

    const useBarChart = rowCount > 8 || catName.length > 12;

    return {
      chartType: useBarChart ? 'bar' : 'column',
      confidenceScore: 0.91,
      rationale: useBarChart
        ? 'بۆ ڕێگریکردن لە بەریەککەوتنی دەقەکان، چارتی ئاسۆیی (Bar Chart) دیاری کراوە'
        : 'بەراوردکاری کاتگۆرییە کورتەکان بە چارتی ستوونی (Column Chart) ڕوونترە',
      dataRequirementsSatisfied: true,
      limitations: [],
      mappings: [
        { field: catName, channel: 'x', scaleType: 'band', label: 'کاتگۆری' },
        { field: numName, channel: 'y', scaleType: 'linear', label: 'بەها' }
      ]
    };
  }
}
