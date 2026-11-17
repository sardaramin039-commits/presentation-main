import { Injectable } from '@angular/core';
import { Contradiction } from '../../models/fact-check.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewSeverity,
  ReviewStatus
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class ContradictionReviewService {
  /**
   * Evaluates contradiction data from Fact Checking Engine and converts unresolved
   * contradictions into major/critical review findings.
   */
  reviewContradictionStatus(contradictions: Contradiction[] = []): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [];

    if (!contradictions || contradictions.length === 0) {
      evidenceSnippets.push('هیچ دژایەتییەک (Contradiction) دیاری نەکراوە.');
      return {
        dimension: 'contradiction_status',
        status: 'pass',
        findings: [],
        evidence: evidenceSnippets,
        recommendations: []
      };
    }

    contradictions.forEach((c, idx) => {
      const isUnresolved = c.resolutionStatus === 'unresolved' || c.resolutionStatus === 'partially_resolved';
      evidenceSnippets.push(`دژایەتی ${idx + 1}: [${c.type}] ${c.statementA} ↔ ${c.statementB} (resolutionStatus=${c.resolutionStatus})`);

      if (isUnresolved) {
        const findingId = `finding_contra_${c.id || idx}`;
        const recId = `rec_contra_${c.id || idx}`;

        // Severity: direct / numerical / date contradictions are critical; scope/definition are major
        const isHighImpact = c.type === 'direct' || c.type === 'numerical' || c.type === 'date';
        const severity: ReviewSeverity = isHighImpact ? 'critical' : 'major';

        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'contradiction_status',
          severity,
          message: `ناکۆکیی شیکارنەکراو (${c.type}): دەقی A "${c.statementA}" پێچەوانەی دەقی B "${c.statementB}" دەبێتەوە.`,
          location: {
            type: 'claim',
            claimId: c.claimId,
            details: `ناکۆکی ${c.type}`
          },
          relatedClaimId: c.claimId,
          relatedSourceId: c.sourceA?.id || c.sourceB?.id,
          recommendation: {
            id: recId,
            findingId,
            action: 'پێداچوونەوە بە سەرچاوەکان بکە و ناکۆکییەکە شیکار بکە یان هۆکاری جیاوازی داتاکان ڕوون بکەرەوە.',
            explanation: 'پێشکەشکردنی داتای دژبەیەک بەبێ ڕوونکردنەوە لە نووسینی زانستیدا کەموکورتییەکی زەقە.'
          }
        };

        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }
    });

    let status: ReviewStatus = 'pass';
    if (findings.some(f => f.severity === 'critical')) {
      status = 'critical_revision';
    } else if (findings.some(f => f.severity === 'major')) {
      status = 'needs_revision';
    } else if (findings.some(f => f.severity === 'moderate' || f.severity === 'minor')) {
      status = 'pass_with_warnings';
    }

    return {
      dimension: 'contradiction_status',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
