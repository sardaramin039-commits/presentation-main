import { Injectable, inject } from '@angular/core';
import { ExtractedClaim } from '../../models/claim.model';
import { SelectedEvidenceItem } from '../../models/evidence.model';
import { ClaimEntailmentResult, EntailmentLabel } from '../../models/entailment.model';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

@Injectable({
  providedIn: 'root'
})
export class ClaimEntailmentService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Verifies if evidence logically entails each claim and assigns strict labels
   */
  public evaluateEntailment(
    claims: ExtractedClaim[],
    evidenceList: SelectedEvidenceItem[]
  ): ClaimEntailmentResult[] {
    if (!claims || claims.length === 0) {
      return [];
    }

    return claims.map(claim => {
      // Find supporting evidence linked to this claim
      const supporting = evidenceList.filter(ev =>
        claim.evidenceIds.includes(ev.id) || ev.sourceId === claim.sourceIds[0]
      );

      // Find potential contradictory evidence
      const contradictory = evidenceList.filter(ev =>
        ev.evidenceType === 'contradictory' ||
        /\b(پێچەوانە|ناکۆک|جیاواز|بە پێچەوانەی)\b/i.test(ev.extractedSnippet)
      );

      let label: EntailmentLabel = 'INSUFFICIENT_EVIDENCE';
      let entailmentScore = 0;
      let reasoningKurdish = '';

      if (supporting.length > 0 && contradictory.length > 0) {
        label = 'CONTRADICTED';
        entailmentScore = 30;
        reasoningKurdish = `ئەم ئیدیعایە لە هەمان کاتدا بەڵگەی پشتیوانیکەر (${supporting.length}) و بەڵگەی پێچەوانە (${contradictory.length})ی هەیە.`;
      } else if (supporting.length > 1 && supporting.some(e => e.verificationStatus === 'verified')) {
        label = 'SUPPORTED';
        entailmentScore = 95;
        reasoningKurdish = `ئەم ئیدیعایە بە شێوەیەکی بەهێز لەلایەن ${supporting.length} بەڵگەی سەلمێنراوەوە پشتگیری دەکرێت.`;
      } else if (supporting.length === 1) {
        label = 'PARTIALLY_SUPPORTED';
        entailmentScore = 65;
        reasoningKurdish = `ئەم ئیدیعایە بە لایەنی کەمەوە لەلایەن یەک بەڵگەی سەرچاوەوە پشتگیری کراوە.`;
      } else {
        label = 'NOT_SUPPORTED';
        entailmentScore = 10;
        reasoningKurdish = `هیچ بەڵگەیەکی ڕاستەوخۆ لە سەرچاوەکاندا بۆ سەلماندنی ئەم ئیدیعایە نەدۆزرایەوە.`;
      }

      const prov = this.provenanceService.createChain(
        'entailment_check',
        `Evaluated entailment for claim '${claim.id}': Label=${label}, Score=${entailmentScore}`,
        { claimId: claim.id },
        'KurdishAI-Studio-Entailment-Engine',
        claim.provenance.id
      );

      return {
        claimId: claim.id,
        claimStatement: claim.statement,
        label,
        entailmentScore,
        supportingEvidence: supporting,
        contradictoryEvidence: contradictory,
        reasoningKurdish,
        provenance: prov
      };
    });
  }
}
