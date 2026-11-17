import { EvidenceComparisonService } from '../evidence-comparison.service';
import { Claim, Source, Evidence } from '../../models/research.model';

describe('EvidenceComparisonService', () => {
  let service: EvidenceComparisonService;

  const mockSource: Source = {
    id: 's1',
    addedAt: '2023-01-01T00:00:00Z',
    metadata: {
      title: 'Quantum Computing Review',
      authors: ['Nielsen, M.'],
      publicationYear: 2022,
      doi: '10.1016/j.qc.2022.01.001',
      verificationStatus: 'verified',
      sourceType: 'journal_article'
    },
    provenance: {
      sourceProvider: 'IEEE Xplore',
      retrievalTimestamp: '2023-01-01T12:00:00Z',
      transformationHistory: []
    }
  };

  const mockClaim: Claim = {
    id: 'c1',
    statement: 'Quantum algorithms provide exponential speedup for integer factorization.',
    status: 'unverified'
  };

  beforeEach(() => {
    service = new EvidenceComparisonService();
  });

  it('should assess supporting evidence with directness and locator availability', () => {
    const evidence: Evidence = {
      id: 'e1',
      sourceId: 's1',
      evidenceType: 'direct',
      extractedSnippet: 'Shor algorithm confirms quantum algorithms provide exponential speedup for integer factorization.',
      location: { page: '14', section: '3.2' },
      confidenceScore: 90,
      verificationStatus: 'verified',
      provenance: mockSource.provenance
    };

    const assessment = service.assessEvidence(mockClaim, evidence, mockSource);

    expect(assessment.type).toBe('supporting');
    expect(assessment.isDirectEvidence).toBe(true);
    expect(assessment.hasLocator).toBe(true);
    expect(assessment.provenanceComplete).toBe(true);
    expect(assessment.confidenceScore).toBeGreaterThanOrEqual(80);
    expect(assessment.assessmentReason).toContain('DOI provided (note: DOI verifies publication index, not factual veracity)');
  });

  it('should mark evidence as insufficient when snippet is empty or source rejected', () => {
    const rejectedSource: Source = {
      ...mockSource,
      metadata: { ...mockSource.metadata, verificationStatus: 'rejected' }
    };

    const evidence: Evidence = {
      id: 'e2',
      sourceId: 's1',
      evidenceType: 'direct',
      extractedSnippet: 'Too short',
      location: { page: 'unknown' },
      confidenceScore: 20,
      verificationStatus: 'rejected',
      provenance: mockSource.provenance
    };

    const assessment = service.assessEvidence(mockClaim, evidence, rejectedSource);
    expect(assessment.type).toBe('insufficient');
  });
});
