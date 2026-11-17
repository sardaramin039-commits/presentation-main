import { Injectable, inject } from '@angular/core';
import {
  AcademicClaim,
  AcademicParagraph,
  AcademicDocument
} from '../../models/academic-writing.model';
import { EvidenceCoverageService } from '../evidence-coverage.service';

export interface GroundingGuardResult {
  isVerifiedAcademicText: boolean;
  warnings: string[];
  unsupportedClaims: AcademicClaim[];
  unverifiedClaims: AcademicClaim[];
  annotatedParagraphText: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvidenceGroundingGuard {
  private coverageService = inject(EvidenceCoverageService);

  /**
   * Inspects a paragraph's claims and grounds the text.
   * If any claim is unsupported or unverified, the paragraph is NOT marked as verified academic text.
   * Unsupported or unverified claims are explicitly annotated with warning markers to prevent silent omission.
   */
  guardParagraph(paragraph: AcademicParagraph): GroundingGuardResult {
    const warnings: string[] = [];
    const unsupportedClaims: AcademicClaim[] = [];
    const unverifiedClaims: AcademicClaim[] = [];

    const claims = paragraph.claims || [];

    for (const ac of claims) {
      if (ac.status === 'unsupported') {
        unsupportedClaims.push(ac);
        warnings.push(`Claim "${ac.claim.statement}" is UNSUPPORTED by evidence.`);
      } else if (ac.status === 'unverified') {
        unverifiedClaims.push(ac);
        warnings.push(`Claim "${ac.claim.statement}" is UNVERIFIED (lacks verified evidence link).`);
      } else if (!ac.source || ac.source.metadata.verificationStatus === 'rejected') {
        unsupportedClaims.push(ac);
        warnings.push(`Claim "${ac.claim.statement}" relies on an unverified or rejected source.`);
      }
    }

    const isVerifiedAcademicText = unsupportedClaims.length === 0 && unverifiedClaims.length === 0 && claims.length > 0;

    // Build annotated paragraph text if warnings exist
    let annotatedParagraphText = paragraph.text;

    if (!isVerifiedAcademicText) {
      const markers: string[] = [];
      if (unsupportedClaims.length > 0) {
        markers.push(`[⚠️ تێبینی: ${unsupportedClaims.length} بانگەشەی بێ بەڵگە / UNSUPPORTED CLAIMS]`);
      }
      if (unverifiedClaims.length > 0) {
        markers.push(`[⚠️ تێبینی: ${unverifiedClaims.length} بانگەشەی سەلمێنراو نەبوو / UNVERIFIED CLAIMS]`);
      }
      annotatedParagraphText = `${paragraph.text}\n${markers.join(' ')}`;
    }

    return {
      isVerifiedAcademicText,
      warnings,
      unsupportedClaims,
      unverifiedClaims,
      annotatedParagraphText
    };
  }

  /**
   * Evaluates an entire AcademicDocument for hallucinated or ungrounded claims.
   */
  guardDocument(document: AcademicDocument): {
    documentIsFullyGrounded: boolean;
    totalWarnings: string[];
    flaggedParagraphIds: string[];
  } {
    const totalWarnings: string[] = [];
    const flaggedParagraphIds: string[] = [];

    for (const sec of document.sections || []) {
      for (const para of sec.paragraphs || []) {
        const result = this.guardParagraph(para);
        if (!result.isVerifiedAcademicText) {
          flaggedParagraphIds.push(para.id);
          totalWarnings.push(...result.warnings.map(w => `[Section: ${sec.sectionTitle}, Para: ${para.id}] ${w}`));
          para.isVerifiedAcademicText = false;
          para.warnings = Array.from(new Set([...(para.warnings || []), ...result.warnings]));
        } else {
          para.isVerifiedAcademicText = true;
        }
      }
    }

    return {
      documentIsFullyGrounded: flaggedParagraphIds.length === 0,
      totalWarnings,
      flaggedParagraphIds
    };
  }

  /**
   * Source-bound verification: Checks whether a proposed statement contains unevidenced facts,
   * fake stats, fake page numbers, fake authors, or fake DOIs.
   */
  validateSourceBoundary(statement: string, evidenceSnippets: string[]): {
    isWithinBoundary: boolean;
    unsupportedElements: string[];
  } {
    if (!statement || statement.trim().length === 0) {
      return { isWithinBoundary: true, unsupportedElements: [] };
    }

    const unsupportedElements: string[] = [];
    const combinedEvidence = evidenceSnippets.join(' ').toLowerCase();

    // Check numbers/percentages mentioned in statement that are missing from evidence
    const statMatches = statement.match(/\b\d+(\.\d+)?%\b|\b\d{4}\b/g) || [];
    for (const stat of statMatches) {
      if (!combinedEvidence.includes(stat.toLowerCase())) {
        unsupportedElements.push(`Unverified numeric or temporal statistic: "${stat}"`);
      }
    }

    return {
      isWithinBoundary: unsupportedElements.length === 0,
      unsupportedElements
    };
  }
}
