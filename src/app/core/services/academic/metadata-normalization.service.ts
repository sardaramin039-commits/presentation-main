import { Injectable, inject } from '@angular/core';
import { SourceMetadata, SourceType } from '../../models/research.model';
import { IdentifierVerificationService } from '../identifier-verification.service';

@Injectable({
  providedIn: 'root'
})
export class MetadataNormalizationService {
  private identifierService = inject(IdentifierVerificationService);

  normalizeTitle(title: string | undefined): string {
    if (!title) return '';
    // Strip HTML tags if present (e.g., <i>, <b> in titles from Crossref/OpenAlex)
    const cleanTags = title.replace(/<[^>]*>/g, '');
    // Normalize spaces
    return cleanTags.replace(/\s+/g, ' ').trim();
  }

  normalizeAuthorName(name: string | undefined): string {
    if (!name) return '';
    const clean = name.replace(/\s+/g, ' ').trim();
    if (!clean) return '';

    // Handle "LastName, FirstName" -> "FirstName LastName" or clean standard
    if (clean.includes(',')) {
      const parts = clean.split(',').map(p => p.trim());
      if (parts.length === 2 && parts[0] && parts[1]) {
        return `${parts[1]} ${parts[0]}`;
      }
    }
    return clean;
  }

  normalizeAuthors(authors: (string | { given?: string; family?: string; name?: string })[] | undefined): string[] {
    if (!authors || !Array.isArray(authors)) return [];

    const normalized: string[] = [];
    const seen = new Set<string>();

    for (const author of authors) {
      let authorName = '';
      if (typeof author === 'string') {
        authorName = this.normalizeAuthorName(author);
      } else if (typeof author === 'object' && author !== null) {
        if (author.name) {
          authorName = this.normalizeAuthorName(author.name);
        } else {
          const given = author.given ? author.given.trim() : '';
          const family = author.family ? author.family.trim() : '';
          authorName = `${given} ${family}`.trim();
        }
      }

      if (authorName && authorName.length > 1 && !seen.has(authorName.toLowerCase())) {
        seen.add(authorName.toLowerCase());
        normalized.push(authorName);
      }
    }

    return normalized;
  }

  normalizeDoi(doi: string | undefined): string | undefined {
    if (!doi) return undefined;
    const res = this.identifierService.validateAndNormalizeDoi(doi);
    return res.isValidSyntax ? res.normalizedValue : undefined;
  }

  normalizeIsbn(isbn: string | undefined): string | undefined {
    if (!isbn) return undefined;
    const res = this.identifierService.validateAndNormalizeIsbn(isbn);
    return res.isValidSyntax ? res.normalizedValue : undefined;
  }

  normalizeUrl(url: string | undefined): string | undefined {
    if (!url) return undefined;
    const res = this.identifierService.validateAndNormalizeUrl(url);
    return res.isValidSyntax ? res.normalizedValue : undefined;
  }

  normalizeYear(yearInput: number | string | undefined): number | undefined {
    if (!yearInput) return undefined;
    const year = typeof yearInput === 'string' ? parseInt(yearInput, 10) : yearInput;
    if (isNaN(year)) return undefined;
    const currentYear = new Date().getFullYear();
    if (year >= 1500 && year <= currentYear + 1) {
      return year;
    }
    return undefined;
  }

  normalizeJournal(journal: string | undefined): string | undefined {
    if (!journal) return undefined;
    const clean = journal.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    return clean.length > 0 ? clean : undefined;
  }

  normalizeSourceType(typeInput: string | undefined): SourceType {
    if (!typeInput) return 'journal_article';
    const lower = typeInput.toLowerCase();
    if (lower.includes('journal') || lower.includes('article') || lower === 'work') return 'journal_article';
    if (lower.includes('book-chapter') || lower.includes('chapter')) return 'book_chapter';
    if (lower.includes('book')) return 'book';
    if (lower.includes('proceedings') || lower.includes('conference')) return 'conference_paper';
    if (lower.includes('dissertation') || lower.includes('thesis')) return 'thesis';
    if (lower.includes('report')) return 'report';
    if (lower.includes('web') || lower.includes('site')) return 'webpage';
    return 'other';
  }

  normalizeMetadata(raw: Partial<SourceMetadata>): SourceMetadata {
    const title = this.normalizeTitle(raw.title) || 'Untitled Source';
    const authors = this.normalizeAuthors(raw.authors);
    const publicationYear = this.normalizeYear(raw.publicationYear);
    const publisher = raw.publisher ? raw.publisher.trim() : undefined;
    const journal = this.normalizeJournal(raw.journal);
    const volume = raw.volume ? raw.volume.trim() : undefined;
    const issue = raw.issue ? raw.issue.trim() : undefined;
    const pages = raw.pages ? raw.pages.trim() : undefined;
    const doi = this.normalizeDoi(raw.doi);
    const isbn = this.normalizeIsbn(raw.isbn);
    const url = this.normalizeUrl(raw.url) || (doi ? `https://doi.org/${doi}` : undefined);
    const abstractText = raw.abstract ? raw.abstract.replace(/<[^>]*>/g, '').trim() : undefined;
    const sourceType = this.normalizeSourceType(raw.sourceType);

    return {
      title,
      authors,
      publicationYear,
      publisher,
      journal,
      volume,
      issue,
      pages,
      doi,
      isbn,
      url,
      language: raw.language || 'en',
      abstract: abstractText,
      sourceType,
      databaseProvider: raw.databaseProvider,
      verificationStatus: raw.verificationStatus || 'unverified'
    };
  }
}
