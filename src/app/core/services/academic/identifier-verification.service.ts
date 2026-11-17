import { Injectable } from '@angular/core';

export interface IdentifierCheckResult {
  isValidSyntax: boolean;
  normalizedValue: string;
  type: 'doi' | 'isbn' | 'url' | 'provider_id';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class IdentifierVerificationService {

  validateAndNormalizeDoi(doi: string | undefined): IdentifierCheckResult {
    if (!doi || !doi.trim()) {
      return {
        isValidSyntax: false,
        normalizedValue: '',
        type: 'doi',
        message: 'DOI بەردەست نییە'
      };
    }

    const clean = doi.trim().replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    const doiRegex = /^10\.\d{4,9}\/[-._;()/:A-Za-z0-9]+$/;

    if (doiRegex.test(clean)) {
      return {
        isValidSyntax: true,
        normalizedValue: clean.toLowerCase(),
        type: 'doi',
        message: 'ڕێنوس (Syntax)ی DOI لەبار و دروستە'
      };
    }

    return {
      isValidSyntax: false,
      normalizedValue: clean,
      type: 'doi',
      message: 'ڕێنوسی DOI نادروستە'
    };
  }

  validateAndNormalizeIsbn(isbn: string | undefined): IdentifierCheckResult {
    if (!isbn || !isbn.trim()) {
      return {
        isValidSyntax: false,
        normalizedValue: '',
        type: 'isbn',
        message: 'ISBN بەردەست نییە'
      };
    }

    const clean = isbn.replace(/[-  ]/g, '').trim().toUpperCase();

    if (clean.length === 10) {
      const isValid = this.checkIsbn10Checksum(clean);
      return {
        isValidSyntax: isValid,
        normalizedValue: clean,
        type: 'isbn',
        message: isValid ? 'ڕێنوس و Checksumی ISBN-10 درستە' : 'ناوی کۆدی ISBN-10 نادروستە'
      };
    } else if (clean.length === 13) {
      const isValid = this.checkIsbn13Checksum(clean);
      return {
        isValidSyntax: isValid,
        normalizedValue: clean,
        type: 'isbn',
        message: isValid ? 'ڕێنوس و Checksumی ISBN-13 درستە' : 'ناوی کۆدی ISBN-13 نادروستە'
      };
    }

    return {
      isValidSyntax: false,
      normalizedValue: clean,
      type: 'isbn',
      message: 'درێژیی ژمارەی ISBN دەبێت 10 یان 13 پیت/ژمارە بێت'
    };
  }

  validateAndNormalizeUrl(url: string | undefined): IdentifierCheckResult {
    if (!url || !url.trim()) {
      return {
        isValidSyntax: false,
        normalizedValue: '',
        type: 'url',
        message: 'بەستەری URL بەردەست نییە'
      };
    }

    try {
      const parsed = new URL(url.trim());
      parsed.hash = ''; // normalize hash
      const normalized = parsed.toString().replace(/\/$/, '');
      return {
        isValidSyntax: true,
        normalizedValue: normalized,
        type: 'url',
        message: 'بەستەری URL لەبار و دروستە'
      };
    } catch {
      return {
        isValidSyntax: false,
        normalizedValue: url.trim(),
        type: 'url',
        message: 'پێکهاتەی بەستەری URL نادروستە'
      };
    }
  }

  normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private checkIsbn10Checksum(isbn10: string): boolean {
    if (!/^\d{9}[\dX]$/.test(isbn10)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(isbn10[i], 10) * (10 - i);
    }
    const lastChar = isbn10[9];
    sum += lastChar === 'X' ? 10 : parseInt(lastChar, 10);
    return sum % 11 === 0;
  }

  private checkIsbn13Checksum(isbn13: string): boolean {
    if (!/^\d{13}$/.test(isbn13)) return false;
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      const factor = i % 2 === 0 ? 1 : 3;
      sum += parseInt(isbn13[i], 10) * factor;
    }
    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === parseInt(isbn13[12], 10);
  }
}
