import { Injectable } from '@angular/core';
import { SlidePlan } from '../../models/presentation.model';

export type MappedVisualKind =
  | 'timeline'
  | 'comparison'
  | 'chart'
  | 'hierarchy'
  | 'process'
  | 'bar_chart'
  | 'relationship'
  | 'map'
  | 'content_cards'
  | 'none';

export interface ContentVisualMappingResult {
  visualKind: MappedVisualKind;
  rationale: string;
  hasSufficientData: boolean;
  canCreateVisual: boolean;
  warning?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContentVisualMappingEngineService {
  /**
   * Maps slide content into appropriate visual representation types.
   * Strictly avoids fabricating fake data or charts if underlying evidence is missing.
   */
  mapContentToVisual(slide: SlidePlan): ContentVisualMappingResult {
    const hints = slide.visualIntentHints || [];
    const textContext = `${slide.title} ${slide.contentPlan?.explanation || ''} ${slide.speakerNotes || ''}`;
    const blocks = slide.contentPlan?.blocks || [];

    // Check data availability
    const numericMatches = textContext.match(/\b\d+(\.\d+)?%?\b/g) || [];
    const hasNumericData = numericMatches.length >= 2 || slide.dataVizType !== 'none';
    const hasEvidence = (slide.evidenceMaps && slide.evidenceMaps.length > 0) || (slide.contentPlan?.evidence && slide.contentPlan.evidence.length > 0);

    if (hints.includes('timeline') || hints.includes('temporal') || /ساڵ|بەروار|قۆناغ|مێژوو|شۆڕش|سەدە|سەدەی/i.test(textContext)) {
      return {
        visualKind: 'timeline',
        rationale: 'مێژوو یان ڕەوتی کاتی دەسنیشانکرا؛ نەخشەی دیاگرامی زنجیرەیی دروست دەکرێت.',
        hasSufficientData: true,
        canCreateVisual: true
      };
    }

    if (hints.includes('comparison') || slide.slideType === 'comparison' || /بەراورد|جیاوازی|لایەنی باش|لایەنی خراپ|بەرامبەر/i.test(textContext)) {
      return {
        visualKind: 'comparison',
        rationale: 'تەوەرەی بەراوردکاری دیاری کراوە؛ بە شێوەی کارت یان سێت لەتەنیشتیەک ڕێکدەخرێت.',
        hasSufficientData: true,
        canCreateVisual: true
      };
    }

    if (hints.includes('hierarchy')) {
      return {
        visualKind: 'hierarchy',
        rationale: 'پلەبەندی لۆجیکی دیاری کراوە؛ نەخشەی دیاگرامی دارستانی (Hierarchy) پیشان دەدرێت.',
        hasSufficientData: true,
        canCreateVisual: true
      };
    }

    if (hints.includes('process') || /قۆناغی|پڕۆسەی|هەنگاوی|ڕێکاری|لۆجیکی/i.test(textContext)) {
      return {
        visualKind: 'process',
        rationale: 'ڕەوتی هەنگاو بە هەنگاو دیاری کراوە؛ دیاگرامی پڕۆسە (Process Diagram) ڕێکدەخرێت.',
        hasSufficientData: true,
        canCreateVisual: true
      };
    }

    if (hints.includes('relationship')) {
      return {
        visualKind: 'relationship',
        rationale: 'پەیوەندی نێوان چەمکەکان هەڵسەنگێندرا؛ بە دیاگرامی پەیوەندی نیشان دەدرێت.',
        hasSufficientData: true,
        canCreateVisual: true
      };
    }

    if (hints.includes('geographic') || /جوگرافی|شوێن|ناوچەی|کوردستان|عێراق|وڵات/i.test(textContext)) {
      return {
        visualKind: 'map',
        rationale: 'ئاماژەی جوگرافی هەیە؛ بە شێوەی نەخشەی چەمکی ڕێکدەخرێت.',
        hasSufficientData: true,
        canCreateVisual: true
      };
    }

    if (hints.includes('quantitative_data') || slide.dataVizType === 'bar_chart' || slide.dataVizType === 'line_chart') {
      if (!hasNumericData && !hasEvidence) {
        return {
          visualKind: 'none',
          rationale: 'داتای چەندایەتی کافی بەردەست نییە. بۆ ڕێگریکردن لە دروستکردنی داتای خەیاڵی، هیچ چارتێک دروست ناکرێت.',
          hasSufficientData: false,
          canCreateVisual: false,
          warning: 'هیچ داتایەکی ژمارەیی ڕاستەقینە بۆ ئەم سلایدە نییە. چارتی خەیاڵی دروست ناکرێت.'
        };
      }
      return {
        visualKind: 'chart',
        rationale: 'داتای چەندایەتی ڕاستەقینە بونی هەیە؛ بە چارتی چەندایەتی بەڵگەدار دەڕازێندرێتەوە.',
        hasSufficientData: true,
        canCreateVisual: true
      };
    }

    if (blocks.length > 3) {
      return {
        visualKind: 'content_cards',
        rationale: 'ناوەڕۆکی چڕی دەقی هەیە؛ بە شێوەی کارتە پێکهاتەییەکان (Structured Cards) ڕێکدەخرێت.',
        hasSufficientData: true,
        canCreateVisual: true
      };
    }

    return {
      visualKind: 'none',
      rationale: 'هیچ بەڵگەیەکی بینراوی دیاریکراو پێویست نییە.',
      hasSufficientData: true,
      canCreateVisual: false
    };
  }
}
