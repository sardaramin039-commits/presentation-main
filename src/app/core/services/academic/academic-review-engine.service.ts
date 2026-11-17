import { Injectable, inject } from '@angular/core';
import { FactCheckService } from '../evidence/fact-check.service';
import { CitationGeneratorService } from './citation-generator.service';

export interface AcademicReviewReport {
  isAcademicallyRigorous: boolean;
  overallScore: number;
  warnings: string[];
}

interface ReviewableSlide {
  bullets?: string[];
  citation?: string;
}

@Injectable({ providedIn: 'root' })
export class AcademicReviewEngineService {
  private readonly factChecker = inject(FactCheckService);
  private readonly citationGen = inject(CitationGeneratorService);

  evaluateContent(slides: ReviewableSlide[]): AcademicReviewReport {
    let totalScore = 0;
    const allWarnings: string[] = [];

    slides.forEach((slide, index) => {
      // 1. پشکنینی ڕاستییەکان لەناو دەقی سلایدەکە
      const textToAnalyze = slide.bullets ? slide.bullets.join(' ') : '';
      const factResult = this.factChecker.verifyClaims(textToAnalyze);
      
      totalScore += factResult.confidenceScore;

      if (!factResult.isVerified) {
        allWarnings.push(`ئاگاداری لە سلایدی ${index + 1}: ${factResult.suggestedCorrections.join(' ')}`);
      }

      // 2. پشکنینی سەرچاوە
      if (!slide.citation || slide.citation.length < 5) {
        allWarnings.push(`ئاگاداری لە سلایدی ${index + 1}: سەرچاوەی باوەڕپێکراو یان زانستی دانەنراوە.`);
      }
    });

    const averageScore = slides.length > 0 ? (totalScore / slides.length) : 0;

    return {
      isAcademicallyRigorous: averageScore >= 0.8 && allWarnings.length === 0,
      overallScore: averageScore,
      warnings: allWarnings
    };
  }
}
