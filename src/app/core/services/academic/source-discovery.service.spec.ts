import { TestBed } from '@angular/core/testing';
import { SourceDiscoveryService, ResearchSourceProvider } from '../source-discovery.service';
import { DuplicateDetectionService } from '../duplicate-detection.service';
import { SourceMergingService } from '../source-merging.service';
import { SourceVerificationService } from '../source-verification.service';
import { MetadataNormalizationService } from '../metadata-normalization.service';
import { IdentifierVerificationService } from '../identifier-verification.service';
import { Source, SourceMetadata } from '../../models/research.model';

class MockFailingProvider implements ResearchSourceProvider {
  readonly providerName = 'FailingProvider';
  async search(): Promise<Source[]> {
    throw new Error('Network Connection Failed');
  }
  async getSource(): Promise<Source | null> { return null; }
  async getMetadata(): Promise<SourceMetadata | null> { return null; }
}

class MockSuccessfulProvider implements ResearchSourceProvider {
  readonly providerName = 'SuccessfulProvider';
  async search(): Promise<Source[]> {
    return [
      {
        id: 'succ_1',
        addedAt: new Date().toISOString(),
        metadata: {
          title: 'Artificial Intelligence in Medicine',
          authors: ['Dr. Sarah Connor'],
          publicationYear: 2023,
          sourceType: 'journal_article',
          verificationStatus: 'unverified'
        },
        provenance: {
          sourceProvider: 'SuccessfulProvider',
          retrievalTimestamp: new Date().toISOString(),
          transformationHistory: []
        }
      }
    ];
  }
  async getSource(): Promise<Source | null> { return null; }
  async getMetadata(): Promise<SourceMetadata | null> { return null; }
}

describe('SourceDiscoveryService', () => {
  let service: SourceDiscoveryService;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      const idVer = new IdentifierVerificationService();
      const metaNorm = new MetadataNormalizationService(idVer);
      const srcVer = new SourceVerificationService(idVer);
      const dupDet = new DuplicateDetectionService(metaNorm);
      const srcMerge = new SourceMergingService(metaNorm);
      service = new SourceDiscoveryService(dupDet, srcMerge, srcVer, metaNorm);
    });
  });

  it('should isolate provider failure and return partial results from working providers', async () => {
    const failingProvider = new MockFailingProvider();
    const successfulProvider = new MockSuccessfulProvider();

    // Register test providers
    service.registerProvider(failingProvider);
    service.registerProvider(successfulProvider);

    const searchResult = await service.searchWithResilience('AI Medicine', { autoVerify: false });

    expect(searchResult.results.length).toBeGreaterThanOrEqual(1);
    expect(searchResult.results.some(s => s.metadata.title === 'Artificial Intelligence in Medicine')).toBe(true);
    expect(searchResult.providerErrors?.length).toBe(1);
    expect(searchResult.providerErrors?.[0].providerName).toBe('FailingProvider');
    expect(searchResult.providersUsed).toContain('SuccessfulProvider');
  });
});

