import { Injectable } from '@angular/core';
import {
  SlidePlan,
  VisualRequirement,
  VisualType,
  VisualIntent
} from '../../models/presentation.model';
import { classifyAcademicTopic } from '../../utils/academic-topic-classifier.util';

@Injectable({
  providedIn: 'root'
})
export class VisualNecessityService {
  /**
   * Evaluates the necessity of a visual element for a slide and documents the rationale.
   */
  evaluateNecessity(slide: SlidePlan, intent?: VisualIntent): VisualRequirement {
    const blocksText = (slide.contentPlan?.blocks || []).map(b => b.text).join(' ');
    const evidenceText = (slide.evidenceMaps || []).map(e => e.evidenceSnippet || '').join(' ');
    const text = (
      (slide.title || '') +
      ' ' +
      (slide.contentPlan?.explanation || '') +
      ' ' +
      blocksText +
      ' ' +
      evidenceText
    ).toLowerCase();

    const topicAnalysis = classifyAcademicTopic(text);
    const primaryType: VisualType = intent?.primaryVisualCandidate || this.fallbackType(slide);

    // Rule 1: Title or Agenda or Pure Reference slides don't strictly require graphics
    if (slide.slideType === 'title' || slide.slideType === 'agenda' || slide.slideType === 'reference') {
      return {
        slideNumber: slide.slideNumber,
        necessity: 'not_needed',
        primaryVisualType: 'text_only',
        reason: 'لایەنی ناونیشان یان پێڕست پێویستی بە visual جەنجاڵ نییە',
        confidence: 0.95
      };
    }

    // Smart Data Guard: If qualitative/theoretical, forbid hallucinated numeric charts
    if (!topicAnalysis.isQuantitative && (primaryType === 'chart' || primaryType === 'bar_chart' || primaryType === 'line_chart' || primaryType === 'pie_chart')) {
      return {
        slideNumber: slide.slideNumber,
        necessity: 'recommended',
        primaryVisualType: 'comparison',
        reason: 'ئەم بابەتە فیکری و تیۆرییە؛ لەبری چارتی ژمارەیی، خشتەی بەراوردکاری چەمکەکان یان کارتی پۆلێنکاری بەکاردەهێنرێت.',
        confidence: 0.95
      };
    }

    // Rule 2: Chronological/Time series data -> REQUIRED
    if (intent?.informationType === 'temporal' || text.includes('مێژوو') || text.match(/\b(18|19|20)\d{2}\b/)) {
      return {
        slideNumber: slide.slideNumber,
        necessity: 'required',
        primaryVisualType: primaryType === 'text_only' ? 'timeline' : primaryType,
        reason: 'ئەم سلایدە زنجیرەی ڕووداوە کاتییەکان لەخۆدەگرێت و پێویستی بە Timeline هەیە',
        confidence: 0.92
      };
    }

    // Rule 3: Numerical evidence with multiple numbers ONLY for quantitative topics -> REQUIRED
    if (
      topicAnalysis.isQuantitative &&
      (intent?.informationType === 'numerical_comparison' ||
      intent?.informationType === 'trend' ||
      text.match(/%\d+|\d+%/g))
    ) {
      return {
        slideNumber: slide.slideNumber,
        necessity: 'required',
        primaryVisualType: primaryType,
        reason: 'ئەم سلایدە بڕی ئاماری و داتای ڕێژەیی تێدایە و پێویستی بە چارتی شیکاری هەیە',
        confidence: 0.90
      };
    }

    // Rule 4: Structured comparison -> RECOMMENDED
    if (slide.slideType === 'comparison' || intent?.informationType === 'comparison') {
      return {
        slideNumber: slide.slideNumber,
        necessity: 'recommended',
        primaryVisualType: 'comparison',
        reason: 'سلایدەکە بەراوردی نێوان دوو یان زیاتر لە چەمکەکان دەکات',
        confidence: 0.85
      };
    }

    // Rule 5: Methodology / Process -> RECOMMENDED
    if (slide.slideType === 'methodology' || intent?.informationType === 'sequential_process') {
      return {
        slideNumber: slide.slideNumber,
        necessity: 'recommended',
        primaryVisualType: 'process',
        reason: 'سلایدەکە باسی هەنگاوەکانی پڕۆسە یان میتۆدۆلۆجی دەکات',
        confidence: 0.88
      };
    }

    // Rule 6: Slide with high evidence maps
    if (slide.evidenceMaps.length >= 2) {
      return {
        slideNumber: slide.slideNumber,
        necessity: 'recommended',
        primaryVisualType: primaryType,
        reason: 'سلایدەکە زیاتر لە بەڵگەیەکی سەلمێنراوی تێدایە بۆ پڵۆتکردنی بەڵگەنامەیی',
        confidence: 0.80
      };
    }

    // Default: Optional
    return {
      slideNumber: slide.slideNumber,
      necessity: 'optional',
      primaryVisualType: primaryType,
      reason: 'ناوەڕۆکەکە بە تەنها لەڕێگەی دەقی ڕوون و پێکهاتەی بەرزکراوەوە دەگەیەنرێت',
      confidence: 0.75
    };
  }

  private fallbackType(slide: SlidePlan): VisualType {
    if (slide.dataVizType !== 'none') {
      return slide.dataVizType as VisualType;
    }
    if (slide.imageRequired) {
      return 'image';
    }
    return 'text_only';
  }
}
