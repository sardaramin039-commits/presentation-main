import { TestBed } from '@angular/core/testing';
import { FactCheckService } from '../fact-check.service';
import { ClaimDecompositionService } from '../claim-decomposition.service';
import { EvidenceComparisonService } from '../evidence-comparison.service';
import { ContradictionDetectorService } from '../contradiction-detector.service';
import { Claim, Source, Evidence } from '../../models/research.model';
import { FactCheckRequest } from '../../models/fact-check.model';

describe('FactCheckService', () => {
  let service: FactCheckService;

  const sourceA: Source = {
    id: 's1',
    addedAt: '2023-01-01T00:00:00Z',
    metadata: {
      title: 'Academic Source A',
      authors: ['Author A'],
      verificationStatus: 'verified',
      sourceType: 'journal_article'
    },
    provenance: {
      sourceProvider: 'crossref',
      retrievalTimestamp: '2023-01-01T00:00:00Z',
      transformationHistory: []
    }
  };

  const sourceB: Source = {
    id: 's2',
    addedAt: '2023-01-01T00:00:00Z',
    metadata: {
      title: 'Academic Source B',
      authors: ['Author B'],
      verificationStatus: 'verified',
      sourceType: 'journal_article'
    },
    provenance: {
      sourceProvider: 'pubmed',
      retrievalTimestamp: '2023-01-01T00:00:00Z',
      transformationHistory: []
    }
  };

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      service = new FactCheckService(
        new ClaimDecompositionService(),
        new EvidenceComparisonService(),
        new ContradictionDetectorService()
      );
    });
  });

  it('should process simple supported claim successfully', () => {
    const claim: Claim = { id: 'c1', statement: 'Water boils at 100 degrees Celsius', status: 'unverified' };
    const evidence: Evidence = {
      id: 'e1',
      sourceId: 's1',
      claimId: 'c1',
      evidenceType: 'direct',
      extractedSnippet: 'Experiments confirm that water boils at 100 degrees Celsius at standard pressure.',
      location: { page: '5' },
      confidenceScore: 95,
      verificationStatus: 'verified',
      provenance: sourceA.provenance
    };

    const req: FactCheckRequest = {
      claims: [claim],
      sources: [sourceA],
      evidenceList: [evidence]
    };

    const res = service.executeFactCheck(req);
    expect(res.claimAssessments.length).toBe(1);
    expect(res.claimAssessments[0].assessmentStatus).toBe('supported');
    expect(res.claimAssessments[0].needsHumanReview).toBe(false);
  });

  it('should process unsupported claim when evidence is absent or contradicting', () => {
    const claim: Claim = { id: 'c2', statement: 'Vaccines cause autism', status: 'unverified' };
    const evidence: Evidence = {
      id: 'e2',
      sourceId: 's2',
      claimId: 'c2',
      evidenceType: 'direct',
      extractedSnippet: 'Large scale studies conclude that vaccines do not cause autism and refutes the link.',
      location: { page: '10' },
      confidenceScore: 95,
      verificationStatus: 'verified',
      provenance: sourceB.provenance
    };

    const req: FactCheckRequest = {
      claims: [claim],
      sources: [sourceB],
      evidenceList: [evidence]
    };

    const res = service.executeFactCheck(req);
    expect(res.claimAssessments[0].assessmentStatus).toBe('unsupported');
  });

  it('should flag human review escalation on conflicting high-quality sources and unresolved conflicts', () => {
    const claim: Claim = { id: 'c3', statement: 'The trial completion date was 2020', status: 'unverified' };
    const ev1: Evidence = {
      id: 'e1',
      sourceId: 's1',
      claimId: 'c3',
      evidenceType: 'direct',
      extractedSnippet: 'The trial completion occurred in 2020',
      location: { page: '1' },
      confidenceScore: 90,
      verificationStatus: 'verified',
      provenance: sourceA.provenance
    };
    const ev2: Evidence = {
      id: 'e2',
      sourceId: 's2',
      claimId: 'c3',
      evidenceType: 'direct',
      extractedSnippet: 'The trial completion occurred in 2022',
      location: { page: '1' },
      confidenceScore: 90,
      verificationStatus: 'verified',
      provenance: sourceB.provenance
    };

    const req: FactCheckRequest = {
      claims: [claim],
      sources: [sourceA, sourceB],
      evidenceList: [ev1, ev2]
    };

    const res = service.executeFactCheck(req);
    expect(res.unresolvedContradictionsCount).toBeGreaterThanOrEqual(1);
    expect(res.needsHumanReviewCount).toBe(1);
    expect(res.claimAssessments[0].needsHumanReview).toBe(true);
  });

  it('should generate FactCheckReport without truth percentage and include traceability', () => {
    const claim: Claim = { id: 'c1', statement: 'Water boils at 100 degrees Celsius', status: 'unverified' };
    const evidence: Evidence = {
      id: 'e1',
      sourceId: 's1',
      claimId: 'c1',
      evidenceType: 'direct',
      extractedSnippet: 'Experiments confirm that water boils at 100 degrees Celsius.',
      location: { page: '5' },
      confidenceScore: 95,
      verificationStatus: 'verified',
      provenance: sourceA.provenance
    };

    const req: FactCheckRequest = {
      claims: [claim],
      sources: [sourceA],
      evidenceList: [evidence]
    };

    const result = service.executeFactCheck(req);
    const report = service.generateFactCheckReport(result);

    expect(report.checkedClaimsCount).toBe(1);
    expect(report.supportedClaimsCount).toBe(1);
    expect(report.evidenceCoverageRatio).toBe(1);
    // Verify no 'truthPercentage' field exists on report
    expect((report as unknown as Record<string, unknown>)['truthPercentage']).toBeUndefined();

    // Verify traceability
    const trace = service.generateTraceability(result.claimAssessments[0], [sourceA]);
    expect(trace.length).toBeGreaterThan(0);
    expect(trace[0].sources[0].sourceId).toBe('s1');
    expect(trace[0].sources[0].provider).toBe('crossref');
  });
});
