import { Injectable } from '@angular/core';
import { SlidePlan } from '../../models/presentation.model';

export interface VisualVarietyReport {
  bulletOnlyCount: number;
  layoutDistribution: Record<string, number>;
  varietyScore: number; // 0..100
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VisualVarietyEngineService {
  /**
   * Assesses visual variety across presentation slides and suggests semantic transformations.
   * Avoids monotonous "Title + Bullets" repeating on every slide.
   */
  assessVisualVariety(slides: SlidePlan[]): VisualVarietyReport {
    let bulletOnlyCount = 0;
    const layoutDistribution: Record<string, number> = {};

    for (const slide of slides) {
      const layout = slide.layoutIntent || 'bullet_summary';
      layoutDistribution[layout] = (layoutDistribution[layout] || 0) + 1;

      if (
        layout === 'bullet_summary' &&
        (!slide.dataVizType || slide.dataVizType === 'none') &&
        !slide.imageRequired &&
        slide.visualIntentHints.length === 0
      ) {
        bulletOnlyCount++;
      }
    }

    const totalSlides = slides.length || 1;
    const bulletOnlyRatio = bulletOnlyCount / totalSlides;
    const varietyScore = Math.max(0, Math.round((1 - bulletOnlyRatio) * 100));

    const recommendations: string[] = [];
    if (bulletOnlyRatio > 0.6) {
      recommendations.push(
        `ڕێژەی ${Math.round(bulletOnlyRatio * 100)}% لە سلایدەکان تەنها وەک زانیاری خاڵبەندی (Bullets) ڕێکخراون. ڕاسپێردراوە هەندێک لە سلایدەکان بگوێزرێنەوە بۆ شێوازی Timeline, Comparison یان Cards.`
      );
    }

    return {
      bulletOnlyCount,
      layoutDistribution,
      varietyScore,
      recommendations
    };
  }

  /**
   * Automatically assigns visual intent hints to improve semantic variety without modifying factual content.
   */
  enhanceSlideVariety(slides: SlidePlan[]): SlidePlan[] {
    return slides.map((slide, index) => {
      // If slide is generic bullets, inspect text for potential semantic transformation
      if (slide.layoutIntent === 'bullet_summary' && slide.visualIntentHints.length === 0) {
        const text = `${slide.title} ${slide.points?.join(' ') || ''}`;

        if (/کات|ساڵ|ڕێکەوت|سەدە|مێژوو/i.test(text)) {
          slide.visualIntentHints = ['temporal', 'timeline'];
          slide.layoutIntent = 'timeline';
        } else if (/بەراورد|جیاوازی|باشتر|خراپتر/i.test(text)) {
          slide.visualIntentHints = ['comparison'];
          slide.layoutIntent = 'two_column';
        } else if (/قۆناغ|هەنگاو|لۆجیک/i.test(text)) {
          slide.visualIntentHints = ['process'];
          slide.layoutIntent = 'process_steps';
        } else if (index === Math.floor(slides.length / 2)) {
          slide.visualIntentHints = ['evidence_card'];
          slide.layoutIntent = 'quote_highlight';
        }
      }
      return slide;
    });
  }
}
