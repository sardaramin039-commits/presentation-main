import { Injectable } from '@angular/core';
import { Claim, Evidence, Source, Citation } from '../../models/research.model';
import { Contradiction } from '../../models/fact-check.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewSeverity,
  ReviewStatus,
  ReviewTraceability
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class ClaimEvidenceReviewService {
  /**
   * Reviews each claim against its linked evidence, source verification status,
   * citations, and potential contradictions.
   */
  reviewClaimEvidenceAlignment(
    claims: Claim[] = [],
    evidenceList: Evidence[] = [],
    sources: Source[] = [],
    citations: Citation[] = [],
    contradictions: Contradiction[] = []
  ): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [];

    if (!claims || claims.length === 0) {
      evidenceSnippets.push('هیچ بانگەشەیەکی دروستکراو (Claim) نەدۆزرایەوە.');
      return {
        dimension: 'claim_evidence_alignment',
        status: 'pass_with_warnings',
        findings: [{
          id: 'finding_claim_empty',
          dimension: 'claim_evidence_alignment',
          severity: 'informational',
          message: 'دەقەکە هیچ بانگەشەیەکی جیاکراوەی (Claim) نییە بۆ پشکنینی بەڵگە.',
          location: { type: 'section', details: 'کۆکراوەی بانگەشەکان' }
        }],
        evidence: evidenceSnippets,
        recommendations: []
      };
    }

    const sourceMap = new Map<string, Source>();
    sources.forEach(s => sourceMap.set(s.id, s));

    const citationClaimMap = new Map<string, Citation>();
    citations.forEach(c => {
      if (c.claimId) citationClaimMap.set(c.claimId, c);
    });

    const contradictionClaimIds = new Set<string>();
    contradictions.forEach(c => {
      if (c.claimId) contradictionClaimIds.add(c.claimId);
    });

    claims.forEach(claim => {
      const linkedEvidence = evidenceList.filter(e => e.claimId === claim.id);
      const isContradicted = contradictionClaimIds.has(claim.id);
      const citation = citationClaimMap.get(claim.id);

      let assessmentStatus: 'supported' | 'partially_supported' | 'unsupported' | 'unverified' | 'contradicted' = 'unsupported';

      if (isContradicted) {
        assessmentStatus = 'contradicted';
      } else if (linkedEvidence.length === 0) {
        assessmentStatus = 'unsupported';
      } else {
        const hasVerifiedEvidence = linkedEvidence.some(ev => {
          const src = sourceMap.get(ev.sourceId);
          return src && (src.metadata.verificationStatus === 'verified' || src.metadata.verificationStatus === 'partially_verified');
        });

        if (hasVerifiedEvidence && citation) {
          assessmentStatus = 'supported';
        } else if (hasVerifiedEvidence) {
          assessmentStatus = 'partially_supported';
        } else {
          assessmentStatus = 'unverified';
        }
      }

      evidenceSnippets.push(`بانگەشەی "${claim.statement.substring(0, 50)}...": بارودۆخ = ${assessmentStatus}`);

      if (assessmentStatus === 'unsupported' || assessmentStatus === 'contradicted' || assessmentStatus === 'unverified') {
        const findingId = `finding_ce_${claim.id}`;
        const recId = `rec_ce_${claim.id}`;
        let severity: ReviewSeverity = 'moderate';
        let msg = '';
        let act = '';

        if (assessmentStatus === 'contradicted') {
          severity = 'critical';
          msg = `بانگەشەی "${claim.statement}" ڕووبەڕووی دژایەتی بەڵگەکان (Contradiction) بووەتەوە.`;
          act = 'ناوەڕۆکی بانگەشەکە بەپێی سەرچاوە ڕاستەقینەکان دەستکاری بکە یان ناکۆکییەکە شیکار بکە.';
        } else if (assessmentStatus === 'unsupported') {
          severity = 'major';
          msg = `بانگەشەی "${claim.statement}" هیچ بەڵگەیەکی (Evidence) پشتڕاستکەرەوەی نییە.`;
          act = 'بەڵگەیەکی دەرهێنراوی سەلمێنراو لە سەرچاوەی خاوەن پڵەی ئەکادیمی بۆ ئەم بانگەشەیە دابین بکە.';
        } else { // unverified
          severity = 'moderate';
          msg = `بانگەشەی "${claim.statement}" بەڵگەی هەیە بەڵام سەرچاوەکەی هێشتا پشتڕاست نەکراوەتەوە (Unverified).`;
          act = 'سەرچاوەی بەڵگەکە پشتڕاست بکەرەوە تاوەکو بانگەشەکە بێتە ڕیزبەند و بارودۆخی "supported".';
        }

        const trace: ReviewTraceability = {
          claimId: claim.id,
          evidenceId: linkedEvidence[0]?.id,
          sourceId: linkedEvidence[0]?.sourceId,
          citationId: citation?.citationId,
          hasBrokenChain: (assessmentStatus as string) !== 'supported',
          chainNotes: [`بارودۆخی زنجیرەی بەڵگە: ${assessmentStatus}`]
        };

        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'claim_evidence_alignment',
          severity,
          message: msg,
          location: {
            type: 'claim',
            claimId: claim.id,
            details: `بانگەشەی ${claim.id}`
          },
          relatedClaimId: claim.id,
          relatedEvidenceId: linkedEvidence[0]?.id,
          relatedSourceId: linkedEvidence[0]?.sourceId,
          recommendation: {
            id: recId,
            findingId,
            action: act,
            explanation: 'هەر بانگەشەیەکی ئەکادیمی پێویستی بە بەڵگەی سەلمێنراو و پلەی زانستییە.'
          },
          traceability: trace
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
      dimension: 'claim_evidence_alignment',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
