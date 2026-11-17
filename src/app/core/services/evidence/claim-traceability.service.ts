import { Injectable } from '@angular/core';
import { Claim, Evidence, Source, Citation } from '../../models/research.model';
import { ClaimTraceability, AcademicClaim } from '../../models/academic-writing.model';

@Injectable({
  providedIn: 'root'
})
export class ClaimTraceabilityService {
  /**
   * Generates a complete auditability traceability record for a claim.
   * Traceability chain: Claim -> Evidence -> Source -> Provider -> Original URL -> Verification Status
   */
  traceClaim(
    claim: Claim,
    evidenceItems: Evidence[],
    source?: Source,
    citation?: Citation
  ): ClaimTraceability {
    const notes: string[] = [];
    let isAuditable = true;

    // Primary evidence attached to claim
    const primaryEvidence = evidenceItems && evidenceItems.length > 0 ? evidenceItems[0] : undefined;

    if (!primaryEvidence) {
      isAuditable = false;
      notes.push('⚠️ No evidence linked to this claim.');
    } else {
      notes.push(`✓ Evidence snippet found (confidence: ${primaryEvidence.confidenceScore}).`);
    }

    if (!source) {
      isAuditable = false;
      notes.push('❌ Missing backing source record.');
    } else {
      if (source.metadata.verificationStatus === 'verified') {
        notes.push('✓ Backing source is fully verified.');
      } else if (source.metadata.verificationStatus === 'partially_verified') {
        notes.push('⚡ Backing source is partially verified.');
      } else {
        isAuditable = false;
        notes.push(`⚠️ Source verification status: ${source.metadata.verificationStatus}.`);
      }

      if (source.metadata.doi) {
        notes.push(`✓ Persistent DOI available: ${source.metadata.doi}`);
      }
    }

    const providerInfo = source?.provenance ? {
      providerName: source.provenance.sourceProvider,
      originalUrl: source.provenance.originalUrl || source.metadata.url,
      retrievalTimestamp: source.provenance.retrievalTimestamp
    } : undefined;

    if (!providerInfo || !providerInfo.providerName) {
      notes.push('⚠️ Source provenance missing database provider details.');
    }

    const citationInfo = citation ? {
      citationId: citation.citationId,
      style: citation.style,
      inTextParenthetical: citation.inTextParenthetical || citation.formattedText || '',
      fullReferenceText: citation.fullReferenceText || citation.formattedText || ''
    } : undefined;

    if (!citationInfo) {
      notes.push('⚠️ Citation has not been generated for this claim.');
    }

    return {
      claimId: claim.id,
      statement: claim.statement,
      claimStatus: claim.status,
      evidence: primaryEvidence ? {
        evidenceId: primaryEvidence.id,
        extractedSnippet: primaryEvidence.extractedSnippet,
        quotedText: primaryEvidence.quotedText,
        location: primaryEvidence.location,
        confidenceScore: primaryEvidence.confidenceScore
      } : undefined,
      source: source ? {
        sourceId: source.id,
        title: source.metadata.title,
        authors: source.metadata.authors,
        year: source.metadata.publicationYear,
        doi: source.metadata.doi,
        url: source.metadata.url,
        verificationStatus: source.metadata.verificationStatus
      } : undefined,
      provider: providerInfo,
      citation: citationInfo,
      isAuditable,
      traceabilityNotes: notes
    };
  }

  /**
   * Traces all claims in an AcademicClaim array and returns full traceability audit.
   */
  traceAcademicClaims(academicClaims: AcademicClaim[]): ClaimTraceability[] {
    return academicClaims.map(ac =>
      this.traceClaim(ac.claim, ac.evidenceItems, ac.source, ac.citation)
    );
  }
}
