import { Injectable, inject } from '@angular/core';
import { Source, DuplicateMatchCandidate } from '../../models/research.model';
import { IdentifierVerificationService } from '../identifier-verification.service';

@Injectable({
  providedIn: 'root'
})
export class DuplicateDetectionService {
  private identifierService = inject(IdentifierVerificationService);

  findDuplicates(sources: Source[]): DuplicateMatchCandidate[] {
    const candidates: DuplicateMatchCandidate[] = [];

    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const sourceA = sources[i];
        const sourceB = sources[j];
        const match = this.compareSources(sourceA, sourceB);
        if (match.isDuplicate || match.confidence > 0.5) {
          candidates.push(match);
        }
      }
    }

    return candidates;
  }

  compareSources(sourceA: Source, sourceB: Source): DuplicateMatchCandidate {
    const matchingCriteria: string[] = [];
    let confidence = 0;

    const metaA = sourceA.metadata;
    const metaB = sourceB.metadata;

    // 1. DOI Match
    if (metaA.doi && metaB.doi) {
      const doiA = this.identifierService.validateAndNormalizeDoi(metaA.doi);
      const doiB = this.identifierService.validateAndNormalizeDoi(metaB.doi);

      if (doiA.isValidSyntax && doiB.isValidSyntax && doiA.normalizedValue === doiB.normalizedValue) {
        matchingCriteria.push(`وەکیەکی ڕەهای DOI: ${doiA.normalizedValue}`);
        confidence = 1.0;
        return {
          sourceA,
          sourceB,
          sourceAId: sourceA.id,
          sourceBId: sourceB.id,
          matchScore: confidence,
          confidence,
          isDuplicate: true,
          matchCriteria: matchingCriteria,
          matchingCriteria,
          explanation: `هەردوو سەرچاوەکە هەمان دیاریکەری دیجیتاڵ (DOI: ${doiA.normalizedValue})یان هەس.`
        };
      }
    }

    // 2. ISBN Match
    if (metaA.isbn && metaB.isbn) {
      const isbnA = this.identifierService.validateAndNormalizeIsbn(metaA.isbn);
      const isbnB = this.identifierService.validateAndNormalizeIsbn(metaB.isbn);

      if (isbnA.isValidSyntax && isbnB.isValidSyntax && isbnA.normalizedValue === isbnB.normalizedValue) {
        matchingCriteria.push(`وەکیەکی ڕەهای ISBN: ${isbnA.normalizedValue}`);
        confidence = 0.98;
        return {
          sourceA,
          sourceB,
          sourceAId: sourceA.id,
          sourceBId: sourceB.id,
          matchScore: confidence,
          confidence,
          isDuplicate: true,
          matchCriteria: matchingCriteria,
          matchingCriteria,
          explanation: `هەردوو سەرچاوەکە هەمان کودی کتێبی نێودەوڵەتی (ISBN: ${isbnA.normalizedValue})یان هەس.`
        };
      }
    }

    // 3. Provider Source ID Match (if provider is identical)
    if (
      sourceA.provenance.sourceProvider &&
      sourceB.provenance.sourceProvider &&
      sourceA.provenance.sourceProvider === sourceB.provenance.sourceProvider &&
      sourceA.provenance.providerSourceId &&
      sourceB.provenance.providerSourceId &&
      sourceA.provenance.providerSourceId === sourceB.provenance.providerSourceId
    ) {
      matchingCriteria.push(`وەکیەکی ناسێنەری دابینکەر (${sourceA.provenance.sourceProvider}: ${sourceA.provenance.providerSourceId})`);
      confidence = 0.95;
      return {
        sourceA,
        sourceB,
        sourceAId: sourceA.id,
        sourceBId: sourceB.id,
        matchScore: confidence,
        confidence,
        isDuplicate: true,
        matchCriteria: matchingCriteria,
        matchingCriteria,
        explanation: `لە هەمان دابینکەری سەرچاوە (${sourceA.provenance.sourceProvider}) بە هەمان ناسێنەر دۆزراونەتەوە.`
      };
    }

    // 4. URL Match
    if (metaA.url && metaB.url) {
      const urlA = this.identifierService.validateAndNormalizeUrl(metaA.url);
      const urlB = this.identifierService.validateAndNormalizeUrl(metaB.url);

      if (urlA.isValidSyntax && urlB.isValidSyntax && urlA.normalizedValue === urlB.normalizedValue) {
        matchingCriteria.push(`وەکیەکی ناو نیشانی بەستەر (URL)`);
        confidence = Math.max(confidence, 0.85);
      }
    }

    // 5. Title + Primary Author + Year Match
    const normTitleA = this.identifierService.normalizeTitle(metaA.title);
    const normTitleB = this.identifierService.normalizeTitle(metaB.title);

    if (normTitleA && normTitleB && normTitleA === normTitleB) {
      matchingCriteria.push('وەکیەکی تەواوی ناونیشان');
      confidence += 0.5;

      const authorA = metaA.authors && metaA.authors[0] ? metaA.authors[0].trim().toLowerCase() : '';
      const authorB = metaB.authors && metaB.authors[0] ? metaB.authors[0].trim().toLowerCase() : '';

      if (authorA && authorB && authorA === authorB) {
        matchingCriteria.push('وەکیەکی نووسەری یەکەم');
        confidence += 0.3;
      }

      if (metaA.publicationYear && metaB.publicationYear && metaA.publicationYear === metaB.publicationYear) {
        matchingCriteria.push(`وەکیەکی ساڵی بڵاوکردنەوە (${metaA.publicationYear})`);
        confidence += 0.15;
      }
    }

    const isDuplicate = confidence >= 0.85;

    return {
      sourceA,
      sourceB,
      sourceAId: sourceA.id,
      sourceBId: sourceB.id,
      matchScore: Number(Math.min(1.0, confidence).toFixed(2)),
      confidence: Number(Math.min(1.0, confidence).toFixed(2)),
      isDuplicate,
      matchCriteria: matchingCriteria,
      matchingCriteria,
      explanation: isDuplicate
        ? `سەرچاوەکان لەسەر بنەمای [${matchingCriteria.join('، ')}] وەک دووبارە دەستنیشان کران.`
        : `پەیوەندی دووبارەبوونەوە بە ڕێژەی ${(confidence * 100).toFixed(0)}% دیاری کرا.`
    };
  }
}
