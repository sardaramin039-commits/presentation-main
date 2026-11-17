import { Injectable, inject } from '@angular/core';
import { SelectedEvidenceItem } from '../../models/evidence.model';
import { ExtractedClaim, ClaimCategory } from '../../models/claim.model';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

@Injectable({
  providedIn: 'root'
})
export class ClaimExtractionService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Extracts atomic claims from evidence items before generating final answer
   */
  public extractClaims(evidenceItems: SelectedEvidenceItem[]): ExtractedClaim[] {
    const claims: ExtractedClaim[] = [];

    if (!evidenceItems || evidenceItems.length === 0) {
      return claims;
    }

    evidenceItems.forEach((ev, idx) => {
      const text = ev.extractedSnippet;

      // 1. Determine Claim Category
      let category: ClaimCategory = 'factual';
      let isFactual = true;

      if (/\b(\d+%|\d+\s*ملیۆن|\d+\s*سەدا|ئامار)\b/i.test(text)) {
        category = 'quantitative';
        isFactual = true;
      } else if (/\b(پێناسە|واتا|دەستواژە|بریتییە لە)\b/i.test(text)) {
        category = 'definitional';
        isFactual = true;
      } else if (/\b(کاریگەری|هۆکار|دەبێتە هۆی)\b/i.test(text)) {
        category = 'causal';
        isFactual = true;
      } else if (/\b(بەراورد|جیاوازی|نێوان)\b/i.test(text)) {
        category = 'comparative';
        isFactual = true;
      } else if (/\b(میتۆد|ڕێگە|تاقیکردنەوە)\b/i.test(text)) {
        category = 'methodological';
        isFactual = true;
      } else if (/\b(پێشنیار|پێویستە|باشتر وایە|ڕای وایە)\b/i.test(text)) {
        category = 'opinion';
        isFactual = false; // Opinion/Recommendation is NOT a factual claim
      } else if (/\b(شیکردنەوە|لێکدانەوە|پێشبینی)\b/i.test(text)) {
        category = 'interpretive';
        isFactual = false; // Interpretive claim is NOT a purely factual claim
      }

      const claimId = `claim-${ev.sourceId}-${idx}`;
      const statement = text;
      const normalizedStatement = text.toLowerCase().trim().replace(/[.,!؟]/g, '');

      const prov = this.provenanceService.createChain(
        'claim_extraction',
        `Extracted ${category} claim (${isFactual ? 'Factual' : 'Non-Factual'}) from evidence ${ev.id}`,
        { sourceId: ev.sourceId, evidenceId: ev.id, claimId },
        'KurdishAI-Studio-Claim-Extractor',
        ev.provenance.id
      );

      claims.push({
        id: claimId,
        statement,
        normalizedStatement,
        category,
        isFactual,
        sourceIds: [ev.sourceId],
        evidenceIds: [ev.id],
        status: ev.verificationStatus === 'verified' ? 'supported' : 'partially_supported',
        provenance: prov
      });
    });

    return claims;
  }
}
