import { Injectable } from '@angular/core';
import {
  SlidePlan,
  VisualIntent,
  VisualCandidate
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class VisualIntentService {
  /**
   * Analyzes a slide plan semantically and determines its visual intent and candidates.
   */
  analyzeVisualIntent(slide: SlidePlan): VisualIntent {
    const text = (
      slide.title +
      ' ' +
      (slide.contentPlan?.explanation || '') +
      ' ' +
      (slide.contentPlan?.takeaway || '') +
      ' ' +
      slide.contentPlan?.blocks.map(b => b.text).join(' ') +
      ' ' +
      slide.evidenceMaps.map(e => e.evidenceSnippet || '').join(' ')
    ).toLowerCase();

    const infoType = this.detectInformationType(slide, text);
    const candidates = this.generateCandidates(infoType);
    const primaryCandidate = candidates[0]?.type || 'text_only';
    const evidenceLinked = slide.evidenceMaps.length > 0;

    return {
      slideNumber: slide.slideNumber,
      informationType: infoType,
      primaryVisualCandidate: primaryCandidate,
      secondaryCandidates: candidates.slice(1),
      evidenceLinked
    };
  }

  private detectInformationType(
    slide: SlidePlan,
    text: string
  ): VisualIntent['informationType'] {
    if (
      text.includes('مێژوو') ||
      text.includes('تێپەڕبوونی کات') ||
      text.includes('chronology') ||
      text.includes('timeline') ||
      text.match(/\b(18|19|20)\d{2}\b/)
    ) {
      return 'temporal';
    }

    if (text.match(/%\d+|\d+%/g) || (text.match(/\b\d+(\.\d+)?\b/g) && text.match(/\b\d+(\.\d+)?\b/g)!.length >= 2)) {
      return 'numerical_comparison';
    }

    if (slide.slideType === 'comparison' || text.includes('بەراورد') || text.includes('جیاوازی') || text.includes('compare')) {
      return 'comparison';
    }

    if (text.includes('ڕەوت') || text.includes('گەشە') || text.includes('trend') || text.includes('over time')) {
      return 'trend';
    }

    if (
      slide.slideType === 'methodology' ||
      text.includes('پڕۆسە') ||
      text.includes('قۆناغ') ||
      text.includes('step') ||
      text.includes('process')
    ) {
      return 'sequential_process';
    }

    if (text.includes('جوگرافیا') || text.includes('نەخشە') || text.includes('هەرێم') || text.includes('geographic')) {
      return 'geographic';
    }

    if (text.includes('پەیڕەو') || text.includes('پلەبەندی') || text.includes('hierarchy') || text.includes('structure')) {
      return 'hierarchical';
    }

    if (text.match(/%\d+|\d+%/g) || (text.match(/\b\d+(\.\d+)?\b/g) && text.match(/\b\d+(\.\d+)?\b/g)!.length >= 3)) {
      return 'numerical_comparison';
    }

    if (text.includes('دابەشبوون') || text.includes('distribution') || text.includes('proportion')) {
      return 'statistical_distribution';
    }

    if (text.includes('مەبەست') || text.includes('پێناسە') || text.includes('definition')) {
      return 'textual_definition';
    }

    if (text.includes('وتەی') || text.includes('quote') || text.includes('دەڵێت')) {
      return 'textual_quote';
    }

    return 'conceptual_relationship';
  }

  private generateCandidates(
    infoType: VisualIntent['informationType']
  ): VisualCandidate[] {
    switch (infoType) {
      case 'temporal':
        return [
          {
            type: 'timeline',
            suitabilityScore: 95,
            rationale: 'کاتیی و مێژوویی: نیشاندانی ڕووداوەکان لەسەر زەمەن بە ڕوونی',
            pros: ['دیاریکردنی ڕێزبەندی ڕووداوەکان', 'ئاسانی لە تێگەیشتنی کاتی'],
            cons: ['نەبوونی ڕووبەری بەس بۆ زنجیرەی زۆر درێژ']
          },
          {
            type: 'process',
            suitabilityScore: 70,
            rationale: 'بەپێی قۆناغەکان بەدیار دەکەوێت',
            pros: ['ڕوونکردنەوەی گواستنەوەی قۆناغەکان'],
            cons: ['ڕەنگە ڕەهەندی بەروار بە تەواوی دەرنەخات']
          }
        ];

      case 'numerical_comparison':
        return [
          {
            type: 'bar_chart',
            suitabilityScore: 92,
            rationale: 'بەراوردی بڕ و ژمارەکان لە نێوان گرووپەکاندا',
            pros: ['بەراوردکاری بڕیی زۆر ڕوون', 'ئاسان بۆ بینەر'],
            cons: ['کەمتر بەسوودە بۆ ڕەوتی درێژخایەن']
          },
          {
            type: 'table',
            suitabilityScore: 78,
            rationale: 'پێشاندانی داتای ڕاستەقینە بێ دەستکاری',
            pros: ['پێشاندانی ژمارەی ورد'],
            cons: ['کەمتر سەرنجڕاکێشی visual هەیە']
          }
        ];

      case 'trend':
        return [
          {
            type: 'line_chart',
            suitabilityScore: 94,
            rationale: 'نیشاندانی گۆڕانکاریی بەردەوام و ڕەوتی داتا',
            pros: ['نیشاندانی ئاڕاستەی گەشە یان دابەزین'],
            cons: ['پێویستی بە خاڵی داتایی گونجاو هەیە']
          },
          {
            type: 'area_chart',
            suitabilityScore: 75,
            rationale: 'تەواوکاری جەختکردنەوە لەسەر قەبارەی گشتی',
            pros: ['دیاریکردنی قەبارەی ڕێژەیی'],
            cons: ['ئاڵۆزتر لە لایەن بینەرەوە']
          }
        ];

      case 'sequential_process':
        return [
          {
            type: 'process',
            suitabilityScore: 90,
            rationale: 'پیشاندانی هەنگاو بە هەنگاوی میتۆدۆلۆجی یان پڕۆسە',
            pros: ['لۆجیکی هەنگاوەکان دەپارێزێت'],
            cons: ['تەنها بۆ زنجیرەی کورت لە یەک ڕووبەردا گونجاوە']
          },
          {
            type: 'flowchart',
            suitabilityScore: 80,
            rationale: 'پیشاندانی بڕیار و لقەکان',
            pros: ['دیاریکردنی لقی بڕیارەکان'],
            cons: ['تێگەیشتنی خێرا لە کاتی کورتدا قورس دەکات']
          }
        ];

      case 'comparison':
        return [
          {
            type: 'comparison',
            suitabilityScore: 91,
            rationale: 'دیاریکردنی خاڵی هاوبەش و جیاوازییەکانی نێوان دوو دیاردە یان زیاتر',
            pros: ['روونکردنەوەی بەراوردی جەوهەری'],
            cons: ['پێویستی بە زانیاری هاوتەریب هەیە بۆ هەردوو لا']
          },
          {
            type: 'matrix',
            suitabilityScore: 82,
            rationale: 'ماتریسی گشتگیر بۆ فرە پێوەر',
            pros: ['پۆلێنکردنی دوو ڕەهەندی'],
            cons: ['پڕکردنەوەی نا پێویست']
          }
        ];

      case 'geographic':
        return [
          {
            type: 'map',
            suitabilityScore: 93,
            rationale: 'نیشاندانی پێگە یان نەکشەی جوگرافی',
            pros: ['دیاریکردنی جێگەی فیزیکی'],
            cons: ['پێویستی بە داتای جوگرافی دروست هەیە']
          }
        ];

      case 'hierarchical':
        return [
          {
            type: 'hierarchy',
            suitabilityScore: 89,
            rationale: 'نیشاندانی پەیوەندی پێگەکان و هێرارکیی پۆلێنەکان',
            pros: ['ڕوونکردنەوەی ئاستەکان'],
            cons: ['ڕەنگە ناوەڕۆکی جەوهەری تەسک بباتەوە']
          }
        ];

      case 'statistical_distribution':
        return [
          {
            type: 'pie_chart',
            suitabilityScore: 85,
            rationale: 'نیشاندانی بەشەکان لە کۆی گشتی کاتێک پشکەکان دیار بێت',
            pros: ['ڕوونکردنەوەی پشکی سەدی'],
            cons: ['تەنها بۆ کەمتر لە ٦ کاتگۆری دەست دەدات']
          }
        ];

      default:
        return [
          {
            type: 'diagram',
            suitabilityScore: 75,
            rationale: 'دیاگرامی چەمکی بۆ هاوکاریکردنی تێگەیشتنی دەق',
            pros: ['سادەکردنەوەی چەمکەکان'],
            cons: ['دەبێت پشت بە بەڵگەی سەلمێنراو ببەستێت']
          },
          {
            type: 'text_only',
            suitabilityScore: 70,
            rationale: 'کۆنترۆڵکردنی تەرکیز تەنها لەسەر دەقی سەرەکی',
            pros: ['دوورکەوتنەوە لە جەنجاڵی Visual'],
            cons: ['کەمتر بەرهەمداری بۆ بینەری بینراو']
          }
        ];
    }
  }
}
