import { TestBed } from '@angular/core/testing';
import { MetadataNormalizationService } from '../metadata-normalization.service';
import { IdentifierVerificationService } from '../identifier-verification.service';

describe('MetadataNormalizationService', () => {
  let service: MetadataNormalizationService;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      service = new MetadataNormalizationService(new IdentifierVerificationService());
    });
  });

  describe('DOI Normalization', () => {
    it('should normalize standard DOI URL to lowercase clean DOI', () => {
      const input = 'https://doi.org/10.1038/S41586-020-2003-7';
      const result = service.normalizeDoi(input);
      expect(result).toBe('10.1038/s41586-020-2003-7');
    });

    it('should return undefined for invalid DOI format', () => {
      const input = 'invalid_doi_string';
      const result = service.normalizeDoi(input);
      expect(result).toBeUndefined();
    });
  });

  describe('Author Normalization', () => {
    it('should parse "LastName, FirstName" into "FirstName LastName"', () => {
      const result = service.normalizeAuthorName('Smith, John');
      expect(result).toBe('John Smith');
    });

    it('should deduplicate and clean author array', () => {
      const authorsInput = [
        { given: 'John', family: 'Smith' },
        'Smith, John',
        'Alice Johnson'
      ];
      const result = service.normalizeAuthors(authorsInput);
      expect(result).toEqual(['John Smith', 'Alice Johnson']);
    });
  });

  describe('Title Normalization', () => {
    it('should strip HTML tags and normalize extra whitespace', () => {
      const rawTitle = '  <i>Quantum</i>  Computing   in <b>2026</b> ';
      const result = service.normalizeTitle(rawTitle);
      expect(result).toBe('Quantum Computing in 2026');
    });
  });

  describe('Publication Year Normalization', () => {
    it('should validate valid historical and recent years', () => {
      expect(service.normalizeYear(2024)).toBe(2024);
      expect(service.normalizeYear('1999')).toBe(1999);
      expect(service.normalizeYear(1400)).toBeUndefined();
    });
  });
});
