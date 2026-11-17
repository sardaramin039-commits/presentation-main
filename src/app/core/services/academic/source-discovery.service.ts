import { Injectable, InjectionToken, inject } from '@angular/core';
import { Source, SourceMetadata, ResearchSearchResult, ProviderError } from '../../models/research.model';
import { CrossrefProviderService } from '../../providers/crossref-provider.service';
import { OpenAlexProviderService } from '../../providers/openalex-provider.service';
import { DuplicateDetectionService } from '../duplicate-detection.service';
import { SourceMergingService } from '../source-merging.service';
import { SourceVerificationService } from '../source-verification.service';

export interface SearchOptions {
  limit?: number;
  page?: number;
  sourceType?: string;
  yearStart?: number;
  yearEnd?: number;
  language?: string;
  autoVerify?: boolean;
}

export interface ResearchSourceProvider {
  readonly providerName: string;
  search(query: string, options?: SearchOptions): Promise<Source[]>;
  getSource(id: string): Promise<Source | null>;
  getMetadata(id: string): Promise<SourceMetadata | null>;
}

export const RESEARCH_SOURCE_PROVIDERS = new InjectionToken<ResearchSourceProvider[]>(
  'RESEARCH_SOURCE_PROVIDERS'
);

@Injectable({
  providedIn: 'root'
})
export class SourceDiscoveryService {
  private crossrefProvider = inject(CrossrefProviderService);
  private openAlexProvider = inject(OpenAlexProviderService);
  private duplicateDetection = inject(DuplicateDetectionService);
  private sourceMerging = inject(SourceMergingService);
  private sourceVerification = inject(SourceVerificationService);

  private injectedProviders = inject(RESEARCH_SOURCE_PROVIDERS, { optional: true });
  private providers: ResearchSourceProvider[] = [];

  constructor() {
    if (this.injectedProviders && this.injectedProviders.length > 0) {
      this.providers = [...this.injectedProviders];
    } else {
      // Register Production-Grade Academic Providers
      this.providers = [this.crossrefProvider, this.openAlexProvider];
    }
  }

  registerProvider(provider: ResearchSourceProvider): void {
    if (!this.providers.some(p => p.providerName === provider.providerName)) {
      this.providers.push(provider);
    }
  }

  getRegisteredProviders(): string[] {
    return this.providers.map(p => p.providerName);
  }

  async searchAll(query: string, options?: SearchOptions): Promise<Source[]> {
    const result = await this.searchWithResilience(query, options);
    return result.results;
  }

  async searchWithResilience(query: string, options?: SearchOptions): Promise<ResearchSearchResult> {
    const now = new Date().toISOString();
    const cleanQuery = query ? query.trim() : '';

    if (!cleanQuery) {
      return {
        query: '',
        providersUsed: [],
        results: [],
        totalKnownResults: 0,
        pagination: { page: options?.page || 1, limit: options?.limit || 10, totalPages: 0, hasMore: false },
        providerErrors: [],
        retrievedAt: now
      };
    }

    const limit = options?.limit || 10;
    const page = options?.page || 1;

    const providersUsed: string[] = [];
    const providerErrors: ProviderError[] = [];
    const rawSourcesByProvider: Source[][] = [];

    // Query all registered providers in parallel with isolated error boundaries
    const fetchPromises = this.providers.map(async provider => {
      try {
        const results = await provider.search(cleanQuery, { ...options, limit });
        providersUsed.push(provider.providerName);
        return { providerName: provider.providerName, results, error: null };
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        providerErrors.push({
          providerName: provider.providerName,
          errorMessage: errorMsg
        });
        return { providerName: provider.providerName, results: [], error: errorMsg };
      }
    });

    const settled = await Promise.all(fetchPromises);

    for (const res of settled) {
      if (res.results && res.results.length > 0) {
        rawSourcesByProvider.push(res.results);
      }
    }

    const flatSources = rawSourcesByProvider.flat();

    // Deduplicate and Merge duplicates across providers
    const mergedSources = this.deduplicateAndMerge(flatSources);

    // Run Source Verification pipeline on newly discovered sources if requested or by default
    const verifiedSources: Source[] = [];
    for (const source of mergedSources) {
      if (options?.autoVerify !== false) {
        const verificationRes = await this.sourceVerification.verifySource(source);
        verifiedSources.push({
          ...source,
          metadata: {
            ...source.metadata,
            verificationStatus: verificationRes.status
          },
          verificationResult: verificationRes
        });
      } else {
        verifiedSources.push(source);
      }
    }

    return {
      query: cleanQuery,
      providersUsed,
      results: verifiedSources,
      totalKnownResults: verifiedSources.length,
      pagination: {
        page,
        limit,
        totalPages: Math.ceil(verifiedSources.length / limit) || 1,
        hasMore: verifiedSources.length >= limit
      },
      providerErrors,
      retrievedAt: now
    };
  }

  async getSource(providerName: string, id: string): Promise<Source | null> {
    const provider = this.providers.find(p => p.providerName === providerName);
    if (!provider) return null;

    try {
      const source = await provider.getSource(id);
      if (source) {
        const vRes = await this.sourceVerification.verifySource(source);
        return {
          ...source,
          metadata: { ...source.metadata, verificationStatus: vRes.status },
          verificationResult: vRes
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getMetadata(providerName: string, id: string): Promise<SourceMetadata | null> {
    const source = await this.getSource(providerName, id);
    return source ? source.metadata : null;
  }

  private deduplicateAndMerge(sources: Source[]): Source[] {
    if (sources.length <= 1) return sources;

    const mergedList: Source[] = [];
    const mergedIndices = new Set<number>();

    for (let i = 0; i < sources.length; i++) {
      if (mergedIndices.has(i)) continue;

      let currentSource = sources[i];

      for (let j = i + 1; j < sources.length; j++) {
        if (mergedIndices.has(j)) continue;

        const candidate = sources[j];
        const match = this.duplicateDetection.compareSources(currentSource, candidate);

        if (match.isDuplicate) {
          // Merge candidate into currentSource
          const mergeRes = this.sourceMerging.mergeSources(currentSource, candidate);
          currentSource = mergeRes.mergedSource;
          mergedIndices.add(j);
        }
      }

      mergedList.push(currentSource);
    }

    return mergedList;
  }
}
