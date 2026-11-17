import { Injectable } from '@angular/core';
import { ResearchQuestion, ResearchPlan } from '../../models/research.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class ResearchQuestionReviewService {
  /**
   * Evaluates research questions for clarity, specificity, researchability, scope,
   * academic relevance, and ambiguity without mutating original questions.
   */
  reviewResearchQuestions(
    questions: ResearchQuestion[],
    researchPlan?: ResearchPlan
  ): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidence: string[] = [];

    if (researchPlan?.topic) {
      evidence.push(`پلاینی توێژینەوە: "${researchPlan.topic}"`);
    }

    if (!questions || questions.length === 0) {
      const findingId = 'finding_rq_missing';
      const recId = 'rec_rq_missing';
      const finding: ReviewFinding = {
        id: findingId,
        dimension: 'research_question_quality',
        severity: 'major',
        message: 'هیچ پرسیارێکی توێژینەوە (Research Question) دیاری نەکراوە.',
        location: {
          type: 'section',
          details: 'بەشی پرسیارەکانی توێژینەوە'
        },
        recommendation: {
          id: recId,
          findingId,
          action: 'پرسیاری توێژینەوەی ڕوون و دیاریکراو بنووسە.',
          explanation: 'تەواوی ڕەوتی توێژینەوە و کۆکردنەوەی بەڵگە لەسەر بنەمای پرسیاری سەرەکی توێژینەوە دادەمەزرێت.'
        }
      };
      findings.push(finding);
      if (finding.recommendation) {
        recommendations.push(finding.recommendation);
      }
    } else {
      questions.forEach((rq, idx) => {
        evidence.push(`پرسیاری ${idx + 1}: "${rq.question}"`);
        const qText = rq.question ? rq.question.trim() : '';

        // Check clarity and brevity
        if (qText.length < 15) {
          const findingId = `finding_rq_short_${rq.id || idx}`;
          const recId = `rec_rq_short_${rq.id || idx}`;
          const finding: ReviewFinding = {
            id: findingId,
            dimension: 'research_question_quality',
            severity: 'moderate',
            message: `پرسیاری توێژینەوەی ${idx + 1} زۆر کورت یان ناڕوونە.`,
            location: {
              type: 'sentence',
              sentenceText: qText,
              details: `پرسیاری ${idx + 1}`
            },
            recommendation: {
              id: recId,
              findingId,
              action: 'ڕوونکردنەوەی زیاتر ببه‌خشه‌ بە پرسیارەکە بۆ دیاریکردنی گۆڕاوەکان (Variables) و چوارچێوەی توێژینەوەکە.',
              explanation: 'پرسیاری زۆر کورت ناتوانێت ئاراستەی توێژینەوە بە ڕوونی دیاری بکات.'
            }
          };
          findings.push(finding);
          if (finding.recommendation) recommendations.push(finding.recommendation);
        }

        // Check for overly general or vague words (e.g. "شتی باش", "هەموو شتێک", "good", "everything", "stuff")
        const vagueIndicators = ['شتی باش', 'هەموو شتێک', 'چۆنە', 'شتەکان', 'stuff', 'everything', 'good or bad'];
        const isVague = vagueIndicators.some(vi => qText.toLowerCase().includes(vi));
        if (isVague) {
          const findingId = `finding_rq_vague_${rq.id || idx}`;
          const recId = `rec_rq_vague_${rq.id || idx}`;
          const finding: ReviewFinding = {
            id: findingId,
            dimension: 'research_question_quality',
            severity: 'major',
            message: `پرسیاری ${idx + 1} زاراوەی گشتی یان ناڕوونی تێدایە کە تایبەتمەندی (Specificity) کەم دەکاتەوە.`,
            location: {
              type: 'sentence',
              sentenceText: qText,
              details: `پرسیاری ${idx + 1}`
            },
            recommendation: {
              id: recId,
              findingId,
              action: 'زاراوە گشتییەکان بگۆڕە بۆ گۆڕاوی ئەکادیمی و سنوردارکردنی مەودای توێژینەوە (Scope).',
              explanation: 'پرسیاری گشتی ڕێگە بە توێژینەوەی ئەکادیمی وەڵامدراوە نادات.'
            }
          };
          findings.push(finding);
          if (finding.recommendation) recommendations.push(finding.recommendation);
        }

        // Check for researchability (must not be purely rhetorical or simple yes/no without analytical depth)
        if (!qText.includes('؟') && !qText.includes('?') && !qText.startsWith('تا چ ئاستێک') && !qText.startsWith('چۆن') && !qText.startsWith('کاریگەری')) {
          const findingId = `finding_rq_format_${rq.id || idx}`;
          const recId = `rec_rq_format_${rq.id || idx}`;
          const finding: ReviewFinding = {
            id: findingId,
            dimension: 'research_question_quality',
            severity: 'minor',
            message: `پێکهاتەی پرسیاری ${idx + 1} شێوازی پرسیارکردنی ئەکادیمی نییە.`,
            location: {
              type: 'sentence',
              sentenceText: qText
            },
            recommendation: {
              id: recId,
              findingId,
              action: 'پرسیارەکە بە دەستەواژەی لێکۆڵینەوەیی دابڕێژەرەوە (وەک: "تا چ ئاستێک...", "تەحلیلی کاریگەری...").',
              explanation: 'شێوازی دەربڕینی پرسیار کارتێکردنی ڕاستەوخۆی هەیە لەسەر شیکاری بەڵگەکان.'
            }
          };
          findings.push(finding);
          if (finding.recommendation) recommendations.push(finding.recommendation);
        }
      });
    }

    let status: ReviewStatus = 'pass';
    const hasMajor = findings.some(f => f.severity === 'critical' || f.severity === 'major');
    const hasModerate = findings.some(f => f.severity === 'moderate');

    if (hasMajor) {
      status = 'needs_revision';
    } else if (hasModerate) {
      status = 'pass_with_warnings';
    }

    return {
      dimension: 'research_question_quality',
      status,
      findings,
      evidence,
      recommendations
    };
  }
}
