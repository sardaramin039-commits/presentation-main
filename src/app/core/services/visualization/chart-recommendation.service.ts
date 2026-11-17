import { Injectable } from '@angular/core';
import { SlidePlan, RecommendedChartType, ChartSpecification } from '../../models/presentation.model';

export interface ChartRecommendationResult {
  chartType: RecommendedChartType;
  confidence: number;
  rationale: string;
  dataPresent: boolean;
  chartSpec?: ChartSpecification;
}

@Injectable({
  providedIn: 'root'
})
export class ChartRecommendationService {
  /**
   * Evaluates slide content and recommends an optimal chart type based on factual data.
   */
  recommendChart(slide: SlidePlan): ChartRecommendationResult {
    const text = (
      slide.title +
      ' ' +
      (slide.contentPlan?.explanation || '') +
      ' ' +
      slide.contentPlan?.blocks.map(b => b.text).join(' ') +
      ' ' +
      slide.contentPlan?.evidence.map(e => e.extractedSnippet || '').join(' ')
    ).toLowerCase();

    // Check if factual numbers exist
    const numberMatches = Array.from(new Set(text.match(/\d+(\.\d+)?%?/g) || []));
    const hasPercentages = text.includes('%') || text.includes('ڕێژەی سەدی') || text.includes('percent');
    const hasTemporal = text.includes('ساڵ') || text.includes('گەشە') || text.includes('زەمەن') || text.includes('trend');
    const hasCategoryComparison = text.includes('بەراورد') || text.includes('جیاوازی') || text.includes('کۆڵۆم');

    if (numberMatches.length === 0 && slide.dataVizType === 'none') {
      return {
        chartType: 'chartNotRecommended',
        confidence: 0.95,
        rationale: 'هیچ داتایەکی ئاماری یان ژمارەیی لە ناوەڕۆکی سلایدەکەدا نییە، بۆیە چارت پێشنیار ناکرێت',
        dataPresent: false
      };
    }

    // Pie / Donut Rule: Strictly for parts-of-whole with <= 5 categories and percentages
    if (hasPercentages && numberMatches.length <= 5 && (text.includes('پشک') || text.includes('دابەشبوون') || text.includes('کۆی گشتی'))) {
      return {
        chartType: 'pie',
        confidence: 0.88,
        rationale: 'داتاکە ڕێژەی سەدی دابەشبوونی پشکەکان لە کۆی گشتی نیشان دەدات (کەمتر لە ٥ بەش)',
        dataPresent: true
      };
    }

    // Temporal Rule: Line or Area Chart
    if (hasTemporal || slide.dataVizType === 'line_chart') {
      return {
        chartType: 'line',
        confidence: 0.92,
        rationale: 'داتاکە گۆڕانکاریی ڕەوت یان زنجیرەی کاتی نیشان دەدات لەسەر زەمەن',
        dataPresent: numberMatches.length > 0
      };
    }

    // Categorical Rule: Bar / Column Chart
    if (hasCategoryComparison || slide.dataVizType === 'bar_chart' || numberMatches.length >= 2) {
      return {
        chartType: 'column',
        confidence: 0.90,
        rationale: 'داتاکە بەراوردی بڕیی لە نێوان کاتگۆرییە جیاوازەکاندا ئاسان دەکات',
        dataPresent: numberMatches.length > 0
      };
    }

    return {
      chartType: 'bar',
      confidence: 0.75,
      rationale: 'چارتی ستونی بەسوودە بۆ پیشاندانی داتای ژمارەیی',
      dataPresent: numberMatches.length > 0
    };
  }
}
