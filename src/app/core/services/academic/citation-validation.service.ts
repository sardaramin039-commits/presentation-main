import { Injectable } from '@angular/core';
import {
  Citation,
  CitationValidationResult,
  CitationValidationStatus,
  Source,
  Claim,
  Evidence
} from '../../models/research.model';

@Injectable({
  providedIn: 'root'
})
export class CitationValidationService {

  validateCitation(
    citation: Citation,
    source?: Source,
    claim?: Claim,
    evidence?: Evidence
  ): CitationValidationResult {
    const checksPassed: string[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];
    const now = new Date().toISOString();

    // 1. Source existence check
    if (!source) {
      errors.push(`Source with ID [${citation.sourceId}] does not exist.`);
    } else {
      checksPassed.push('SOURCE_EXISTS');

      // 2. Source ID match check
      if (source.id !== citation.sourceId) {
        errors.push(`Source ID mismatch: expected [${citation.sourceId}], found [${source.id}].`);
      } else {
        checksPassed.push('SOURCE_ID_MATCHED');
      }

      // 3. Rejected source check
      if (source.metadata.verificationStatus === 'rejected') {
        errors.push(`Source [${source.id}] has status 'rejected' and cannot produce valid citations.`);
      } else {
        checksPassed.push('SOURCE_NOT_REJECTED');
      }

      // 4. Metadata completeness check
      if (!source.metadata.title) {
        errors.push(`Source [${source.id}] is missing a title.`);
      } else {
        checksPassed.push('METADATA_TITLE_PRESENT');
      }

      if (!source.metadata.authors || source.metadata.authors.length === 0) {
        warnings.push(`Source [${source.id}] has no authors listed.`);
      } else {
        checksPassed.push('METADATA_AUTHORS_PRESENT');
      }

      if (!source.metadata.publicationYear) {
        warnings.push(`Source [${source.id}] has no publication year listed.`);
      } else {
        checksPassed.push('METADATA_YEAR_PRESENT');
      }
    }

    // 5. Claim & Evidence link check
    if (citation.claimId) {
      if (!claim) {
        warnings.push(`Claim ID [${citation.claimId}] referenced in citation but claim object not provided.`);
      } else {
        checksPassed.push('CLAIM_LINK_VERIFIED');
      }
    }

    if (citation.evidenceId) {
      if (!evidence) {
        warnings.push(`Evidence ID [${citation.evidenceId}] referenced in citation but evidence object not provided.`);
      } else {
        checksPassed.push('EVIDENCE_LINK_VERIFIED');
        if (evidence.sourceId !== citation.sourceId) {
          errors.push(`Evidence sourceId [${evidence.sourceId}] does not match citation sourceId [${citation.sourceId}].`);
        } else {
          checksPassed.push('EVIDENCE_SOURCE_MATCHED');
        }
      }
    }

    // 6. Citation text integrity
    if (!citation.fullReferenceText || citation.fullReferenceText.trim().length < 5) {
      errors.push('Full reference text is missing or invalid.');
    } else {
      checksPassed.push('REFERENCE_TEXT_VALID');
    }

    // 7. Provenance check
    if (!citation.provenance || !citation.provenance.sourceId || !citation.provenance.generatedAt) {
      errors.push('Citation is missing complete provenance tracking records.');
    } else {
      checksPassed.push('PROVENANCE_TRACKED');
    }

    // Determine final ValidationStatus
    let status: CitationValidationStatus = 'valid';

    if (errors.length > 0) {
      status = 'invalid';
    } else if (source && source.metadata.verificationStatus === 'unverified') {
      status = 'unverified';
      warnings.push('Citation derived from an unverified source.');
    } else if (source && source.metadata.verificationStatus === 'partially_verified') {
      status = 'partially_valid';
      warnings.push('Citation derived from a partially verified source.');
    } else if (warnings.length > 0) {
      status = 'partially_valid';
    } else {
      status = 'valid';
    }

    return {
      citationId: citation.citationId,
      status,
      isValid: status === 'valid' || status === 'partially_valid',
      checksPassed,
      warnings,
      errors,
      validatedAt: now
    };
  }
}
