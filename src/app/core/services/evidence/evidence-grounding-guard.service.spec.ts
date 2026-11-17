import { TestBed } from '@angular/core/testing';
import { EvidenceGroundingGuard } from '../evidence-grounding-guard.service';
import { EvidenceCoverageService } from '../evidence-coverage.service';
import { AcademicParagraph, AcademicClaim } from '../../models/academic-writing.model';

describe('EvidenceGroundingGuard', () => {
  let guard: EvidenceGroundingGuard;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      guard = new EvidenceGroundingGuard(new EvidenceCoverageService());
    });
  });

  it('should flag unsupported and unverified claims and prevent verified text status', () => {
    const claims: AcademicClaim[] = [
      {
        claim: { id: 'c1', statement: 'Verified claim', status: 'supported' },
        evidenceItems: [],
        status: 'supported',
        source: {
          id: 's1',
          addedAt: '2023-01-01',
          metadata: { title: 'Verified Paper', authors: ['A. Author'], sourceType: 'journal_article', verificationStatus: 'verified' },
          provenance: { sourceProvider: 'Crossref', retrievalTimestamp: '2023-01-01', transformationHistory: [] }
        }
      },
      {
        claim: { id: 'c2', statement: 'Ungrounded claim', status: 'unsupported' },
        evidenceItems: [],
        status: 'unsupported'
      }
    ];

    const paragraph: AcademicParagraph = {
      id: 'p1',
      sectionId: 'sec1',
      text: 'Quantum state tomography accelerates calculation.',
      claims,
      citations: [],
      coverageMetrics: { totalClaims: 2, supportedClaims: 1, partiallySupportedClaims: 0, unsupportedClaims: 1, unverifiedClaims: 0, coverageScore: 50 },
      warnings: [],
      isVerifiedAcademicText: false
    };

    const res = guard.guardParagraph(paragraph);

    expect(res.isVerifiedAcademicText).toBe(false);
    expect(res.unsupportedClaims.length).toBe(1);
    expect(res.warnings.length).toBeGreaterThan(0);
    expect(res.annotatedParagraphText).toContain('UNSUPPORTED CLAIMS');
  });

  it('should detect source boundary violations when statement contains fake stats', () => {
    const evidence = ['We observed a 15% increase in efficiency over traditional baseline.'];
    const invalidStatement = 'The efficiency surged by 99% in 2099.';

    const check = guard.validateSourceBoundary(invalidStatement, evidence);

    expect(check.isWithinBoundary).toBe(false);
    expect(check.unsupportedElements.some(e => e.includes('99%') || e.includes('2099'))).toBe(true);
  });
});
