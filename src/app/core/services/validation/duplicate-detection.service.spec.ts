import { TestBed } from '@angular/core/testing';
import { DuplicateDetectionService } from '../duplicate-detection.service';
import { MetadataNormalizationService } from '../metadata-normalization.service';
import { IdentifierVerificationService } from '../identifier-verification.service';
import { Source } from '../../models/research.model';

describe('DuplicateDetectionService', () => {
  let service: DuplicateDetectionService;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      service = new DuplicateDetectionService(new MetadataNormalizationService(new IdentifierVerificationService()));
    });
  });

  it('should identify sources with matching DOI as duplicate with 1.0 confidence', () => {
    const sourceA: Source = {
      id: 'src_a',
      addedAt: new Date().toISOString(),
      metadata: {
        title: 'Deep Learning',
        authors: ['John Doe'],
        doi: '10.1016/j.cell.2020.01.001',
        sourceType: 'journal_article',
        verificationStatus: 'verified'
      },
      provenance: {
        sourceProvider: 'Crossref',
        retrievalTimestamp: new Date().toISOString(),
        transformationHistory: []
      }
    };

    const sourceB: Source = {
      id: 'src_b',
      addedAt: new Date().toISOString(),
      metadata: {
        title: 'Deep Learning Study',
        authors: ['John Doe'],
        doi: '10.1016/j.cell.2020.01.001',
        sourceType: 'journal_article',
        verificationStatus: 'unverified'
      },
      provenance: {
        sourceProvider: 'OpenAlex',
        retrievalTimestamp: new Date().toISOString(),
        transformationHistory: []
      }
    };

    const result = service.compareSources(sourceA, sourceB);
    expect(result.isDuplicate).toBe(true);
    expect(result.confidence).toBe(1.0);
    expect(result.matchingCriteria.some((c: string) => c.includes('DOI'))).toBe(true);
  });
});

