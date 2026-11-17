import { Injectable } from '@angular/core';
import { SlideDesignSpec, DesignFinding } from '../../models/presentation.model';

export interface ConsistencyEvaluationResult {
  consistencyScore: number; // 0 - 100
  isCohesive: boolean;
  findings: DesignFinding[];
  recommendations: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VisualConsistencyService {
  /**
   * Evaluates visual consistency across slides in a presentation design spec.
   */
  evaluateVisualConsistency(slides: SlideDesignSpec[]): ConsistencyEvaluationResult {
    const findings: DesignFinding[] = [];
    const recommendations: string[] = [];

    if (slides.length <= 1) {
      return {
        consistencyScore: 100,
        isCohesive: true,
        findings: [],
        recommendations: []
      };
    }

    let penalty = 0;

    // Check 1: Primary Language & Typography Direction
    const firstDir = slides[0]?.typography.direction;
    const fontMismatch = slides.some(s => s.typography.direction !== firstDir);
    if (fontMismatch) {
      penalty += 25;
      findings.push({
        id: `cons_dir_${Date.now()}`,
        slideNumber: 0,
        category: 'consistency',
        severity: 'critical',
        message: 'ئاڕاستەی ئاخاوتن و فونتەکان (RTL/LTR) لە نێوان سلایدەکاندا نەگونجاوە',
        location: 'Typography Engine',
        rationale: 'تێکەڵکردنی ئاڕاستەی فونت سەرنجی خوێنەر دەپچڕێنێت',
        recommendation: 'سەرجەم سلایدەکان بۆ یەک ئاڕاستەی ستاندارد ڕێکبخەرەوە'
      });
    }

    // Check 2: Color Palette Theme
    const firstTheme = slides[0]?.colorPalette.theme;
    const themeMismatch = slides.filter(s => s.colorPalette.theme !== firstTheme);
    if (themeMismatch.length > 0) {
      penalty += 20;
      findings.push({
        id: `cons_theme_${Date.now()}`,
        slideNumber: 0,
        category: 'consistency',
        severity: 'major',
        message: 'ڕەنگی سەرەکی دیزاین لە نێوان سلایدەکاندا جیاوازە',
        location: 'Color System',
        rationale: 'یەکپارچەیی رەنگەکان گوزارشت لە پێناسەی تیمی ئەکادیمی دەکات',
        recommendation: 'پایەی ڕەنگی سەرەکی بۆ تەواوی پێشکەشکردنەکە یەکبخە'
      });
    }

    // Check 3: Grid Margins
    const firstMargin = slides[0]?.grid.margins.left;
    const marginMismatch = slides.some(s => s.grid.margins.left !== firstMargin);
    if (marginMismatch) {
      penalty += 15;
      findings.push({
        id: `cons_margin_${Date.now()}`,
        slideNumber: 0,
        category: 'consistency',
        severity: 'moderate',
        message: 'پەراوێزی grid لە نێوان سلایدەکاندا یەکسان نییە',
        location: 'Layout Grid',
        rationale: 'ناپڕبوونی پەراوێزەکان بڕوایی دیزاین دادەبەزێنێت',
        recommendation: 'پەراوێزەکان لە سەرجەم سلایدەکان لەسەر 5% یان 8% جێگیر بکە'
      });
    }

    const consistencyScore = Math.max(0, 100 - penalty);
    if (consistencyScore < 80) {
      recommendations.push('تکایە دڵنیابەرەوە لە بەیەکەوەبەستنەوەی سیستەمی ڕەنگ، فونت و پەراوێزەکان');
    }

    return {
      consistencyScore,
      isCohesive: consistencyScore >= 80,
      findings,
      recommendations
    };
  }
}
