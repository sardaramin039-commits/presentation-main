import { Injectable, InjectionToken, inject } from '@angular/core';
import {
  Source,
  SourceVerificationStatus,
  VerificationResult,
  VerificationCheck,
  FieldVerification,
  FieldVerificationStatus
} from '../../models/research.model';
import { IdentifierVerificationService } from '../identifier-verification.service';

export interface ExternalVerificationProvider {
  readonly providerName: string;
  verifySource(source: Source): Promise<VerificationResult | null>;
}

export const EXTERNAL_VERIFICATION_PROVIDERS = new InjectionToken<ExternalVerificationProvider[]>(
  'EXTERNAL_VERIFICATION_PROVIDERS'
);

@Injectable({
  providedIn: 'root'
})
export class SourceVerificationService {
  private identifierService = inject(IdentifierVerificationService);
  private externalProvidersToken = inject(EXTERNAL_VERIFICATION_PROVIDERS, { optional: true });
  private externalProviders: ExternalVerificationProvider[] = this.externalProvidersToken ? [...this.externalProvidersToken] : [];

  registerExternalProvider(provider: ExternalVerificationProvider): void {
    if (!this.externalProviders.some(p => p.providerName === provider.providerName)) {
      this.externalProviders.push(provider);
    }
  }

  async verifySource(source: Source): Promise<VerificationResult> {
    const meta = source.metadata;
    const checks: VerificationCheck[] = [];
    const fieldVerifications: FieldVerification[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    // 1. Title Verification Check
    const titleStatus = this.checkTitle(meta.title, checks, errors);
    fieldVerifications.push({ fieldName: 'title', status: titleStatus });

    // 2. Authors Verification Check
    const authorStatus = this.checkAuthors(meta.authors, checks, warnings);
    fieldVerifications.push({ fieldName: 'authors', status: authorStatus });

    // 3. Publication Year Check
    const yearStatus = this.checkPublicationYear(meta.publicationYear, checks, warnings);
    fieldVerifications.push({ fieldName: 'publicationYear', status: yearStatus });

    // 4. DOI Identifier Verification Check
    let doiStatus: FieldVerificationStatus = 'unverified';
    if (meta.doi) {
      const doiCheck = this.identifierService.validateAndNormalizeDoi(meta.doi);
      if (doiCheck.isValidSyntax) {
        doiStatus = 'partially_verified'; // Syntax valid, awaiting external registry lookup
        checks.push({
          checkName: 'DOI Syntax Check',
          passed: true,
          score: 0.9,
          message: doiCheck.message
        });
      } else {
        doiStatus = 'rejected';
        errors.push(doiCheck.message);
        checks.push({
          checkName: 'DOI Syntax Check',
          passed: false,
          score: 0,
          message: doiCheck.message
        });
      }
    }
    fieldVerifications.push({ fieldName: 'doi', status: doiStatus });

    // 5. ISBN Identifier Verification Check
    let isbnStatus: FieldVerificationStatus = 'unverified';
    if (meta.isbn) {
      const isbnCheck = this.identifierService.validateAndNormalizeIsbn(meta.isbn);
      if (isbnCheck.isValidSyntax) {
        isbnStatus = 'partially_verified';
        checks.push({
          checkName: 'ISBN Checksum Check',
          passed: true,
          score: 0.9,
          message: isbnCheck.message
        });
      } else {
        isbnStatus = 'rejected';
        errors.push(isbnCheck.message);
        checks.push({
          checkName: 'ISBN Checksum Check',
          passed: false,
          score: 0,
          message: isbnCheck.message
        });
      }
    }
    fieldVerifications.push({ fieldName: 'isbn', status: isbnStatus });

    // 6. URL Verification Check
    let urlStatus: FieldVerificationStatus = 'unverified';
    if (meta.url) {
      const urlCheck = this.identifierService.validateAndNormalizeUrl(meta.url);
      if (urlCheck.isValidSyntax) {
        urlStatus = 'partially_verified';
        checks.push({
          checkName: 'URL Syntax Check',
          passed: true,
          score: 0.8,
          message: urlCheck.message
        });
      } else {
        urlStatus = 'rejected';
        errors.push(urlCheck.message);
        checks.push({
          checkName: 'URL Syntax Check',
          passed: false,
          score: 0,
          message: urlCheck.message
        });
      }
    }
    fieldVerifications.push({ fieldName: 'url', status: urlStatus });

    // 7. External Verification Providers Call (if registered)
    let externalProviderUsed = 'Internal Field Verification Engine';
    if (this.externalProviders.length > 0) {
      for (const provider of this.externalProviders) {
        try {
          const extResult = await provider.verifySource(source);
          if (extResult) {
            externalProviderUsed = provider.providerName;
            checks.push(...extResult.checks);
            warnings.push(...extResult.warnings);
            errors.push(...extResult.errors);
          }
        } catch {
          warnings.push(`شکست لە پەیوەندی بە دابینکەری تاقیکردنەوەی دەرەکی: ${provider.providerName}`);
        }
      }
    } else {
      checks.push({
        checkName: 'External Registry Lookup',
        passed: false,
        score: 0.5,
        message: 'هیچ دابینکەرێکی دەرەکی (کپ وەک Crossref) تۆمار نەکراوە؛ تاقیکردنەوە لەسەر بنەمای زانیارییە نافەرمییە ناوخۆییەکان جێبەجێ کرا (Unverified/Partially Verified).'
      });
    }

    // Determine Overall Verification Status Deterministically
    const overallStatus = this.determineOverallStatus(fieldVerifications, errors);

    // Calculate confidence score (0.0 to 1.0)
    const passedChecks = checks.filter(c => c.passed);
    const confidence = checks.length > 0
      ? Number((passedChecks.reduce((acc, c) => acc + c.score, 0) / checks.length).toFixed(2))
      : 0.5;

    return {
      sourceId: source.id,
      status: overallStatus,
      verifiedAt: new Date().toISOString(),
      verificationProvider: externalProviderUsed,
      checks,
      fieldVerifications,
      confidence,
      warnings,
      errors
    };
  }

  private checkTitle(title: string | undefined, checks: VerificationCheck[], errors: string[]): FieldVerificationStatus {
    if (!title || !title.trim()) {
      errors.push('ناونیشانی سەرچاوە بونی نییە');
      checks.push({ checkName: 'Title Presence', passed: false, score: 0, message: 'ناونیشان نییە' });
      return 'rejected';
    }
    if (title.trim().length < 4 || title.toLowerCase().includes('untitled')) {
      errors.push('ناونیشانی سەرچاوە ناتەواوە یان نەناسراوە');
      checks.push({ checkName: 'Title Validity', passed: false, score: 0.2, message: 'ناونیشانی گوماناوی' });
      return 'unverified';
    }
    checks.push({ checkName: 'Title Validity', passed: true, score: 1.0, message: 'ناونیشانی گونجاو' });
    return 'verified';
  }

  private checkAuthors(authors: string[] | undefined, checks: VerificationCheck[], warnings: string[]): FieldVerificationStatus {
    if (!authors || authors.length === 0) {
      warnings.push('ناوی نووسەران بەردەست نییە');
      checks.push({ checkName: 'Author Presence', passed: false, score: 0.3, message: 'نووسەر نییە' });
      return 'unverified';
    }
    const validAuthors = authors.filter(a => a && a.trim().length > 1 && a.toLowerCase() !== 'unknown');
    if (validAuthors.length === 0) {
      warnings.push('ناوی نووسەران نەناسراوە');
      checks.push({ checkName: 'Author Validity', passed: false, score: 0.3, message: 'نووسەری نەناسراو' });
      return 'unverified';
    }
    checks.push({ checkName: 'Author Validity', passed: true, score: 1.0, message: `${validAuthors.length} نووسەری دیاریکراو` });
    return 'verified';
  }

  private checkPublicationYear(year: number | undefined, checks: VerificationCheck[], warnings: string[]): FieldVerificationStatus {
    const currentYear = new Date().getFullYear();
    if (!year) {
      warnings.push('ساڵی بڵاوکردنەوە دیارینەکراوە');
      checks.push({ checkName: 'Publication Year Presence', passed: false, score: 0.4, message: 'ساڵ بێ بەشە' });
      return 'unverified';
    }
    if (year < 1500 || year > currentYear) {
      warnings.push(`ساڵی بڵاوکردنەوە (${year}) لە دەرەوەی سنوری زانستی ئاساییە`);
      checks.push({ checkName: 'Publication Year Range', passed: false, score: 0.2, message: 'ساڵی نائاسایی' });
      return 'unverified';
    }
    checks.push({ checkName: 'Publication Year Range', passed: true, score: 1.0, message: `ساڵی دیاریکراو: ${year}` });
    return 'verified';
  }

  private determineOverallStatus(
    fieldVerifications: FieldVerification[],
    errors: string[]
  ): SourceVerificationStatus {
    if (errors.length > 0 && fieldVerifications.some(f => f.status === 'rejected')) {
      const titleStatus = fieldVerifications.find(f => f.fieldName === 'title')?.status;
      if (titleStatus === 'rejected') {
        return 'rejected';
      }
    }

    const verifiedFields = fieldVerifications.filter(f => f.status === 'verified').length;
    const partiallyVerifiedFields = fieldVerifications.filter(f => f.status === 'partially_verified').length;

    if (verifiedFields >= 3 && fieldVerifications.some(f => f.status === 'partially_verified' || f.status === 'verified' && (f.fieldName === 'doi' || f.fieldName === 'isbn'))) {
      return 'verified';
    }

    if (verifiedFields >= 2 || partiallyVerifiedFields >= 1) {
      return 'partially_verified';
    }

    return 'unverified';
  }
}
