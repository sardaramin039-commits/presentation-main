import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { Source, SourceMetadata } from '../models/research.model';
import { ResearchSourceProvider, SearchOptions } from '../services/source-discovery.service';
import { MetadataNormalizationService } from '../services/metadata-normalization.service';
import { CrossrefResponse, CrossrefWorkItem, CrossrefWorkSingleResponse } from './crossref.dto';

@Injectable({
  providedIn: 'root'
})
export class CrossrefProviderService implements ResearchSourceProvider {
  readonly providerName = 'Crossref';
  private http = inject(HttpClient);
  private normalization = inject(MetadataNormalizationService);

  private readonly BASE_URL = 'https://api.crossref.org/works';
  private readonly REQUEST_TIMEOUT_MS = 10000; // 10 seconds timeout

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
      query: cleanQuery,
      rows: limit.toString(),
      select: 'DOI,title,author,issued,published-print,published-online,container-title,publisher,volume,issue,page,URL,type,abstract'
    };

    if (options?.yearStart || options?.yearEnd) {
      const from = options?.yearStart || 1900;
      const until = options?.yearEnd || new Date().getFullYear();
      params['filter'] = `from-pub-date:${from},until-pub-date:${until}`;
    }

    try {
      const response = await firstValueFrom(
        this.http.get<CrossrefResponse>(this.BASE_URL, { headers, params }).pipe(
          timeout(this.REQUEST_TIMEOUT_MS)
        )
      );

      if (response && response.status === 'ok' && response.message && Array.isArray(response.message.items)) {
        return response.message.items.map(item => this.mapCrossrefItemToSource(item));
      }

      return [];
    } catch (err) {
      console.warn(`[CrossrefProvider] Search failed for query "${query}":`, err);
      return [];
    }
  }

  async getSource(doi: string): Promise<Source | null> {
    const cleanDoi = this.normalization.normalizeDoi(doi);
    if (!cleanDoi) return null;

    const headers = new HttpHeaders({
      'User-Agent': 'AcademicResearchEngine/1.0 (mailto:researcher@academic-studio.org)'
    });

    try {
      const response = await firstValueFrom(
        this.http.get<CrossrefWorkSingleResponse>(`${this.BASE_URL}/${encodeURIComponent(cleanDoi)}`, { headers }).pipe(
          timeout(this.REQUEST_TIMEOUT_MS)
        )
      );

      if (response && response.status === 'ok' && response.message) {
        return this.mapCrossrefItemToSource(response.message);
      }
      return null;
    } catch (err) {
      console.warn(`[CrossrefProvider] getSource failed for DOI "${doi}":`, err);
      return null;
    }
  }

  async getMetadata(doi: string): Promise<SourceMetadata | null> {
    const source = await this.getSource(doi);
    return source ? source.metadata : null;
  }

  private mapCrossrefItemToSource(item: CrossrefWorkItem): Source {
    const title = Array.isArray(item.title) && item.title.length > 0 ? item.title[0] : '';
    const journal = Array.isArray(item['container-title']) && item['container-title'].length > 0 ? item['container-title'][0] : undefined;

    let publicationYear: number | undefined;
    const dateObj = item.issued || item['published-print'] || item['published-online'];
    if (dateObj && Array.isArray(dateObj['date-parts']) && dateObj['date-parts'].length > 0) {
      publicationYear = dateObj['date-parts'][0][0];
    }

    const rawMetadata: Partial<SourceMetadata> = {
      title,
      authors: item.author ? item.author.map(a => a.name || `${a.given || ''} ${a.family || ''}`.trim()) : [],
      publicationYear,
      publisher: item.publisher,
      journal,
      volume: item.volume,
      issue: item.issue,
      pages: item.page,
      doi: item.DOI,
      url: item.URL,
      abstract: item.abstract,
      sourceType: this.normalization.normalizeSourceType(item.type),
      databaseProvider: 'Crossref',
      verificationStatus: 'unverified'
    };

    const normalizedMeta = this.normalization.normalizeMetadata(rawMetadata);

    const sourceId = `crossref_${item.DOI ? item.DOI.replace(/[^a-zA-Z0-9]/g, '_') : Math.random().toString(36).substring(2, 9)}`;

    return {
      id: sourceId,
      metadata: normalizedMeta,
      addedAt: new Date().toISOString(),
      provenance: {
        sourceProvider: 'Crossref',
        providerSourceId: item.DOI,
        retrievalTimestamp: new Date().toISOString(),
        originalUrl: item.URL || (item.DOI ? `https://doi.org/${item.DOI}` : undefined),
        retrievedMetadataSnapshot: item as unknown as Record<string, unknown>,
        transformationHistory: [
          {
            timestamp: new Date().toISOString(),
            action: 'DISCOVERED_AND_NORMALIZED',
            actor: 'CrossrefProviderService',
            details: `Mapped Crossref DOI: ${item.DOI}`
          }
        ]
      }
    };
  }
}
