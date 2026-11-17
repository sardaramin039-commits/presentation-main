import { Injectable } from '@angular/core';

export interface FactCheckResult {
  isVerified: boolean;
  confidenceScore: number;
  flaggedClaims: string[];
  suggestedCorrections: string[];
}

@Injectable({ providedIn: 'root' })
export class FactCheckService {
  // لیستێک لەو وشە و دەستەواژانەی کە لە توێژینەوەی زانستیدا جێگەی گومانن ئەگەر بەڵگەیان لەگەڵ نەبێت
  private readonly ABSOLUTE_TERMS = ['هەموو', 'هەرگیز', 'بە دڵنیاییەوە', 'سەدا سەد', 'بێگومان', 'هەردەم'];

  verifyClaims(text: string): FactCheckResult {
    const flagged: string[] = [];
    const suggestions: string[] = [];
    let score = 1.0;

    if (!text) return { isVerified: true, confidenceScore: 1.0, flaggedClaims: [], suggestedCorrections: [] };

    this.ABSOLUTE_TERMS.forEach(term => {
      if (text.includes(term)) {
        flagged.push(`بەکارهێنانی دەستەواژەی ڕەها: "${term}"`);
        suggestions.push(`پێشنیار: لەبری "${term}"، دەستەواژەی زانستیتر بەکاربهێنە وەک "زۆرجار" یان "بەپێی زۆربەی سەرچاوەکان".`);
        score -= 0.15;
      }
    });

    return {
      isVerified: flagged.length === 0,
      confidenceScore: Math.max(0, score),
      flaggedClaims: flagged,
      suggestedCorrections: suggestions
    };
  }
}
