import { EvidenceCoverageService } from '../evidence-coverage.service';
import { AcademicClaim, AcademicParagraph } from '../../models/academic-writing.model';

describe('EvidenceCoverageService', () => {
  let service: EvidenceCoverageService;

  beforeEach(() => {
    service = new EvidenceCoverageService();
  });

  const mockClaimSupported: AcademicClaim = {
    claim: { id: 'c1', statement: 'Quantum computing speeds up search.', status: 'supported' },
    evidenceItems: [],
    status: 'supported'
  };

  const mockClaimPartiallySupported: AcademicClaim = {
    claim: { id: 'c2', statement: 'Quantum computing is cheap.', status: 'partially_supported' },
    evidenceItems: [],
    status: 'partially_supported'
  };

  const mockClaimUnsupported: AcademicClaim = {
    claim: { id: 'c3', statement: 'Quantum computing cures cancer overnight.', status: 'unsupported' },
    evidenceItems: [],
    status: 'unsupported'
  };

  it('should calculate coverage score correctly and not label it as truth percentage', () => {
    const claims = [mockClaimSupported, mockClaimPartiallySupported, mockClaimUnsupported];
    const metrics = service.calculateClaimCoverage(claims);

    expect(metrics.totalClaims).toBe(3);
    expect(metrics.supportedClaims).toBe(1);
    expect(metrics.partiallySupportedClaims).toBe(1);
    expect(metrics.unsupportedClaims).toBe(1);
    // (1*1 + 1*0.5)/3 * 100 = 50%
    expect(metrics.coverageScore).toBe(50);
  });

  it('should return 0 coverage score for empty claims list', () => {
    const metrics = service.calculateClaimCoverage([]);
    expect(metrics.totalClaims).toBe(0);
    expect(metrics.coverageScore).toBe(0);
  });

  it('should calculate paragraph coverage metrics', () => {
    const paragraph: AcademicParagraph = {
      id: 'p1',
      sectionId: 's1',
      text: 'Sample paragraph text.',
      claims: [mockClaimSupported],
      citations: [],
      coverageMetrics: {
        totalClaims: 1,
        supportedClaims: 1,
        partiallySupportedClaims: 0,
        unsupportedClaims: 0,
        unverifiedClaims: 0,
        coverageScore: 100
      },
      warnings: [],
      isVerifiedAcademicText: true
    };

    const res = service.calculateParagraphCoverage(paragraph);
    expect(res.coverageScore).toBe(100);
    expect(res.supportedClaims).toBe(1);
  });
});
