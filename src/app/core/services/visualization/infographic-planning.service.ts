import { Injectable } from '@angular/core';
import { InfographicType } from '../../models/presentation.model';

export interface InfographicPlan {
  infographicType: InfographicType;
  title: string;
  elementsCount: number;
  layoutStructure: 'verticalFlow' | 'grid' | 'timelineRow' | 'splitComparison' | 'radialCycle';
  rationale: string;
}

@Injectable({
  providedIn: 'root'
})
export class InfographicPlanningService {
  /**
   * Plans an infographic structure based on semantic content layout.
   */
  planInfographic(contentBlockText: string): InfographicPlan {
    const text = (contentBlockText || '').toLowerCase();

    if (text.includes('ڕێژە') || text.includes('لەسەدا') || text.includes('%') || text.includes('ئامار')) {
      return {
        infographicType: 'statisticHighlight',
        title: 'بەرچاوڕوونی ئاماری و ئاماژە سەرەکییەکان',
        elementsCount: 3,
        layoutStructure: 'grid',
        rationale: 'ناوەڕۆکەکە لەسەر ژمارە و ئاماری گرنگ چڕبووەتەوە؛ بەکارهێنانی کارت بۆ بەهای ئاماری نایابە'
      };
    }

    if (text.includes('قۆناغ') || text.includes('پێنگاو') || text.includes('قۆناغەکانی') || text.includes('هەنگاو')) {
      return {
        infographicType: 'stepByStepInfographic',
        title: 'ڕێڕەوی قۆناغ و هەنگاوەکان',
        elementsCount: 4,
        layoutStructure: 'verticalFlow',
        rationale: 'ناوەڕۆکەکە شێوازی زنجیرە قۆناغ یان پێنگاوی ڕێنماییکاری هەیە'
      };
    }

    if (text.includes('ساڵ') || text.includes('مێژوو') || text.includes('گەشەسەندنی') || text.includes('بەروار')) {
      return {
        infographicType: 'timelineInfographic',
        title: 'پێشهاتە کاتی و مێژووییەکان',
        elementsCount: 4,
        layoutStructure: 'timelineRow',
        rationale: 'ناوەڕۆکەکە شێوازی بەسەرھاتی مێژوویی و ڕیزبەندکراوی کاتی هەیە'
      };
    }

    if (text.includes('بەراورد') || text.includes('جیاوازی') || text.includes('بەرامبەر')) {
      return {
        infographicType: 'comparisonInfographic',
        title: 'تەوەرەی بەراوردکاری سەرەکی',
        elementsCount: 2,
        layoutStructure: 'splitComparison',
        rationale: 'شیکردنەوەی خاڵە بەراوردکارییەکان لە نێوان دوو یان زیاتر چەمک'
      };
    }

    if (text.includes('خول') || text.includes('دەنکۆڵە') || text.includes('دەورەیی') || text.includes('سوڕ')) {
      return {
        infographicType: 'cycleInfographic',
        title: 'دیاریکردنی پرۆسەی بەردەوام و دەورەیی',
        elementsCount: 4,
        layoutStructure: 'radialCycle',
        rationale: 'پەیوەندی بازنەیی و دووبارەبووەوە لە چەمکەکاندا هەیە'
      };
    }

    return {
      infographicType: 'conceptInfographic',
      title: 'نەخشەی چەمک و چوارچێوەیە بیردۆزییەکان',
      elementsCount: 3,
      layoutStructure: 'grid',
      rationale: 'شیکردنەوەی چەمکی و پەیوەندی چوارچێوەیی تیۆری'
    };
  }
}
