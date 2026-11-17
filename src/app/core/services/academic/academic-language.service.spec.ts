import { AcademicLanguageService } from '../academic-language.service';
import { AcademicParagraph } from '../../models/academic-writing.model';
import { Citation } from '../../models/research.model';

describe('AcademicLanguageService', () => {
  let service: AcademicLanguageService;

  beforeEach(() => {
    service = new AcademicLanguageService();
  });

  const sampleCitation: Citation = {
    citationId: 'cit_1',
    sourceId: 'src_1',
    style: 'APA7',
    locator: { page: '42' },
    inTextParenthetical: '(Einstein, 2023, p. 42)',
    inTextNarrative: 'Einstein (2023, p. 42)',
    fullReferenceText: 'Einstein, A. (2023). Physics Review.',
    validationStatus: 'valid',
    provenance: {
      sourceId: 'src_1',
      citationStyle: 'APA7',
      generatedAt: '2023-01-01',
      formatterVersion: '1.0.0'
    }
  };

  it('should polish paragraph tone while preserving in-text citations', () => {
    const paragraph: AcademicParagraph = {
      id: 'p1',
      sectionId: 'sec1',
      text: 'ئەمە وایە کە نووسینی زانستی پێویستی بە بەڵگەیە.',
      claims: [],
      citations: [sampleCitation],
      coverageMetrics: { totalClaims: 0, supportedClaims: 0, partiallySupportedClaims: 0, unsupportedClaims: 0, unverifiedClaims: 0, coverageScore: 0 },
      warnings: [],
      isVerifiedAcademicText: true
    };

    const res = service.polishAcademicParagraph(paragraph, 'ckb', '🎓 زانکۆ - بەکالۆریۆس');

    expect(res.citationsPreserved).toBe(true);
    expect(res.text).toContain('(Einstein, 2023, p. 42)');
    expect(res.text).not.toContain('ئەمە وایە کە'); // Informal filler removed
  });

  it('should verify metadata preservation during multilingual transformation', () => {
    const sourceText = 'The quantum effect is significant (Einstein, 2023, p. 42).';
    const check = service.preserveAcademicMetadataInTranslation(
      sourceText,
      [sampleCitation]
    );

    expect(check.verifiedMetadataIntegrity).toBe(true);
    expect(check.safeText).toContain('(Einstein, 2023, p. 42)');
  });
});
