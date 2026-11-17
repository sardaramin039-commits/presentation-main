import { Injectable } from '@angular/core';
import { Claim, Evidence, Source, Citation } from '../../models/research.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus,
  ReviewTraceability
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class ProvenanceIntegrityReviewService {
  /**
   * Validates unbroken provenance chains (Claim -> Evidence -> Source -> Provider -> Verification -> Citation).
   * Identifies any broken links or missing provenance snapshots.
   */
  reviewProvenanceIntegrity(
    claims: Claim[] = [],
    evidenceList: Evidence[] = [],
    sources: Source[] = [],
    citations: Citation[] = []
  ): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [];

    const sourceMap = new Map<string, Source>();
    sources.forEach(s => sourceMap.set(s.id, s));

    const citationMap = new Map<string, Citation>();
    citations.forEach(c => {
      if (c.claimId) citationMap.set(c.claimId, c);
    });

    claims.forEach(claim => {
      const linkedEvidenceList = evidenceList.filter(e => e.claimId === claim.id);
      const citation = citationMap.get(claim.id);

      const chainNotes: string[] = [];
      let hasBrokenChain = false;

      if (linkedEvidenceList.length === 0) {
        hasBrokenChain = true;
        chainNotes.push('کەموکورتی زنجیرە: هیچ بەڵگەیەک (Evidence) بەم بانگەشەیەوە نەبەستراوەتەوە.');
      }

      linkedEvidenceList.forEach(ev => {
        const src = sourceMap.get(ev.sourceId);
        if (!src) {
          hasBrokenChain = true;
          chainNotes.push(`کەموکورتی زنجیرە: بەڵگەی ${ev.id} دەستنیشانی سەرچاوەیەکی بێ شوناس (${ev.sourceId}) دەکات.`);
        } else {
          if (!src.provenance || !src.provenance.sourceProvider) {
            hasBrokenChain = true;
            chainNotes.push(`کەموکورتی زنجیرە: سەرچاوەی ${src.id} زانیاری بۆدابینکەر (Source Provider) نییە.`);
          }
          if (!src.verificationResult) {
            hasBrokenChain = true;
            chainNotes.push(`کەموکورتی زنجیرە: سەرچاوەی ${src.id} ئەنجامی پشتڕاستکردنەوەی فەرمی (Verification Result) نییە.`);
          }
        }
      });

      if (!citation) {
        hasBrokenChain = true;
        chainNotes.push('کەموکورتی زنجیرە: ئاماژەی ناو دەق (Citation) بۆ ئەم بانگەشەیە بونیاد نەنراوە.');
      }

      evidenceSnippets.push(`بانگەشەی ${claim.id}: زنجیرە = ${hasBrokenChain ? 'پچڕاو' : 'تەواو'}`);

      if (hasBrokenChain) {
        const findingId = `finding_prov_broken_${claim.id}`;
        const recId = `rec_prov_broken_${claim.id}`;

        const trace: ReviewTraceability = {
          claimId: claim.id,
          evidenceId: linkedEvidenceList[0]?.id,
          sourceId: linkedEvidenceList[0]?.sourceId,
          citationId: citation?.citationId,
          providerName: sourceMap.get(linkedEvidenceList[0]?.sourceId || '')?.provenance?.sourceProvider,
          verificationStatus: sourceMap.get(linkedEvidenceList[0]?.sourceId || '')?.metadata?.verificationStatus,
          hasBrokenChain: true,
          chainNotes
        };

        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'provenance_integrity',
          severity: 'major',
          message: `پچڕانی زنجیرەی ڕەسەنایەتی (Broken Provenance Chain) بۆ بانگەشەی "${claim.statement}": ${chainNotes.join(' | ')}`,
          location: {
            type: 'claim',
            claimId: claim.id,
            details: `بانگەشەی ${claim.id}`
          },
          relatedClaimId: claim.id,
          relatedEvidenceId: linkedEvidenceList[0]?.id,
          relatedSourceId: linkedEvidenceList[0]?.sourceId,
          recommendation: {
            id: recId,
            findingId,
            action: 'زنجیرەی بەڵگەنامەیی (Claim → Evidence → Source → Provider → Citation) ڕێکبکەرەوە.',
            explanation: 'تەواکاری زنجیرەی سەرچاوە ڕێگە بە وردبینی و پشکنین (Traceability & Auditability) دەدات.'
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
      dimension: 'provenance_integrity',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
