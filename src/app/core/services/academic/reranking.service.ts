import { Injectable, inject } from '@angular/core';
import { RetrievalCandidate } from '../../models/retrieval.model';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

@Injectable({
  providedIn: 'root'
})
export class RerankingService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Reranks retrieval candidates across multi-dimensional quality and relevance scores
   */
  public rerank(candidates: RetrievalCandidate[]): RetrievalCandidate[] {
    if (!candidates || candidates.length === 0) {
      return [];
    }

    const reranked = candidates.map(cand => {
      const fb = cand.featureBreakdown;

      // 1. Relevance Dimension
      const relevanceScore = (fb.semanticScore * 0.6) + (fb.evidenceDirectnessScore * 0.4);

      // 2. Source Quality Dimension (Distinct from relevance)
      const qualityScore = (fb.sourceQualityScore * 0.7) + (fb.recencyScore * 0.3);

      // 3. Penalties
      const totalPenalties = fb.contradictionPenalty + fb.duplicatePenalty;

      // 4. Combined Reranked Score
      const rerankedScore = Math.max(0, Math.min(100, Math.round(
        (relevanceScore * 0.5) + (qualityScore * 0.5) - totalPenalties
      )));

      const updatedProv = this.provenanceService.recordMutation(
        cand.provenance,
        'reranking',
        `Reranked candidate '${cand.source.metadata.title}' from ${cand.finalRankScore} to ${rerankedScore} (Relevance: ${Math.round(relevanceScore)}, Quality: ${Math.round(qualityScore)}).`
      );

      return {
        ...cand,
        finalRankScore: rerankedScore,
        provenance: updatedProv
      };
    });

    // Sort deterministically by finalRankScore descending, breaking ties with source ID
    reranked.sort((a, b) => {
      if (b.finalRankScore !== a.finalRankScore) {
        return b.finalRankScore - a.finalRankScore;
      }
      return a.source.id.localeCompare(b.source.id);
    });

    return reranked;
  }
}
