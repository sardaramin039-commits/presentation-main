import { Injectable, inject } from '@angular/core';
import { SelectedEvidenceItem } from '../../models/evidence.model';
import { CalibratedConfidenceResult } from '../../models/confidence.model';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

export interface AbstentionEvaluation {
  shouldAbstain: boolean;
  abstentionReasonKurdish?: string;
  suggestedResearchDirectionsKurdish: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AbstentionService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Evaluates whether the system MUST abstain due to insufficient or unverified evidence
   */
  public evaluateAbstention(
    evidenceList: SelectedEvidenceItem[],
    confidence: CalibratedConfidenceResult,
    userQuery: string
  ): AbstentionEvaluation {
    // 1. Zero evidence state
    if (!evidenceList || evidenceList.length === 0) {
      this.provenanceService.createChain('answer_generation', `Abstained due to zero retrieved evidence for query: ${userQuery}`);
      return {
        shouldAbstain: true,
        abstentionReasonKurdish: `زانیاری و بەڵگەی بەس بەردەست نییە بۆ پشتیوانیکردنی وەڵامی بەڵگەدار بۆ پرسیاری '${userQuery}'. زانیارییە خەیاڵییەکان یان نەپشکنراوەکان ڕەتکراونەتەوە.`,
        suggestedResearchDirectionsKurdish: [
          `گەڕان لە بنکەداتەی Crossref و PubMed بۆ دۆزینەوەی وتاری ئەکادیمی خاوەن DOI لەسەر '${userQuery}'.`,
          `بەارهێنانی زاراوە بەدیلە ئینگلیزییەکانی وەک '${userQuery}' لە ژووری توێژینەوەدا.`,
          `پشکنینی کتێبە ئەکادیمییە تۆمارکراوەکانی خوێندنی باڵا.`
        ]
      };
    }

    // 2. Unverified evidence / Extremely low confidence state
    if (confidence.finalScore < 30 || confidence.level === 'VERY_LOW') {
      this.provenanceService.createChain('answer_generation', `Abstained due to VERY_LOW confidence (${confidence.finalScore}%) for query: ${userQuery}`);
      return {
        shouldAbstain: true,
        abstentionReasonKurdish: `بەڵگە بەردەستەکان ئاستی متمانەی زانستییان نزمە (${confidence.finalScore}%) و بەس نین بۆ پێشکەشکردنی بڕیاری کۆتایی.`,
        suggestedResearchDirectionsKurdish: [
          `زۆربوونی سەرچاوەی خاوەن DOI و peer-review بپشکنە.`,
          `دەقەکە بە شێوەیەکی کاتی وەک ڕا یان گریمانە وەربگرە تا بەڵگەی سەلمێنراو زیاد دەکرێت.`
        ]
      };
    }

    return {
      shouldAbstain: false,
      suggestedResearchDirectionsKurdish: []
    };
  }
}
