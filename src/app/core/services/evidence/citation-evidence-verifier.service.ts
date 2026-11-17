import { Injectable, inject } from '@angular/core';
import { Citation, Source } from '../../models/research.model';
import { SelectedEvidenceItem } from '../../models/evidence.model';
import { ExtractedClaim } from '../../models/claim.model';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

export interface CitationVerificationReport {
  citationId: string;
  sourceId: string;
  sourceTitle: string;
  hasValidSource: boolean;
  hasVerifiedEvidence: boolean;
  hasLocator: boolean;
  isFullyGroundable: boolean;
  warnings: string[];
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class CitationEvidenceVerifierService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Verifies strict citation traceability: Claim -> Citation -> Source -> Evidence -> Exact Locator
   */
  public verifyCitations(
    citations: Citation[],
    sources: Source[],
    evidenceList: SelectedEvidenceItem[],
    claims: ExtractedClaim[] = []
  ): CitationVerificationReport[] {
    if (!citations || citations.length === 0) {
      return [];
    }

    return citations.map(cit => {
      const warnings: string[] = [];
      const errors: string[] = [];

      // 1. Verify Source Existence
      const matchedSource = sources.find(s => s.id === cit.sourceId);
      const hasValidSource = !!matchedSource;
      if (!hasValidSource) {
        errors.push(`Citing unknown source ID '${cit.sourceId}' with no record in workspace database.`);
      }

      // 2. Verify Evidence Grounding
      const matchedEvidence = evidenceList.filter(e => e.sourceId === cit.sourceId);
      const hasVerifiedEvidence = matchedEvidence.some(e => e.verificationStatus === 'verified' || e.confidenceScore > 50);
      if (!hasVerifiedEvidence) {
        warnings.push(`Citation for '${matchedSource?.metadata.title || cit.sourceId}' has no verified direct evidence snippet.`);
      }

      // 3. Verify Claim Grounding
      if (claims.length > 0 && !claims.some(c => c.evidenceIds?.some((eid: string) => matchedEvidence.some(me => me.id === eid)))) {
        warnings.push(`Citation for '${matchedSource?.metadata.title || cit.sourceId}' is not linked to an extracted claim.`);
      }

      // 3. Verify Exact Locator (Page, Section)
      const locator = cit.locator || matchedEvidence[0]?.locator;
      const hasLocator = !!(locator && (locator.page || locator.section || locator.paragraph));
      if (!hasLocator) {
        warnings.push(`Citation missing exact page/section locator (Defaulting to general source reference).`);
      }

      const isFullyGroundable = hasValidSource && hasVerifiedEvidence;

      this.provenanceService.createChain(
        'citation_verification',
        `Verified citation '${cit.citationId}': Groundable=${isFullyGroundable}, HasLocator=${hasLocator}`,
        { sourceId: cit.sourceId, citationId: cit.citationId }
      );

      return {
        citationId: cit.citationId,
        sourceId: cit.sourceId,
        sourceTitle: matchedSource?.metadata.title || 'سەرچاوەی نادیار',
        hasValidSource,
        hasVerifiedEvidence,
        hasLocator,
        isFullyGroundable,
        warnings,
        errors
      };
    });
  }
}
