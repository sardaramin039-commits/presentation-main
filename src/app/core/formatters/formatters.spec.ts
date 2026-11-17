import { APA7Formatter } from './apa7-formatter';
import { MLA9Formatter } from './mla9-formatter';
import { ChicagoAuthorDateFormatter } from './chicago-author-date-formatter';
import { ChicagoNotesFormatter } from './chicago-notes-formatter';
import { HarvardFormatter } from './harvard-formatter';
import { IEEEFormatter } from './ieee-formatter';
import { CitationContext, Source } from '../models/research.model';

describe('Citation Formatters Suite', () => {
  const fullSource: Source = {
    id: 'src_full',
    addedAt: new Date().toISOString(),
    metadata: {
      title: 'Quantum Machine Learning Frontiers',
      authors: ['Alan Turing', 'Ada Lovelace'],
      publicationYear: 2024,
      journal: 'Journal of Artificial Intelligence',
      volume: '42',
      issue: '3',
      pages: '101-115',
      publisher: 'Academic Press',
      doi: '10.1016/j.jai.2024.01.001',
      sourceType: 'journal_article',
      verificationStatus: 'verified'
    },
    provenance: {
      sourceProvider: 'Crossref',
      retrievalTimestamp: new Date().toISOString(),
      transformationHistory: []
    }
  };

  const missingAuthorYearSource: Source = {
    id: 'src_missing',
    addedAt: new Date().toISOString(),
    metadata: {
      title: 'Anonymous Treatise on Computing',
      authors: [],
      journal: 'Archive of Computing',
      sourceType: 'journal_article',
      verificationStatus: 'partially_verified'
    },
    provenance: {
      sourceProvider: 'Manual',
      retrievalTimestamp: new Date().toISOString(),
      transformationHistory: []
    }
  };

  const contextFull: CitationContext = {
    source: fullSource,
    locator: { page: '105' },
    citationNumber: 1
  };

  const contextMissing: CitationContext = {
    source: missingAuthorYearSource,
    citationNumber: 2
  };

  describe('APA 7 Formatter', () => {
    const formatter = new APA7Formatter();

    it('should format full source parenthetical citation', () => {
      const res = formatter.formatInTextParenthetical(contextFull);
      expect(res).toBe('(Turing & Lovelace, 2024, p. 105)');
    });

    it('should format full source narrative citation', () => {
      const res = formatter.formatInTextNarrative(contextFull);
      expect(res).toBe('Turing and Lovelace (2024, p. 105)');
    });

    it('should format full reference with DOI', () => {
      const res = formatter.formatReference(contextFull);
      expect(res).toContain('Turing, A., & Lovelace, A.');
      expect(res).toContain('(2024).');
      expect(res).toContain('Quantum Machine Learning Frontiers.');
      expect(res).toContain('*Journal of Artificial Intelligence*');
      expect(res).toContain('https://doi.org/10.1016/j.jai.2024.01.001');
    });

    it('should handle missing author and year gracefully with n.d. and title', () => {
      const res = formatter.formatInTextParenthetical(contextMissing);
      expect(res).toBe('("Anonymous Treatise on Computing", n.d.)');
    });
  });

  describe('MLA 9 Formatter', () => {
    const formatter = new MLA9Formatter();

    it('should format full source parenthetical citation', () => {
      const res = formatter.formatInTextParenthetical(contextFull);
      expect(res).toBe('(Turing and Lovelace 105)');
    });

    it('should format full reference', () => {
      const res = formatter.formatReference(contextFull);
      expect(res).toContain('Turing, Alan, and Ada Lovelace.');
      expect(res).toContain('"Quantum Machine Learning Frontiers."');
      expect(res).toContain('vol. 42, no. 3');
      expect(res).toContain('pp. 101-115');
    });
  });

  describe('Chicago Author-Date Formatter', () => {
    const formatter = new ChicagoAuthorDateFormatter();

    it('should format parenthetical citation', () => {
      const res = formatter.formatInTextParenthetical(contextFull);
      expect(res).toBe('(Turing and Lovelace 2024, 105)');
    });

    it('should format reference', () => {
      const res = formatter.formatReference(contextFull);
      expect(res).toContain('Turing, Alan, and Ada Lovelace. 2024.');
      expect(res).toContain('"Quantum Machine Learning Frontiers."');
    });
  });

  describe('Chicago Notes Formatter', () => {
    const formatter = new ChicagoNotesFormatter();

    it('should format footnote', () => {
      const res = formatter.formatFootnote(contextFull);
      expect(res).toContain('1. Alan Turing and Ada Lovelace');
      expect(res).toContain('"Quantum Machine Learning Frontiers,"');
      expect(res).toContain('105');
    });
  });

  describe('Harvard Formatter', () => {
    const formatter = new HarvardFormatter();

    it('should format parenthetical citation', () => {
      const res = formatter.formatInTextParenthetical(contextFull);
      expect(res).toBe('(Turing and Lovelace, 2024, p. 105)');
    });

    it('should format reference', () => {
      const res = formatter.formatReference(contextFull);
      expect(res).toContain('Turing, A., and Lovelace, A. (2024)');
      expect(res).toContain('\'Quantum Machine Learning Frontiers\'.');
    });
  });

  describe('IEEE Formatter', () => {
    const formatter = new IEEEFormatter();

    it('should format numeric in-text citation', () => {
      const res = formatter.formatInTextNumeric(contextFull);
      expect(res).toBe('[1, p. 105]');
    });

    it('should format reference', () => {
      const res = formatter.formatReference(contextFull);
      expect(res).toContain('[1] A. Turing and A. Lovelace');
      expect(res).toContain('"Quantum Machine Learning Frontiers,"');
      expect(res).toContain('vol. 42, no. 3');
      expect(res).toContain('doi: 10.1016/j.jai.2024.01.001');
    });
  });
});
