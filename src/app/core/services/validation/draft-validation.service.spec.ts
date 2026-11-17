import { DraftValidationService } from '../draft-validation.service';
import { ClaimTraceabilityService } from '../claim-traceability.service';
import { AcademicDocument } from '../../models/academic-writing.model';
import { Source } from '../../models/research.model';

describe('DraftValidationService', () => {
  let service: DraftValidationService;

  beforeEach(() => {
    service = new DraftValidationService(new ClaimTraceabilityService());
  });

  const validSource: Source = {
    id: 's_valid',
    addedAt: '2023-01-01',
    metadata: {
      title: 'Valid Physics Research',
      authors: ['Max Planck'],
      publicationYear: 2022,
      sourceType: 'journal_article',
      verificationStatus: 'verified'
    },
    provenance: {
      sourceProvider: 'Crossref',
      retrievalTimestamp: '2023-01-01',
      transformationHistory: []
    }
  };

  it('should validate a clean academic document with no errors', () => {
    const doc: AcademicDocument = {
      id: 'doc1',
      title: 'Quantum Mechanics',
      academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
      language: 'ckb',
      citationStyle: 'APA7',
      sections: [
        {
          id: 'sec1',
          sectionTitle: 'Intro',
          order: 1,
          paragraphs: [
            {
              id: 'p1',
              sectionId: 'sec1',
              text: 'Light consists of quanta.',
              claims: [
                {
                  claim: { id: 'c1', statement: 'Light is quantized.', status: 'supported' },
                  evidenceItems: [{
                    id: 'e1',
                    sourceId: 's_valid',
                    evidenceType: 'direct',
                    extractedSnippet: 'Energy occurs in discrete quanta.',
                    location: { page: '5' },
                    confidenceScore: 0.9,
                    verificationStatus: 'verified',
                    provenance: { sourceProvider: 'Crossref', retrievalTimestamp: '2023-01-01', transformationHistory: [] }
                  }],
                  source: validSource,
                  citation: {
                    citationId: 'cit1',
                    sourceId: 's_valid',
                    claimId: 'c1',
                    style: 'APA7',
                    locator: { page: '5' },
                    inTextParenthetical: '(Planck, 2022, p. 5)',
                    inTextNarrative: 'Planck (2022, p. 5)',
                    fullReferenceText: 'Planck, M. (2022). Valid Physics Research.',
                    validationStatus: 'valid',
                    provenance: { sourceId: 's_valid', citationStyle: 'APA7', generatedAt: '2023-01-01', formatterVersion: '1.0.0' }
                  },
                  status: 'supported'
                }
              ],
              citations: [],
              coverageMetrics: { totalClaims: 1, supportedClaims: 1, partiallySupportedClaims: 0, unsupportedClaims: 0, unverifiedClaims: 0, coverageScore: 100 },
              warnings: [],
              isVerifiedAcademicText: true
            }
          ]
        }
      ],
      sources: [validSource],
      claims: [],
      citations: [],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    const res = service.validateDraft(doc);
    expect(res.isValid).toBe(true);
    expect(res.status).toBe('valid');
    expect(res.errors.length).toBe(0);
  });

  it('should detect rejected sources and claims without evidence as errors', () => {
    const rejectedSource: Source = {
      ...validSource,
      id: 's_rej',
      metadata: { ...validSource.metadata, verificationStatus: 'rejected' }
    };

    const doc: AcademicDocument = {
      id: 'doc2',
      title: 'Bad Research',
      academicLevel: '🎓 زانکۆ - بەکالۆریۆس',
      language: 'ckb',
      citationStyle: 'APA7',
      sections: [
        {
          id: 'sec1',
          sectionTitle: 'Bad Section',
          order: 1,
          paragraphs: [
            {
              id: 'p2',
              sectionId: 'sec1',
              text: 'Fake claim text.',
              claims: [
                {
                  claim: { id: 'c2', statement: 'Fake claim', status: 'unsupported' },
                  evidenceItems: [], // No evidence
                  source: rejectedSource,
                  status: 'unsupported'
                }
              ],
              citations: [],
              coverageMetrics: { totalClaims: 1, supportedClaims: 0, partiallySupportedClaims: 0, unsupportedClaims: 1, unverifiedClaims: 0, coverageScore: 0 },
              warnings: [],
              isVerifiedAcademicText: false
            }
          ]
        }
      ],
      sources: [rejectedSource],
      claims: [],
      citations: [],
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    const res = service.validateDraft(doc);
    expect(res.isValid).toBe(false);
    expect(res.status).toBe('errors');
    expect(res.errors.some(e => e.includes('rejected source'))).toBe(true);
    expect(res.errors.some(e => e.includes('no associated evidence'))).toBe(true);
  });
});
