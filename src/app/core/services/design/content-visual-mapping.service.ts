import { Injectable } from '@angular/core';
import {
  SlidePlan,
  ContentVisualMapping,
  SuggestedVisualForm,
  ContentBlock
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class ContentVisualMappingService {
  /**
   * Maps content blocks and claims within a SlidePlan to optimal visual representations.
   */
  generateMappings(slide: SlidePlan): ContentVisualMapping[] {
    const mappings: ContentVisualMapping[] = [];

    // Map slide content blocks
    slide.contentPlan.blocks.forEach(block => {
      const mapping = this.mapBlockToVisual(block, slide);
      mappings.push(mapping);
    });

    // If slide has data visualization hint
    if (slide.dataVizType !== 'none') {
      mappings.push({
        contentId: `dataviz_${slide.slideNumber}`,
        contentType: 'data',
        suggestedVisualForm: this.mapDataVizTypeToForm(slide.dataVizType),
        rationale: `پشتبەستن بە دراوەی داواکراوی سڵاید: ${slide.dataVizDescription || slide.dataVizType}`,
        confidenceScore: 0.95
      });
    }

    return mappings;
  }

  private mapBlockToVisual(block: ContentBlock, slide: SlidePlan): ContentVisualMapping {
    const text = block.text.toLowerCase();

    // Check for process / flow indicators
    if (slide.slideType === 'methodology' || text.includes('قۆناغ') || text.includes('هەنگاو') || text.includes('پرۆسە') || text.includes('step')) {
      return {
        contentId: block.id,
        contentType: 'process',
        suggestedVisualForm: 'process_flow',
        rationale: 'دەقەکە باسی پرۆسە یاخود هەنگاوەکانی کارکردن دەکات؛ دیاگرامی ڕەوت گونجاوە.',
        confidenceScore: 0.88
      };
    }

    // Check for timeline / chronology
    if (slide.layoutIntent === 'timeline' || text.includes('ساڵی') || text.includes('مێژوو') || text.includes('سەردەم') || text.match(/\b(19|20)\d{2}\b/)) {
      return {
        contentId: block.id,
        contentType: 'chronology',
        suggestedVisualForm: 'timeline',
        rationale: 'دەقەکە بەستراوەتەوە بە زنجیرەی کاتی؛ نەخشەی کاتی (Timeline) باشترینە.',
        confidenceScore: 0.9
      };
    }

    // Check for comparison
    if (slide.layoutIntent === 'two_column' || slide.layoutIntent === 'three_column' || slide.layoutIntent === 'matrix' || slide.slideType === 'comparison' || text.includes('بەراورد') || text.includes('لە بەرامبەر') || text.includes('vs')) {
      return {
        contentId: block.id,
        contentType: 'comparison',
        suggestedVisualForm: 'comparison_card',
        rationale: 'مەبەست لەم دەقە بەراوردکردنی دوو لایەنە؛ کارتەکانی بەراورد گونجاون.',
        confidenceScore: 0.85
      };
    }

    // Check for statistic / KPI
    if (block.type === 'statistic' || text.match(/%\s*|\b\d+(\.\d+)?\s*(ملیۆن|هەزار|ڕێژەی)\b/)) {
      return {
        contentId: block.id,
        contentType: 'data',
        suggestedVisualForm: 'kpi_stat',
        rationale: 'مەبەست لە دەقەکە ئامار و ژمارەی سەرەکییە؛ دۆخی KPI Stat ئامادە کراوه.',
        confidenceScore: 0.92
      };
    }

    // Check for definition
    if (slide.slideType === 'definition' || text.includes('بریتییە لە') || text.includes('پێناسە')) {
      return {
        contentId: block.id,
        contentType: 'definition',
        suggestedVisualForm: 'definition_card',
        rationale: 'دەقەکە پێناسەی دەستەواژەیەکە؛ کارتی پێناسە کارایە.',
        confidenceScore: 0.87
      };
    }

    // Check for finding / claim
    if (block.type === 'claim_statement' || block.type === 'takeaway' || slide.slideType === 'finding') {
      return {
        contentId: block.id,
        contentType: 'finding',
        suggestedVisualForm: 'callout_box',
        rationale: 'دەرئەنجام و بانگەشەی سەرەکی لە ناو سندوقی بەرچاو (Callout) نیشان دەدرێت.',
        confidenceScore: 0.86
      };
    }

    // Default bullet/text block
    return {
      contentId: block.id,
      contentType: 'general',
      suggestedVisualForm: 'text_bullet',
      rationale: 'دەقی گشتیی پشتگیریکەر بۆ خاڵبەندیی ڕوون.',
      confidenceScore: 0.75
    };
  }

  private mapDataVizTypeToForm(dataVizType: string): SuggestedVisualForm {
    switch (dataVizType) {
      case 'bar_chart':
      case 'line_chart':
      case 'pie_chart':
        return 'chart';
      case 'table':
        return 'table';
      case 'timeline':
        return 'timeline';
      case 'comparison_matrix':
        return 'comparison_card';
      default:
        return 'diagram';
    }
  }
}
