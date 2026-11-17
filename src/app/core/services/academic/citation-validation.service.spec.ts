import { CitationValidationService } from '../citation-validation.service';
import { Citation, Source } from '../../models/research.model';

describe('CitationValidationService', () => {
  let service: CitationValidationService;

  beforeEach(() => {
    service = new CitationValidationService();
  });

  const validSource: Source = {
    id: 'src_valid',
    addedAt: new Date().toISOString(),
    metadata: {
      title: 'Valid Academic Paper',
      authors: ['Jane Doe'],
      publicationYear: 2022,
      sourceType: 'journal_article',
      verificationStatus: 'verified'
    },
    provenance: {
      sourceProvider: 'Crossref',
      retrievalTimestamp: new Date().toISOString(),
      transformationHistory: []
    }
  };

  const rejectedSource: Source = {
    id: 'src_rejected',
    addedAt: new Date().toISOString(),
    metadata: {
      title: 'Hallucinated Paper',
      authors: ['Fake Author'],
      publicationYear: 2020,
      sourceType: 'journal_article',
      verificationStatus: 'rejected'
    },
    provenance: {
      sourceProvider: 'Mock',
      retrievalTimestamp: new Date().toISOString(),
      transformationHistory: []
    }
  };

  it('should validate a valid citation with verified source', () => {
    const citation: Citation = {
      citationId: 'cit_1',
      sourceId: 'src_valid',
      style: 'APA7',
      locator: { page: '10' },
      inTextParenthetical: '(Doe, 2022, p. 10)',
      inTextNarrative: 'Doe (2022, p. 10)',
      fullReferenceText: 'Doe, J. (2022). Valid Academic Paper.',
      validationStatus: 'unverified',
      provenance: {
        sourceId: 'src_valid',
        citationStyle: 'APA7',
        generatedAt: new Date().toISOString(),
        formatterVersion: '1.0.0'
      }
    };

    const res = service.validateCitation(citation, validSource);
    expect(res.status).toBe('valid');
    expect(res.isValid).toBe(true);
    expect(res.errors.length).toBe(0);
  });

  it('should invalidate citation derived from a rejected source', () => {
    const citation: Citation = {
      citationId: 'cit_rejected',
      sourceId: 'src_rejected',
      style: 'APA7',
      locator: {},
      inTextParenthetical: '(Fake Author, 2020)',
      inTextNarrative: 'Fake Author (2020)',
      fullReferenceText: 'Fake Author. (2020). Hallucinated Paper.',
      validationStatus: 'unverified',
      provenance: {
        sourceId: 'src_rejected',
        citationStyle: 'APA7',
        generatedAt: new Date().toISOString(),
        formatterVersion: '1.0.0'
      }
    };

    const res = service.validateCitation(citation, rejectedSource);
    expect(res.status).toBe('invalid');
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e: string) => e.includes('rejected'))).toBe(true);
  });

  it('should invalidate citation if source does not exist', () => {
    const citation: Citation = {
      citationId: 'cit_missing',
      sourceId: 'non_existent_source',
      style: 'APA7',
      locator: {},
      inTextParenthetical: '(Unknown, 2020)',
      inTextNarrative: 'Unknown (2020)',
      fullReferenceText: 'Unknown. (2020). Missing.',
      validationStatus: 'unverified',
      provenance: {
        sourceId: 'non_existent_source',
        citationStyle: 'APA7',
        generatedAt: new Date().toISOString(),
        formatterVersion: '1.0.0'
      }
    };

    const res = service.validateCitation(citation, undefined);
    expect(res.status).toBe('invalid');
    expect(res.isValid).toBe(false);
  });
});

