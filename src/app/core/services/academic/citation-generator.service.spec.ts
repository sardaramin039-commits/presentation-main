import { TestBed } from '@angular/core/testing';
import { CitationGeneratorService } from '../citation-generator.service';
import { CitationValidationService } from '../citation-validation.service';
import { Source, Claim, Evidence } from '../../models/research.model';

describe('CitationGeneratorService', () => {
  let service: CitationGeneratorService;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      service = new CitationGeneratorService(new CitationValidationService());
    });
  });

  const sampleSource: Source = {
    id: 'src_gen',
    addedAt: new Date().toISOString(),
    metadata: {
      title: 'Neural Networks in Physics',
      authors: ['Albert Einstein', 'Niels Bohr'],
      publicationYear: 2023,
      journal: 'Physical Review Letters',
      volume: '130',
      issue: '12',
      pages: '120001',
      doi: '10.1103/PhysRevLett.130.120001',
      sourceType: 'journal_article',
      verificationStatus: 'verified'
    },
    provenance: {
      sourceProvider: 'Crossref',
      retrievalTimestamp: new Date().toISOString(),
      transformationHistory: []
    }
  };

  const sampleClaim: Claim = {
    id: 'claim_1',
    statement: 'Quantum neural networks accelerate calculations.',
    status: 'supported'
  };

  const sampleEvidence: Evidence = {
    id: 'ev_1',
    sourceId: 'src_gen',
    evidenceType: 'direct',
    extractedSnippet: 'We demonstrate a 10x speedup in quantum state tomography.',
    location: { page: '120001' },
    confidenceScore: 0.95,
    verificationStatus: 'verified',
    provenance: {
      sourceProvider: 'Crossref',
      retrievalTimestamp: new Date().toISOString(),
      transformationHistory: []
    }
  };

  it('should generate structured APA7 citation with proper provenance', () => {
    const citation = service.generateCitation({
      source: sampleSource,
      claim: sampleClaim,
      evidence: sampleEvidence,
      style: 'APA7'
    });

    expect(citation.sourceId).toBe('src_gen');
    expect(citation.claimId).toBe('claim_1');
    expect(citation.evidenceId).toBe('ev_1');
    expect(citation.style).toBe('APA7');
    expect(citation.inTextParenthetical).toBe('(Einstein & Bohr, 2023, p. 120001)');
    expect(citation.fullReferenceText).toContain('Einstein, A., & Bohr, N.');
    expect(citation.validationStatus).toBe('valid');
    expect(citation.provenance?.formatterVersion).toBe('1.0.0');
  });

  it('should generate IEEE citation with numeric format', () => {
    const citation = service.generateCitation({
      source: sampleSource,
      claim: sampleClaim,
      evidence: sampleEvidence,
      style: 'IEEE',
      citationNumber: 3
    });

    expect(citation.style).toBe('IEEE');
    expect(citation.inTextNumeric).toBe('[3, p. 120001]');
    expect(citation.fullReferenceText).toContain('[3] A. Einstein and N. Bohr');
  });
});
