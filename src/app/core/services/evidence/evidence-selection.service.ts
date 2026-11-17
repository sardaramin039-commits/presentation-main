import { Injectable, inject } from '@angular/core';
import { RetrievalCandidate } from '../../models/retrieval.model';
import { SelectedEvidenceItem, AcademicEvidenceType } from '../../models/evidence.model';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

@Injectable({
  providedIn: 'root'
})
export class EvidenceSelectionService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Extracts evidence items from reranked retrieval candidates
   */
  public selectEvidence(candidates: RetrievalCandidate[]): SelectedEvidenceItem[] {
    const selectedEvidence: SelectedEvidenceItem[] = [];

    if (!candidates || candidates.length === 0) {
      return selectedEvidence;
    }

    candidates.forEach(cand => {
      const src = cand.source;
      const snippets = cand.matchedSnippets;

      snippets.forEach((snippetText, idx) => {
        if (!snippetText || snippetText.trim().length === 0) return;

        // Determine evidence type based on snippet text structure
        let evidenceType: AcademicEvidenceType = 'direct';
        if (/\b(\d+%|\d+\s*ملیۆن|\d+\s*سەدا|ئامار)\b/i.test(snippetText)) {
          evidenceType = 'quantitative';
        } else if (/\b(پێناسە|واتا|دەستواژە|بریتییە لە)\b/i.test(snippetText)) {
          evidenceType = 'definition';
        } else if (/\b(میتۆد|ڕێگە|تاقیکردنەوە|سامپڵ|بەشداربوو)\b/i.test(snippetText)) {
          evidenceType = 'methodological';
        } else if (/\b(پێچەوانە|ناکۆک|جیاواز|بە پێچەوانەی)\b/i.test(snippetText)) {
          evidenceType = 'contradictory';
        } else if (idx > 1) {
          evidenceType = 'contextual';
        }

        const qualityScore = Math.min(100, Math.max(30, cand.featureBreakdown.sourceQualityScore));
        const confidenceScore = Math.min(100, Math.max(30, cand.finalRankScore));

        const prov = this.provenanceService.createChain(
          'evidence_extraction',
          `Extracted evidence snippet from source '${src.metadata.title}'`,
          { sourceId: src.id },
          'KurdishAI-Studio-Evidence-Engine',
          cand.provenance.id
        );

        selectedEvidence.push({
          id: `ev-${src.id}-${idx}`,
          sourceId: src.id,
          sourceTitle: src.metadata.title,
          sourceDoi: src.metadata.doi,
          evidenceType,
          extractedSnippet: snippetText.trim(), // Exact text from source
          quotedText: snippetText.length > 150 ? `«${snippetText.substring(0, 150)}...»` : `«${snippetText}»`,
          locator: {
            page: src.metadata.pages ? src.metadata.pages.split('-')[0] : 'لاپەڕەی گشتی',
            section: 'پشکنینی سەرچاوە'
          },
          qualityScore,
          confidenceScore,
          verificationStatus: src.metadata.verificationStatus === 'verified' ? 'verified' : 'partially_verified',
          provenance: prov
        });
      });
    });

    return selectedEvidence;
  }
}
