import { Injectable } from '@angular/core';
import { SlidePlan, VisualElement } from '../../models/presentation.model';

export interface CognitiveLoadAnalysis {
  slideNumber: number;
  wordCount: number;
  bulletCount: number;
  visualElementCount: number;
  status: 'balanced' | 'overloaded' | 'underutilized';
  reasons: string[];
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VisualDensityService {
  /**
   * Evaluates cognitive load, text density, and visual density for a slide.
   */
  analyzeCognitiveLoad(slide: SlidePlan, visualElements: VisualElement[] = []): CognitiveLoadAnalysis {
    const textContent = (
      slide.title +
      ' ' +
      (slide.contentPlan?.explanation || '') +
      ' ' +
      slide.contentPlan?.blocks.map(b => b.text).join(' ')
    );

    const words = textContent.trim().split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const bulletCount = slide.contentPlan?.blocks.filter(b => b.type === 'bullet').length || 0;
    const visualElementCount = visualElements.length;

    const reasons: string[] = [];
    const recommendations: string[] = [];

    let status: CognitiveLoadAnalysis['status'] = 'balanced';

    // Overload checks
    if (wordCount > 130) {
      status = 'overloaded';
      reasons.push(`ژمارەی وشەکان (${wordCount}) زۆر بەرزە بۆ یەک سلاید (مەکسیمەم 120)`);
      recommendations.push('کەمکردنەوەی درێژدادی دەق و زەقکردنەوەی خاڵە جەوهەرییەکان');
    }

    if (bulletCount > 6) {
      status = 'overloaded';
      reasons.push(`ژمارەی خاڵەکان (${bulletCount}) لە سنووری دیاریکراوی ٦ لایداوە`);
      recommendations.push('دابەشکردنی خاڵەکان بۆ دوو سلاید یان بەکار هێنانی ماتریس');
    }

    if (visualElementCount > 2) {
      status = 'overloaded';
      reasons.push(`زیاتر لە ٢ توخم ی بینراو بەکارهاتووە کە دەبێتە هۆی شڵەژانی سەرنجی بینەر`);
      recommendations.push('هەڵبژاردنی تەنها یەک توخمی بینراوی سەرەکی');
    }

    // Underutilized checks
    if (wordCount < 15 && visualElementCount === 0 && slide.slideType !== 'title' && slide.slideType !== 'agenda') {
      status = 'underutilized';
      reasons.push(`ناوەڕۆکی سلایدەکە زۆر کەمە و رووبەری بەتاڵ بەهەدەردراوە`);
      recommendations.push('زیادکردنی بەڵگەی پشتیوان یان ئارگومێنتی ئەکادیمی');
    }

    return {
      slideNumber: slide.slideNumber,
      wordCount,
      bulletCount,
      visualElementCount,
      status,
      reasons,
      recommendations
    };
  }
}
