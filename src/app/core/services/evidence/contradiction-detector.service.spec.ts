import { TestBed } from '@angular/core/testing';
import { ContradictionDetectorService } from '../contradiction-detector.service';
import { Claim, Source, Evidence } from '../../models/research.model';

describe('ContradictionDetectorService', () => {
  let service: ContradictionDetectorService;

  const mockSourceA: Source = {
    id: 's1',
    addedAt: '2023-01-01T00:00:00Z',
    metadata: {
      title: 'Historical Review A',
      authors: ['Smith, J.'],
      publicationYear: 2020,
      verificationStatus: 'verified',
      sourceType: 'journal_article'
    },
    provenance: {
      sourceProvider: 'academic_db',
      retrievalTimestamp: '2023-01-01T00:00:00Z',
      transformationHistory: []
    }
  };

  const mockSourceB: Source = {
    id: 's2',
    addedAt: '2023-01-01T00:00:00Z',
    metadata: {
      title: 'Historical Review B',
      authors: ['Doe, A.'],
      publicationYear: 2021,
      verificationStatus: 'verified',
      sourceType: 'journal_article'
    },
    provenance: {
      sourceProvider: 'academic_db',
      retrievalTimestamp: '2023-01-01T00:00:00Z',
      transformationHistory: []
    }
  };

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      service = new ContradictionDetectorService();
    });
  });

  it('should detect direct contradiction between evidence items', () => {
    const claim: Claim = { id: 'c1', statement: 'Treatment is effective', status: 'unverified' };
    const evA: Evidence = {
      id: 'e1',
      sourceId: 's1',
      evidenceType: 'direct',
      extractedSnippet: 'Clinical trials showed treatment is effective in all patient groups.',
      location: { page: '12' },
      confidenceScore: 90,
      verificationStatus: 'verified',
      provenance: mockSourceA.provenance
    };
    const evB: Evidence = {
      id: 'e2',
      sourceId: 's2',
      evidenceType: 'direct',
      extractedSnippet: 'Study concluded treatment is ineffective and shows no benefit.',
      location: { page: '45' },
      confidenceScore: 90,
      verificationStatus: 'verified',
      provenance: mockSourceB.provenance
    };

    const contradictions = service.detectContradictions(
      claim,
      [],
      [evA, evB],
      [mockSourceA, mockSourceB]
    );

    expect(contradictions.length).toBe(1);
    expect(contradictions[0].type).toBe('direct');
    expect(contradictions[0].contradictionConfidence).toBeGreaterThanOrEqual(90);
    expect(contradictions[0].needsHumanReview).toBe(true);
  });

  it('should detect numerical contradiction when values differ with same units', () => {
    const claim: Claim = { id: 'c2', statement: 'Adoption rate was high', status: 'unverified' };
    const evA: Evidence = {
      id: 'e1',
      sourceId: 's1',
      evidenceType: 'direct',
      extractedSnippet: 'The measured adoption rate reached 25%',
      location: { page: '10' },
      confidenceScore: 85,
      verificationStatus: 'verified',
      provenance: mockSourceA.provenance
    };
    const evB: Evidence = {
      id: 'e2',
      sourceId: 's2',
      evidenceType: 'direct',
      extractedSnippet: 'The measured adoption rate reached 40%',
      location: { page: '15' },
      confidenceScore: 85,
      verificationStatus: 'verified',
      provenance: mockSourceB.provenance
    };

    const contradictions = service.detectContradictions(
      claim,
      [],
      [evA, evB],
      [mockSourceA, mockSourceB]
    );

    expect(contradictions.length).toBe(1);
    expect(contradictions[0].type).toBe('numerical');
    expect(contradictions[0].resolutionStatus).toBe('unresolved');
  });

  it('should detect date contradiction for same event context', () => {
    const claim: Claim = { id: 'c3', statement: 'Event timeline', status: 'unverified' };
    const evA: Evidence = {
      id: 'e1',
      sourceId: 's1',
      evidenceType: 'direct',
      extractedSnippet: 'The institution occurred in 1990',
      location: { page: '1' },
      confidenceScore: 80,
      verificationStatus: 'verified',
      provenance: mockSourceA.provenance
    };
    const evB: Evidence = {
      id: 'e2',
      sourceId: 's2',
      evidenceType: 'direct',
      extractedSnippet: 'The institution occurred in 1995',
      location: { page: '2' },
      confidenceScore: 80,
      verificationStatus: 'verified',
      provenance: mockSourceB.provenance
    };

    const contradictions = service.detectContradictions(
      claim,
      [],
      [evA, evB],
      [mockSourceA, mockSourceB]
    );

    expect(contradictions.length).toBe(1);
    expect(contradictions[0].type).toBe('date');
    expect(contradictions[0].contradictionConfidence).toBe(85);
  });

  it('should identify FALSE contradiction when distinct actions are mentioned (founded vs registered)', () => {
    const claim: Claim = { id: 'c4', statement: 'Organization milestones', status: 'unverified' };
    const evA: Evidence = {
      id: 'e1',
      sourceId: 's1',
      evidenceType: 'direct',
      extractedSnippet: 'The company was founded in 1990',
      location: { page: '1' },
      confidenceScore: 85,
      verificationStatus: 'verified',
      provenance: mockSourceA.provenance
    };
    const evB: Evidence = {
      id: 'e2',
      sourceId: 's2',
      evidenceType: 'direct',
      extractedSnippet: 'The company became officially registered in 1995',
      location: { page: '2' },
      confidenceScore: 85,
      verificationStatus: 'verified',
      provenance: mockSourceB.provenance
    };

    const contradictions = service.detectContradictions(
      claim,
      [],
      [evA, evB],
      [mockSourceA, mockSourceB]
    );

    expect(contradictions.length).toBe(1);
    expect(contradictions[0].resolutionStatus).toBe('not_a_true_conflict');
    expect(contradictions[0].needsHumanReview).toBe(false);
  });

  it('should flag scope conflict when units mismatch (kg vs lb)', () => {
    const claim: Claim = { id: 'c5', statement: 'Payload mass', status: 'unverified' };
    const evA: Evidence = {
      id: 'e1',
      sourceId: 's1',
      evidenceType: 'direct',
      extractedSnippet: 'Total mass recorded was 25 kg',
      location: { page: '1' },
      confidenceScore: 80,
      verificationStatus: 'verified',
      provenance: mockSourceA.provenance
    };
    const evB: Evidence = {
      id: 'e2',
      sourceId: 's2',
      evidenceType: 'direct',
      extractedSnippet: 'Total mass recorded was 25 lb',
      location: { page: '2' },
      confidenceScore: 80,
      verificationStatus: 'verified',
      provenance: mockSourceB.provenance
    };

    const contradictions = service.detectContradictions(
      claim,
      [],
      [evA, evB],
      [mockSourceA, mockSourceB]
    );

    expect(contradictions.length).toBe(1);
    expect(contradictions[0].type).toBe('scope_conflict');
    expect(contradictions[0].reasoning).toContain('Unit mismatch');
  });
});
