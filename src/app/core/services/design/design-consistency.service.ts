import { Injectable } from '@angular/core';
import {
  SlideDesignSpec,
  DesignFinding
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class DesignConsistencyService {
  /**
   * Evaluates overall design consistency across all slides in a presentation.
   */
  evaluateConsistency(slides: SlideDesignSpec[]): {
    consistencyScore: number; // 0 - 100
    findings: DesignFinding[];
  } {
    const findings: DesignFinding[] = [];
    if (slides.length <= 1) {
      return { consistencyScore: 100, findings: [] };
    }

    const firstSlide = slides[0];
    const targetLanguage = firstSlide.typography.language;
    const targetDirection = firstSlide.typography.direction;
    const targetTheme = firstSlide.colorPalette.theme;
    const targetTitleFont = firstSlide.typography.slideTitle.fontFamily;

    let mismatchCount = 0;

    slides.forEach((slide) => {
      // Check theme consistency
      if (slide.colorPalette.theme !== targetTheme) {
        mismatchCount++;
        findings.push({
          id: `inconsistent_theme_${slide.slideNumber}`,
          slideNumber: slide.slideNumber,
          category: 'consistency',
          severity: 'major',
          message: `تیمی ڕەنگی سڵایدی ${slide.slideNumber} (${slide.colorPalette.theme}) جیاوازە لە سڵایدی سەرەتا (${targetTheme}).`,
          location: 'پالێتی ڕەنگەکان',
          rationale: 'تێکچوونی تیمی ڕەنگەکان لە ناو یەک پڕێزەنتەیشن ڕێکپۆشی کەم دەکاتەوە.',
          recommendation: 'تیمی ڕەنگەکان بۆ هەموو سڵایدەکان یەکخستن بکە.'
        });
      }

      // Check font family consistency
      if (slide.typography.slideTitle.fontFamily !== targetTitleFont) {
        mismatchCount++;
        findings.push({
          id: `inconsistent_font_${slide.slideNumber}`,
          slideNumber: slide.slideNumber,
          category: 'consistency',
          severity: 'moderate',
          message: `فۆنتی سەردێڕی سڵایدی ${slide.slideNumber} لەگەڵ سڵایدەکانی تر یەکناگرێتەوە.`,
          location: 'تایپۆگرافی سەردێڕ',
          rationale: 'بەکارهێنانی فۆنتی جیاواز تێکچوونی تایپۆگرافی دروست دەکات.',
          recommendation: 'فۆنتی سەردێڕەکان بکە بە ${targetTitleFont}.'
        });
      }

      // Check direction/RTL consistency
      if (slide.typography.direction !== targetDirection || slide.typography.language !== targetLanguage) {
        mismatchCount++;
        findings.push({
          id: `inconsistent_dir_${slide.slideNumber}`,
          slideNumber: slide.slideNumber,
          category: 'alignment',
          severity: 'critical',
          message: `ئاراستەی دەقی سڵایدی ${slide.slideNumber} (${slide.typography.direction}) لەگەڵ زمانی گشتی (${targetLanguage}) ناگونجێت.`,
          location: 'ئاراستەی دەق (RTL/LTR)',
          rationale: 'ئاراستەی هەڵەی دەق خوێندنەوە تێکدەدات.',
          recommendation: 'ئاراستەی دەق لەگەڵ زمانی دیاریکراو ڕێکبخەرەوە.'
        });
      }
    });

    const maxScore = 100;
    const penalty = Math.min(60, mismatchCount * 15);
    const consistencyScore = maxScore - penalty;

    return {
      consistencyScore,
      findings
    };
  }
}
