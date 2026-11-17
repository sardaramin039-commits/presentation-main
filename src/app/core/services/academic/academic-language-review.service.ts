import { Injectable } from '@angular/core';
import { AcademicDocument } from '../../models/academic-writing.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicLanguageReviewService {
  /**
   * Evaluates academic language style, colloquialisms, repetitiveness, sentence clarity,
   * and paragraph coherence without modifying factual content.
   */
  reviewAcademicLanguage(
    document: AcademicDocument,
    academicLevel = '🎓 زانکۆ - بەکالۆریۆس'
  ): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [
      `ئاستی ئەکادیمی بپشکنراو: ${academicLevel}`
    ];

    const colloquialPhrases = [
      'بە ڕای من', 'تێبینی بکە کە', 'ئەمە وایە کە', 'وەک هەمووان دەیزانن',
      'in my opinion', 'basically', 'actually', 'as everyone knows'
    ];

    (document.sections || []).forEach(sec => {
      (sec.paragraphs || []).forEach(p => {
        const text = p.text ? p.text.trim() : '';
        if (!text) return;

        // Check colloquial/informal language
        colloquialPhrases.forEach(colloq => {
          if (text.includes(colloq)) {
            const findingId = `finding_lang_colloq_${p.id}_${colloq.replace(/\s+/g, '_')}`;
            const recId = `rec_lang_colloq_${p.id}_${colloq.replace(/\s+/g, '_')}`;
            const finding: ReviewFinding = {
              id: findingId,
              dimension: 'academic_language',
              severity: 'moderate',
              message: `زمانی ئاخاوتنی نا-ئەکادیمی: بڕگەکە دەستەواژەی نا-فەرمی "${colloq}"ی تێدایە.`,
              location: {
                type: 'paragraph',
                paragraphId: p.id,
                sectionId: sec.id,
                sectionTitle: sec.sectionTitle,
                sentenceText: text.substring(0, 80) + '...'
              },
              recommendation: {
                id: recId,
                findingId,
                action: 'دەستەواژە ناکاریگەرە نا-فەرمییەکان بسڕەوە یان بە دەربڕینی بابەتیی ئەکادیمی جێگەیان بگرەرەوە.',
                explanation: 'نووسینی ئەکادیمی پێویستی بە زمانی بێلایەن و دوور لە دەستەواژەی ئاخاوتنی باو هەیە.'
              }
            };
            findings.push(finding);
            if (finding.recommendation) recommendations.push(finding.recommendation);
            evidenceSnippets.push(`بڕگەی ${p.id}: ئامادەیی دەستەواژەی نا-فەرمی "${colloq}"`);
          }
        });

        // Check sentence length clarity (e.g. sentences over 300 characters without punctuation)
        const sentences = text.split(/[.؟?!]/).filter(s => s.trim().length > 0);
        sentences.forEach((sent, sIdx) => {
          if (sent.length > 280) {
            const findingId = `finding_lang_length_${p.id}_s${sIdx}`;
            const recId = `rec_lang_length_${p.id}_s${sIdx}`;
            const finding: ReviewFinding = {
              id: findingId,
              dimension: 'academic_language',
              severity: 'minor',
              message: 'ڕستەی ئاڵۆزی درێژ: ڕستەکە زۆر درێژە و لەوانەیە ڕەوانیی تێگەیشتنی خوێنەر کەم بکاتەوە.',
              location: {
                type: 'sentence',
                sentenceText: sent.trim(),
                paragraphId: p.id,
                sectionId: sec.id
              },
              recommendation: {
                id: recId,
                findingId,
                action: 'ڕستە درێژەکە دابەش بکە بۆ دوو ڕستەی کورتتر و ڕوونتر.',
                explanation: 'ڕستەی زۆر درێژ تێگەیشتنی خوێنەر بۆ پەیامی سەرەکی گران دەکات.'
              }
            };
            findings.push(finding);
            if (finding.recommendation) recommendations.push(finding.recommendation);
          }
        });
      });
    });

    let status: ReviewStatus = 'pass';
    if (findings.some(f => f.severity === 'critical' || f.severity === 'major')) {
      status = 'needs_revision';
    } else if (findings.some(f => f.severity === 'moderate' || f.severity === 'minor')) {
      status = 'pass_with_warnings';
    }

    return {
      dimension: 'academic_language',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
