import { Injectable } from '@angular/core';
import { AcademicDocument } from '../../models/academic-writing.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus
} from '../../models/academic-review.model';

export interface TermUsageGroup {
  preferredTerm: string;
  variants: string[];
  usageCount: number;
  inconsistencies: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TerminologyConsistencyService {
  /**
   * Scans document for terminology usage across sections and identifies candidates
   * for inconsistency without automatically modifying terms.
   */
  reviewTerminologyConsistency(document: AcademicDocument): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [];

    // Predefined common academic concept synonym pairs / triplets in Kurdish and English context
    const synonymSets: { primary: string; synonyms: string[] }[] = [
      { primary: 'ئامراز', synonyms: ['ئامێر', 'میکانیزم', 'tool', 'device', 'instrument'] },
      { primary: 'ڕێباز', synonyms: ['میثۆدۆلۆژی', 'شێواز', 'methodology', 'method'] },
      { primary: 'دەرئەنجام', synonyms: ['ئەنجام', 'ئاکام', 'conclusion', 'result'] },
      { primary: 'سەرچاوە', synonyms: ['ژێدەر', 'سەرچاوەی زانستی', 'source', 'reference'] },
      { primary: 'بانگەشە', synonyms: ['تێز', 'ادعاء', 'claim', 'thesis'] }
    ];

    let fullText = '';
    (document.sections || []).forEach(sec => {
      (sec.paragraphs || []).forEach(p => {
        if (p.text) fullText += ' ' + p.text;
      });
    });

    synonymSets.forEach((set, sIdx) => {
      const foundTerms: string[] = [];
      if (fullText.includes(set.primary)) {
        foundTerms.push(set.primary);
      }
      set.synonyms.forEach(syn => {
        if (fullText.includes(syn)) {
          foundTerms.push(syn);
        }
      });

      if (foundTerms.length >= 2) {
        evidenceSnippets.push(`چەمکی "${set.primary}": بەکارهێنانی ئاوێتەی (${foundTerms.join('، ')})`);

        const findingId = `finding_term_inconsistent_${sIdx}`;
        const recId = `rec_term_inconsistent_${sIdx}`;

        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'terminology_consistency',
          severity: 'minor',
          message: `یەکگرتوونەنیشاندانی زاراوە: چەمکی "${set.primary}" بە چەند شێوازێکی جیاواز (${foundTerms.join('، ')}) لە تەواوی بەڵگەنامەکەدا بەکارهاتووە.`,
          location: {
            type: 'section',
            details: 'تەواوی بەڵگەنامە'
          },
          recommendation: {
            id: recId,
            findingId,
            action: `یەک زاراوەی پێوەر (بۆ نموونە: "${set.primary}") هەڵبژێرە لە تەواوی دەقەکەدا تاوەکو لە گواستنەوەی چەمکەکاندا یەکگرتوو بێت.`,
            explanation: 'پەیڕەوکردنی یەک زاراوەی دیاریکراو ڕوونیی فیکری توێژینەوە بەهێز دەکات.'
          }
        };

        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }
    });

    let status: ReviewStatus = 'pass';
    if (findings.some(f => f.severity === 'critical' || f.severity === 'major')) {
      status = 'needs_revision';
    } else if (findings.some(f => f.severity === 'moderate' || f.severity === 'minor')) {
      status = 'pass_with_warnings';
    }

    return {
      dimension: 'terminology_consistency',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
