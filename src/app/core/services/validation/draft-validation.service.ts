import { Injectable } from '@angular/core';
import { AcademicDocument, DraftValidationResult, DraftValidationCheck } from '../../models/academic-writing.model';

@Injectable({
  providedIn: 'root'
})
export class DraftValidationService {
  /**
   * Performs deep structural, factual, and provenance validation on an AcademicDocument draft.
   */
  validateDraft(document: AcademicDocument): DraftValidationResult {
    const checksPassed: DraftValidationCheck[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    const sources = document.sources || [];

    // 1. Check: Unverified or rejected sources
    let unverifiedSourceCount = 0;
    let rejectedSourceCount = 0;
    for (const source of sources) {
      if (source.metadata.verificationStatus === 'rejected') {
        rejectedSourceCount++;
        errors.push(`Document contains rejected source: "${source.metadata.title}" (ID: ${source.id}).`);
      } else if (source.metadata.verificationStatus === 'unverified') {
        unverifiedSourceCount++;
        warnings.push(`Document contains unverified source: "${source.metadata.title}" (ID: ${source.id}).`);
      }
    }

    checksPassed.push({
      checkName: 'Source Verification Check',
      passed: rejectedSourceCount === 0,
      details: `${sources.length} total sources inspected. ${rejectedSourceCount} rejected, ${unverifiedSourceCount} unverified.`
    });

    // 2. Check: Broken Provenance
    let brokenProvenanceCount = 0;
    for (const source of sources) {
      if (!source.provenance || !source.provenance.sourceProvider || !source.provenance.retrievalTimestamp) {
        brokenProvenanceCount++;
        warnings.push(`Source "${source.metadata.title}" has incomplete provenance tracking.`);
      }
    }

    checksPassed.push({
      checkName: 'Source Provenance Integrity Check',
      passed: brokenProvenanceCount === 0,
      details: `${sources.length - brokenProvenanceCount}/${sources.length} sources have complete provenance.`
    });

    // 3. Inspect Paragraph Claims & Citations
    let totalClaimsCount = 0;
    let claimsWithoutEvidenceCount = 0;
    let missingCitationCount = 0;
    const seenCitationIds = new Set<string>();
    let duplicateCitationCount = 0;

    for (const sec of document.sections || []) {
      for (const para of sec.paragraphs || []) {
        for (const ac of para.claims || []) {
          totalClaimsCount++;

          // Claims with no evidence
          if (!ac.evidenceItems || ac.evidenceItems.length === 0) {
            claimsWithoutEvidenceCount++;
            errors.push(`Claim "${ac.claim.statement}" has no associated evidence items.`);
          }

          // Unsupported claims
          if (ac.status === 'unsupported') {
            warnings.push(`Claim "${ac.claim.statement}" is marked as unsupported.`);
          }

          // Missing citation
          if (!ac.citation) {
            missingCitationCount++;
            warnings.push(`Claim "${ac.claim.statement}" lacks a formatted citation.`);
          } else {
            // Duplicate citation check
            if (seenCitationIds.has(ac.citation.citationId)) {
              duplicateCitationCount++;
            } else {
              seenCitationIds.add(ac.citation.citationId);
            }

            // Mismatched source check
            if (ac.source && ac.citation.sourceId !== ac.source.id) {
              errors.push(`Citation source ID (${ac.citation.sourceId}) does not match claim source ID (${ac.source.id}).`);
            }
          }
        }
      }
    }

    checksPassed.push({
      checkName: 'Claims Evidence Linkage Check',
      passed: claimsWithoutEvidenceCount === 0,
      details: `${totalClaimsCount - claimsWithoutEvidenceCount}/${totalClaimsCount} claims have verified evidence.`
    });

    checksPassed.push({
      checkName: 'Citation Mapping Check',
      passed: missingCitationCount === 0 && duplicateCitationCount === 0,
      details: `${missingCitationCount} missing citations, ${duplicateCitationCount} duplicate citations detected.`
    });

    // Determine Status
    let status: 'valid' | 'warnings' | 'errors' = 'valid';
    if (errors.length > 0) {
      status = 'errors';
    } else if (warnings.length > 0) {
      status = 'warnings';
    }

    const isValid = errors.length === 0;

    return {
      status,
      isValid,
      checksPassed,
      warnings,
      errors,
      validatedAt: new Date().toISOString()
    };
  }
}
