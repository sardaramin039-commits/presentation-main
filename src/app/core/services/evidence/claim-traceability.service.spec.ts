import { ClaimTraceabilityService } from '../claim-traceability.service';
import { Claim, Evidence, Source, Citation } from '../../models/research.model';

describe('ClaimTraceabilityService', () => {
  let service: ClaimTraceabilityService;

  beforeEach(() => {
    service = new ClaimTraceabilityService();
  });

  const sampleClaim: Claim = { id: 'c1', statement: 'Neural networks accelerate MRI parsing.', status: 'supported' };

  const sampleEvidence: Evidence = {
    id: 'e1',
    sourceId: 's1',
    evidenceType: 'direct',
    extractedSnippet: 'MRI processing time decreased from 10m to 12s.',
    location: { page: '14' },
    confidenceScore: 0.98,
    verificationStatus: 'verified',
    provenance: { sourceProvider: 'Crossref', retrievalTimestamp: '2023-01-01', transformationHistory: [] }
  };

  const sampleSource: Source = {
    id: 's1',
    addedAt: '2023-01-01',
    metadata: {
      title: 'Accelerated Medical Imaging',
      authors: ['Jane Doe'],
      publicationYear: 2023,
      doi: '10.1000/med.123',
      sourceType: 'journal_article',
      verificationStatus: 'verified'
    },
    provenance: {
      sourceProvider: 'Crossref',
      originalUrl: 'https://doi.org/10.1000/med.123',
      retrievalTimestamp: '2023-01-01',
      transformationHistory: []
    }
  };

  const sampleCitation: Citation = {
    citationId: 'cit_1',
    sourceId: 's1',
    claimId: 'c1',
    style: 'APA7',
    locator: { page: '14' },
    inTextParenthetical: '(Doe, 2023, p. 14)',
    inTextNarrative: 'Doe (2023, p. 14)',
    fullReferenceText: 'Doe, J. (2023). Accelerated Medical Imaging.',
    validationStatus: 'valid',
    provenance: {
      sourceId: 's1',
      citationStyle: 'APA7',
      generatedAt: '2023-01-01',
      formatterVersion: '1.0.0'
    }
  };

  it('should construct a complete auditable traceability trace for a claim', () => {
    const trace = service.traceClaim(sampleClaim, [sampleEvidence], sampleSource, sampleCitation);

    expect(trace.claimId).toBe('c1');
    expect(trace.isAuditable).toBe(true);
    expect(trace.evidence?.extractedSnippet).toContain('MRI processing time');
    expect(trace.source?.doi).toBe('10.1000/med.123');
    expect(trace.provider?.providerName).toBe('Crossref');
    expect(trace.citation?.inTextParenthetical).toBe('(Doe, 2023, p. 14)');
  });

  it('should mark claim as non-auditable if evidence or source is missing', () => {
    const trace = service.traceClaim(sampleClaim, [], undefined, undefined);

    expect(trace.isAuditable).toBe(false);
    expect(trace.traceabilityNotes.some(n => n.includes('No evidence'))).toBe(true);
    expect(trace.traceabilityNotes.some(n => n.includes('Missing backing source'))).toBe(true);
  });
});
