import { Injectable } from '@angular/core';
import { SlidePlan } from '../../models/presentation.model';

export interface DensityEvaluationResult {
  densityScore: number; // 0..100
  status: 'optimal' | 'spacious' | 'overloaded';
  warningMessage?: string;
  wordCount: number;
  bulletCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class InformationDensityEngineService {
  /**
   * Evaluates slide information density based on academic level, presentation duration, and content complexity.
   * NEVER deletes user/academic content automatically when overloaded.
   */
  evaluateDensity(
    slide: SlidePlan,
    academicLevel = 'bachelor',
    presentationDurationMinutes = 15
  ): DensityEvaluationResult {
    const points = slide.contentPlan?.blocks?.map(b => b.text) || slide.points || [];
    const bulletCount = points.length;
    const fullText = `${slide.title} ${points.join(' ')} ${slide.contentPlan?.explanation || ''}`;
    const wordCount = fullText.split(/\s+/).filter(w => w.trim().length > 0).length;

    // Academic levels threshold limits
    let maxWordsThreshold = 90;
    let maxBulletsThreshold = 6;

    if (academicLevel === 'qutabxana' || academicLevel === 'school') {
      maxWordsThreshold = 60;
      maxBulletsThreshold = 4;
    } else if (academicLevel === 'postgrad' || academicLevel === 'doctoral' || academicLevel === 'master') {
      maxWordsThreshold = 120;
      maxBulletsThreshold = 8;
    }

    // Adjust by presentation duration (e.g. 5 min pitch vs 30 min defense)
    if (presentationDurationMinutes <= 5) {
      maxWordsThreshold = Math.floor(maxWordsThreshold * 0.7);
    }

    const wordDensityRatio = wordCount / maxWordsThreshold;
    const bulletDensityRatio = bulletCount / maxBulletsThreshold;
    const maxRatio = Math.max(wordDensityRatio, bulletDensityRatio);

    const densityScore = Math.min(100, Math.round(maxRatio * 50));

    if (maxRatio > 1.2) {
      return {
        densityScore,
        status: 'overloaded',
        wordCount,
        bulletCount,
        warningMessage: `چڕیی ناوەڕۆکی سلایدی ${slide.slideNumber} بەرزە (${wordCount} وشە، ${bulletCount} خاڵ). ئامۆژگاری دەکرێت ناوەڕۆکەکە بەش بکرێت بۆ ڕوونی زیاتر، بەڵام هیچ داتایەک نەسرایەوە.`
      };
    }

    if (maxRatio < 0.3 && wordCount < 15 && slide.slideType !== 'title') {
      return {
        densityScore,
        status: 'spacious',
        wordCount,
        bulletCount,
        warningMessage: `سلایدی ${slide.slideNumber} زۆر بەتاڵ دەردەکەوێت (${wordCount} وشە).`
      };
    }

    return {
      densityScore,
      status: 'optimal',
      wordCount,
      bulletCount
    };
  }
}
