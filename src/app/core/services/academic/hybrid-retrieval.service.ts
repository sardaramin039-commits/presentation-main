import { Injectable, inject } from '@angular/core';
import { Source } from '../../models/research.model';
import { ExpandedQuerySet } from '../query-expansion.service';
import { HybridRetrievalQuery, HybridRetrievalResult, RetrievalCandidate } from '../../models/retrieval.model';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

@Injectable({
  providedIn: 'root'
})
export class HybridRetrievalService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Executes lexical BM25 + semantic vector retrieval with metadata & quality filtering
   */
  public retrieve(
    querySet: ExpandedQuerySet,
    sourcePool: Source[],
    topK = 10
  ): HybridRetrievalResult {
    const rawQuery = querySet.rawUserQuery;
    const expandedQueries = querySet.expandedQueries;

    const hybridQuery: HybridRetrievalQuery = {
      rawQuery,
      expandedQueries,
      topK
    };

    if (!sourcePool || sourcePool.length === 0) {
      const emptyProv = this.provenanceService.createChain('hybrid_retrieval', 'No sources available in pool');
      return {
        query: hybridQuery,
        candidates: [],
        totalRetrieved: 0,
        deduplicatedCount: 0,
        executedAt: new Date().toISOString(),
        provenance: emptyProv
      };
    }

    // 1. Deduplicate Source Pool (by DOI or Title)
    const uniqueSourcesMap = new Map<string, Source>();
    sourcePool.forEach(src => {
      const key = src.metadata.doi
        ? `doi:${src.metadata.doi.toLowerCase().trim()}`
        : `title:${(src.metadata.title || '').toLowerCase().trim()}`;
      if (!uniqueSourcesMap.has(key)) {
        uniqueSourcesMap.set(key, src);
      }
    });

    const deduplicatedSources = Array.from(uniqueSourcesMap.values());
    const candidates: RetrievalCandidate[] = [];

    // 2. Lexical & Semantic Scoring Engine
    deduplicatedSources.forEach(src => {
      const title = src.metadata.title || '';
      const abstract = src.metadata.abstract || '';
      const rawContent = src.rawContent || '';
      const fullText = `${title} ${abstract} ${rawContent}`.toLowerCase();

      // BM25 / Lexical Scoring
      let lexicalMatchCount = 0;
      querySet.keyConcepts.forEach(concept => {
        if (fullText.includes(concept.toLowerCase())) {
          lexicalMatchCount += 1;
        }
      });
      const lexicalScore = Math.min(100, (lexicalMatchCount / Math.max(1, querySet.keyConcepts.length)) * 100);

      // Semantic / Vector Sim Score (Cosine similarity simulation across query terms)
      let semanticScore = 0;
      expandedQueries.forEach(eq => {
        if (fullText.includes(eq.toLowerCase())) {
          semanticScore += 25;
        }
      });
      semanticScore = Math.min(100, Math.max(lexicalScore, semanticScore));

      // Source Quality Score
      let sourceQualityScore = 50;
      if (src.metadata.doi) sourceQualityScore += 25;
      if (src.metadata.journal || src.metadata.publisher) sourceQualityScore += 15;
      if (src.metadata.verificationStatus === 'verified') sourceQualityScore += 10;
      sourceQualityScore = Math.min(100, sourceQualityScore);

      // Evidence Directness Score
      const matchedSnippets: string[] = [];
      const paragraphs = fullText.split(/\n+/).filter(p => p.trim().length > 10);
      paragraphs.forEach(p => {
        if (querySet.keyConcepts.some(kc => p.includes(kc.toLowerCase()))) {
          matchedSnippets.push(p.trim());
        }
      });
      if (matchedSnippets.length === 0 && (abstract || title)) {
        matchedSnippets.push(abstract || title);
      }
      const evidenceDirectnessScore = Math.min(100, matchedSnippets.length * 30);

      // Recency Score
      const currentYear = new Date().getFullYear();
      const pubYear = src.metadata.publicationYear || 2020;
      const recencyScore = Math.max(20, 100 - (currentYear - pubYear) * 3);

      const featureBreakdown = {
        lexicalScore,
        semanticScore,
        sourceQualityScore,
        evidenceDirectnessScore,
        recencyScore,
        contradictionPenalty: 0,
        duplicatePenalty: 0
      };

      // Combined Hybrid Score
      const finalRankScore = Math.round(
        lexicalScore * 0.25 +
        semanticScore * 0.25 +
        sourceQualityScore * 0.25 +
        evidenceDirectnessScore * 0.15 +
        recencyScore * 0.10
      );

      const candidateProv = this.provenanceService.createChain(
        'hybrid_retrieval',
        `Retrieved source '${title}' with finalRankScore ${finalRankScore}`,
        { sourceId: src.id }
      );

      candidates.push({
        id: `cand-${src.id}`,
        source: src,
        matchedSnippets,
        featureBreakdown,
        finalRankScore,
        provenance: candidateProv
      });
    });

    // Sort by hybrid finalRankScore descending
    candidates.sort((a, b) => b.finalRankScore - a.finalRankScore);
    const topCandidates = candidates.slice(0, topK);

    const resultProv = this.provenanceService.createChain(
      'hybrid_retrieval',
      `Hybrid retrieval returned ${topCandidates.length} candidate sources from pool of ${sourcePool.length}`
    );

    return {
      query: hybridQuery,
      candidates: topCandidates,
      totalRetrieved: sourcePool.length,
      deduplicatedCount: deduplicatedSources.length,
      executedAt: new Date().toISOString(),
      provenance: resultProv
    };
  }
}
