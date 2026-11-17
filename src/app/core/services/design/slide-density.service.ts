import { Injectable } from '@angular/core';
import {
  SlidePlan,
  DesignFinding
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class SlideDensityService {
  /**
   * Analyzes slide text and element density without deleting content.
   */
  analyzeDensity(slide: SlidePlan): {
    densityStatus: 'optimal' | 'spacious' | 'overloaded';
    findings: DesignFinding[];
  } {
    const findings: DesignFinding[] = [];
    const totalWords = slide.contentPlan.blocks.reduce((sum, b) => sum + b.text.split(/\s+/).length, 0);
    const bulletCount = slide.contentPlan.blocks.filter(b => b.type === 'bullet').length;
    const citationCount = slide.citationMaps.length;
    const evidenceCount = slide.evidenceMaps.length;

    let isOverloaded = false;

    // Check text word count
    if (totalWords > 180) {
      isOverloaded = true;
      findings.push({
        id: `density_words_${slide.slideNumber}`,
        slideNumber: slide.slideNumber,
        category: 'density',
        severity: 'major',
        message: `سڵایدی ${slide.slideNumber} زیاتر لە ۱۸۰ وشەی تێدایە (${totalWords} وشە).`,
        location: 'سەردێر و جەستەی سڵاید',
        rationale: 'ڕێژەی بەرزی وشەکان دەبێتە هۆی شڵەژانی بینراو و کەمبوونەوەی سەرنجی بینەر.',
        recommendation: 'نارۆک بە شێوەی کارتی جیاواز یاخود ناوەڕۆکی کورتکراوە ڕێکبخەرەوە.'
      });
    }

    // Check excessive bullets
    if (bulletCount > 6) {
      isOverloaded = true;
      findings.push({
        id: `density_bullets_${slide.slideNumber}`,
        slideNumber: slide.slideNumber,
        category: 'density',
        severity: 'moderate',
        message: `سڵایدی ${slide.slideNumber} زیاتر لە ٦ خاڵی خستۆتەڕوو (${bulletCount} خاڵ).`,
        location: 'لیستی خاڵبەندی',
        rationale: 'خاڵی زۆر بینەر ماندوو دەکات.',
        recommendation: 'خاڵەکان بۆ ۲ یان ۳ گرووپی سەرەکی دابەش بپۆلێنە.'
      });
    }

    // Check citation clutter
    if (citationCount > 4) {
      findings.push({
        id: `density_citations_${slide.slideNumber}`,
        slideNumber: slide.slideNumber,
        category: 'citation_visibility',
        severity: 'minor',
        message: `سڵایدی ${slide.slideNumber} ژمارەیەکی زۆری ژێدەرەکان تێدا تۆمارکراوە (${citationCount} ژێدەر).`,
        location: 'بەشی ژێدەرەکان',
        rationale: 'پەیوەندی ژێدەرەکان لە ژێرەوە دەبێتە هۆی کەمبوونەوەی شوێنی سپی (Whitespace).',
        recommendation: 'تەنها ژێدەرە سەرەکییەکان لەسەر سڵاید بهێڵەرەوە و باقیاکەی بگوێزەرەوە بۆ سەرچاوەکان.'
      });
    }

    let status: 'optimal' | 'spacious' | 'overloaded' = 'optimal';
    if (isOverloaded) {
      status = 'overloaded';
    } else if (totalWords < 40 && bulletCount <= 2 && evidenceCount <= 1) {
      status = 'spacious';
    }

    return {
      densityStatus: status,
      findings
    };
  }
}
