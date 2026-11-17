import { Injectable } from '@angular/core';
import { Source, RankingScore } from '../../models/research.model';

@Injectable({
  providedIn: 'root'
})
export class SourceRankingService {

  rankSources(sources: Source[], queryKeywords: string[], targetAcademicLevel = 'bachelor'): RankingScore[] {
    return sources.map(source => this.evaluateSource(source, queryKeywords, targetAcademicLevel))
                  .sort((a, b) => b.overallScore - a.overallScore);
  }

  evaluateSource(source: Source, queryKeywords: string[], targetAcademicLevel = 'bachelor'): RankingScore {
    const meta = source.metadata;
    const explanations: string[] = [];

    // 1. Relevance Score (0 - 1)
    const relevanceScore = this.calculateRelevance(meta.title, meta.abstract, queryKeywords);
    explanations.push(`گۆنجاوی بابەت (Relevance): ${(relevanceScore * 100).toFixed(0)}%`);

    // 2. Publication Recency Score (0 - 1)
    const currentYear = new Date().getFullYear();
    let recencyScore = 0.5; // Default if year missing
    if (meta.publicationYear && meta.publicationYear > 1800 && meta.publicationYear <= currentYear) {
      const age = currentYear - meta.publicationYear;
      if (age <= 3) recencyScore = 1.0;
      else if (age <= 7) recencyScore = 0.85;
      else if (age <= 15) recencyScore = 0.7;
      else if (age <= 30) recencyScore = 0.5;
      else recencyScore = 0.3;
      explanations.push(`ساڵی بڵاوکردنەوە (${meta.publicationYear}): پلەی نۆێیی ${(recencyScore * 100).toFixed(0)}%`);
    } else {
      explanations.push('ساڵی بڵاوکردنەوە دیاریکراو نییە (نمرەی دیفۆڵت 50%)');
    }

    // 3. Author Information Completeness (0 - 1)
    let authorCompletenessScore = 0;
    if (meta.authors && meta.authors.length > 0) {
      const validAuthors = meta.authors.filter(a => a && a.trim().length > 0 && a.toLowerCase() !== 'unknown');
      if (validAuthors.length > 0) {
        authorCompletenessScore = Math.min(1.0, 0.6 + (validAuthors.length * 0.1));
        explanations.push(`زانیاری نووسەران: ${validAuthors.length} نووسەری دیاریکراو`);
      } else {
        explanations.push('نووسەر لە سەرچاوەکەدا نادیارە');
      }
    } else {
      explanations.push('زانیاری نووسەر بێ بەشە');
    }

    // 4. Publisher / Journal Quality Score (0 - 1) & Source Type Suitability for Academic Level
    let publisherQualityScore = 0.3;
    if (meta.journal || meta.publisher) {
      publisherQualityScore = 0.8;
      if (meta.journal) {
        publisherQualityScore = 0.95;
        explanations.push(`گۆڤاری زانستی: ${meta.journal}`);
      } else if (meta.publisher) {
        explanations.push(`دەزگای بڵاوکردنەوە: ${meta.publisher}`);
      }
    } else {
      explanations.push('ناوی ناشر یان گۆڤار تۆمار نەکراوە');
    }

    if (targetAcademicLevel === 'postgrad' && (meta.sourceType === 'journal_article' || meta.sourceType === 'conference_paper')) {
      publisherQualityScore = Math.min(1.0, publisherQualityScore + 0.05);
      explanations.push(`گۆنجاوی بەرز بۆ ئاستی ئەکادیمی ماستەر/دکتۆرا (${meta.sourceType})`);
    }

    // 5. Metadata Completeness Ratio (0 - 1)
    const fields = [meta.title, meta.authors, meta.publicationYear, meta.publisher || meta.journal, meta.abstract, meta.language, meta.url || meta.doi];
    const filledFields = fields.filter(f => f !== undefined && f !== null && (Array.isArray(f) ? f.length > 0 : String(f).trim() !== '')).length;
    const metadataCompletenessScore = filledFields / fields.length;
    explanations.push(`تەواوکاری مێتا-داتا: ${(metadataCompletenessScore * 100).toFixed(0)}% (${filledFields}/${fields.length} خانە)`);

    // 6. DOI Bonus (0 or 0.1)
    const hasDoiBonus = meta.doi && meta.doi.trim().length > 0 ? 0.1 : 0;
    if (hasDoiBonus > 0) {
      explanations.push(`دیاریکەری دیجیتاڵی DOI بەردەستە (+10%)`);
    }

    // 7. Verification Status Bonus / Penalty
    let verificationBonus = 0;
    switch (meta.verificationStatus) {
      case 'verified':
        verificationBonus = 0.15;
        explanations.push('پشتڕاستکراوەی بێگەرد (Verified Source)');
        break;
      case 'partially_verified':
        verificationBonus = 0.05;
        explanations.push('پشتڕاستکراوەی بەشەکی (Partially Verified)');
        break;
      case 'unverified':
        verificationBonus = 0;
        explanations.push('نەپشتڕاستکراوە (Unverified)');
        break;
      case 'rejected':
        verificationBonus = -0.5;
        explanations.push('ڕەتکراوە (Rejected Source)');
        break;
    }

    // Weighted Overall Score Calculation
    // Relevance: 35%, Recency: 15%, Authors: 15%, Publisher: 15%, Metadata: 20% + Bonuses
    const baseWeighted = (relevanceScore * 0.35) +
                         (recencyScore * 0.15) +
                         (authorCompletenessScore * 0.15) +
                         (publisherQualityScore * 0.15) +
                         (metadataCompletenessScore * 0.20);

    let overallScore = Math.max(0, Math.min(1.0, baseWeighted + hasDoiBonus + verificationBonus));

    // Penalty for rejected status
    if (meta.verificationStatus === 'rejected') {
      overallScore = 0;
    }

    return {
      sourceId: source.id,
      overallScore: Number(overallScore.toFixed(3)),
      relevanceScore: Number(relevanceScore.toFixed(2)),
      recencyScore: Number(recencyScore.toFixed(2)),
      authorCompletenessScore: Number(authorCompletenessScore.toFixed(2)),
      publisherQualityScore: Number(publisherQualityScore.toFixed(2)),
      metadataCompletenessScore: Number(metadataCompletenessScore.toFixed(2)),
      hasDoiBonus,
      verificationBonus,
      explanation: explanations
    };
  }

  private calculateRelevance(title: string, abstract: string | undefined, keywords: string[]): number {
    if (!keywords || keywords.length === 0) return 0.5;

    const textToSearch = `${title} ${abstract || ''}`.toLowerCase();
    let matches = 0;

    for (const kw of keywords) {
      const cleanKw = kw.trim().toLowerCase();
      if (cleanKw.length > 2 && textToSearch.includes(cleanKw)) {
        matches++;
      }
    }

    const matchRatio = matches / keywords.length;
    return Math.min(1.0, 0.3 + (matchRatio * 0.7));
  }
}
