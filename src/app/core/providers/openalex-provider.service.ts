import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { Source, SourceMetadata } from '../models/research.model';
import { ResearchSourceProvider, SearchOptions } from '../services/source-discovery.service';
import { MetadataNormalizationService } from '../services/metadata-normalization.service';
import { OpenAlexResponse, OpenAlexWorkItem } from './openalex.dto';

@Injectable({
  providedIn: 'root'
})
export class OpenAlexProviderService implements ResearchSourceProvider {
  readonly providerName = 'OpenAlex';
  private http = inject(HttpClient);
  private normalization = inject(MetadataNormalizationService);

  private readonly BASE_URL = 'https://api.openalex.org/works';
  private readonly REQUEST_TIMEOUT_MS = 10000;

  async search(query: string, options?: SearchOptions): Promise<Source[]> {
    if (!query || !query.trim()) {
      return [];
    }

    const limit = options?.limit || 10;
    const cleanQuery = query.trim();

    const headers = new HttpHeaders({
      'User-Agent': 'AcademicResearchEngine/1.0 (mailto:researcher@academic-studio.org)'
    });

    const params: Record<string, string> = {
      search: cleanQuery,
      'per-page': limit.toString()
    };

    if (options?.yearStart || options?.yearEnd) {
      const from = options?.yearStart || 1900;
      const until = options?.yearEnd || new Date().getFullYear();
      params['filter'] = `publication_year:${from}-${until}`;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<OpenAlexResponse>(this.BASE_URL, { headers, params }).pipe(
          timeout(this.REQUEST_TIMEOUT_MS)
        )
      );

      if (response && Array.isArray(response.results)) {
        return response.results.map(item => this.mapOpenAlexItemToSource(item));
      }

      return [];
    } catch (err) {
      console.warn(`[OpenAlexProvider] Search failed for query "${query}":`, err);
      return [];
    }
  }

  async getSource(openAlexIdOrDoi: string): Promise<Source | null> {
    if (!openAlexIdOrDoi || !openAlexIdOrDoi.trim()) return null;

    const headers = new HttpHeaders({
      'User-Agent': 'AcademicResearchEngine/1.0 (mailto:researcher@academic-studio.org)'
    });

    let targetUrl = '';
    const cleanInput = openAlexIdOrDoi.trim();

    if (cleanInput.startsWith('https://openalex.org/')) {
      targetUrl = cleanInput;
    } else if (cleanInput.startsWith('W') && /^\w+$/.test(cleanInput)) {
      targetUrl = `${this.BASE_URL}/${cleanInput}`;
    } else {
      const doi = this.normalization.normalizeDoi(cleanInput);
      if (doi) {
        targetUrl = `${this.BASE_URL}/https://doi.org/${doi}`;
      } else {
        return null;
      }
    }

    try {
      const response = await firstValueFrom(
        this.http.get<OpenAlexWorkItem>(targetUrl, { headers }).pipe(
          timeout(this.REQUEST_TIMEOUT_MS)
        )
      );

      if (response && response.id) {
        return this.mapOpenAlexItemToSource(response);
      }
      return null;
    } catch (err) {
      console.warn(`[OpenAlexProvider] getSource failed for ID "${openAlexIdOrDoi}":`, err);
      return null;
    }
  }

  async getMetadata(id: string): Promise<SourceMetadata | null> {
    const source = await this.getSource(id);
    return source ? source.metadata : null;
  }

  private mapOpenAlexItemToSource(item: OpenAlexWorkItem): Source {
    const title = item.title || 'Untitled Work';
    const authors = item.authorships
      ? item.authorships.map(a => a.author?.display_name || a.raw_author_name || '').filter(Boolean)
      : [];

    const journal = item.primary_location?.source?.display_name;
    const publisher = item.primary_location?.source?.publisher;
    const pages = item.biblio
      ? (item.biblio.first_page && item.biblio.last_page ? `${item.biblio.first_page}-${item.biblio.last_page}` : item.biblio.first_page)
      : undefined;

    const doi = item.doi ? item.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : undefined;
    const url = item.primary_location?.landing_page_url || item.primary_location?.pdf_url || item.id;
    const abstractText = this.decodeAbstractInvertedIndex(item.abstract_inverted_index);

    const rawMetadata: Partial<SourceMetadata> = {
      title,
      authors,
      publicationYear: item.publication_year,
      publisher,
      journal,
      volume: item.biblio?.volume,
      issue: item.biblio?.issue,
      pages,
      doi,
      url,
      abstract: abstractText,
      sourceType: this.normalization.normalizeSourceType(item.type),
      databaseProvider: 'OpenAlex',
      verificationStatus: 'unverified'
    };

    const normalizedMeta = this.normalization.normalizeMetadata(rawMetadata);

    const shortOpenAlexId = item.id.replace('https://openalex.org/', '');
    const sourceId = `openalex_${shortOpenAlexId}`;

    return {
      id: sourceId,
      metadata: normalizedMeta,
      addedAt: new Date().toISOString(),
      provenance: {
        sourceProvider: 'OpenAlex',
        providerSourceId: item.id,
        retrievalTimestamp: new Date().toISOString(),
        originalUrl: url,
        retrievedMetadataSnapshot: item as unknown as Record<string, unknown>,
        transformationHistory: [
          {
            timestamp: new Date().toISOString(),
            action: 'DISCOVERED_AND_NORMALIZED',
            actor: 'OpenAlexProviderService',
            details: `Mapped OpenAlex Work ID: ${item.id}`
          }
        ]
      }
    };
  }

  decodeAbstractInvertedIndex(invertedIndex: Record<string, number[]> | undefined | null): string | undefined {
    if (!invertedIndex || typeof invertedIndex !== 'object') return undefined;

    const wordPositions: { word: string; pos: number }[] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
      if (Array.isArray(positions)) {
        for (const pos of positions) {
          wordPositions.push({ word, pos });
        }
      }
    }

    if (wordPositions.length === 0) return undefined;

    wordPositions.sort((a, b) => a.pos - b.pos);
    return wordPositions.map(wp => wp.word).join(' ');
  }
}
