import { Injectable } from '@angular/core';
import { DataClassificationType, VisualizationField } from '../../models/presentation.model';

export interface DataClassificationResult {
  primaryType: DataClassificationType;
  confidenceScore: number;
  explanation: string;
  isNumeric: boolean;
  isTemporal: boolean;
  isCategorical: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DataClassificationService {
  /**
   * Classifies a dataset field or array of values into a strict semantic data type.
   */
  classifyField(field: VisualizationField): DataClassificationResult {
    const values = field.sampleValues || [];
    if (values.length === 0) {
      return {
        primaryType: 'textual',
        confidenceScore: 0.5,
        explanation: 'کێڵگەکە هیچ داتایەکی تێدا نییە و وەک دەق مامەڵەی لەگەڵ دەکرێت',
        isNumeric: false,
        isTemporal: false,
        isCategorical: false
      };
    }

    const total = values.length;
    let numericCount = 0;
    let temporalCount = 0;

    const datePattern = /^\d{4}(-\d{2}(-\d{2})?)?$/;

    for (const v of values) {
      if (typeof v === 'number' || (!isNaN(Number(v)) && String(v).trim() !== '')) {
        numericCount++;
      }
      if (typeof v === 'string' && (datePattern.test(v) || v.includes('ساڵی') || v.includes('بەرواری'))) {
        temporalCount++;
      }
    }

    // Temporal classification
    if (temporalCount / total >= 0.7 || field.dataType === 'temporal') {
      return {
        primaryType: 'temporal',
        confidenceScore: 0.95,
        explanation: 'داتاکە زنجیرەی کاتی یان ساڵ و بەروار نیشان دەدات',
        isNumeric: false,
        isTemporal: true,
        isCategorical: false
      };
    }

    // Quantitative classification
    if (numericCount / total >= 0.8 || field.dataType === 'quantitative') {
      const allDiscrete = values.every(v => Number.isInteger(Number(v)));
      const subType: DataClassificationType = allDiscrete ? 'discrete' : 'continuous';

      return {
        primaryType: subType,
        confidenceScore: 0.92,
        explanation: `داتاکە ژمارەیی بڕییە (${allDiscrete ? 'پچڕپچڕ' : 'بەردەوام'})`,
        isNumeric: true,
        isTemporal: false,
        isCategorical: false
      };
    }

    // Categorical vs Ordinal
    const uniqueValues = new Set(values).size;
    if (uniqueValues <= Math.min(10, total)) {
      return {
        primaryType: 'categorical',
        confidenceScore: 0.88,
        explanation: 'داتاکە پۆلێنی کاتگۆرییە ناڕێکخراوەکان نیشان دەدات',
        isNumeric: false,
        isTemporal: false,
        isCategorical: true
      };
    }

    return {
      primaryType: 'textual',
      confidenceScore: 0.80,
      explanation: 'داتاکە بە دەقی وەسفی ڕیزبەندکراوە',
      isNumeric: false,
      isTemporal: false,
      isCategorical: false
    };
  }
}
