import { Injectable } from '@angular/core';
import { Source, Evidence, Claim } from '../../models/research.model';
import { EvidenceAssessment, EvidenceAssessmentType } from '../../models/fact-check.model';

@Injectable({
  providedIn: 'root'
})
export class EvidenceComparisonService {
  /**
   * Assesses an evidence item against a claim and its source context.
   * Strictly respects rules:
   * - NEWER != ALWAYS MORE CORRECT
   * - HIGHER RANK != AUTOMATICALLY TRUE
   * - DOI != PROOF OF CLAIM
   */
  assessEvidence(
    claim: Claim,
    evidence: Evidence,
    source?: Source
  ): EvidenceAssessment {
    const isDirect = this.checkDirectness(claim, evidence);
    const hasLoc = this.checkLocatorAvailability(evidence);
    const provComplete = this.checkProvenanceCompleteness(evidence, source);

    // Determine evidence assessment type
    const type = this.determineAssessmentType(claim, evidence, source);

    // Calculate relevance score (0-100) based on directness and topic alignment
    let relevanceScore = isDirect ? 90 : 60;
    if (evidence.extractedSnippet.toLowerCase().includes(claim.statement.toLowerCase().substring(0, 15))) {
      relevanceScore += 10;
    }
    relevanceScore = Math.min(100, relevanceScore);

    // Calculate confidence score (0-100)
    // Note: Source rank/DOI/date are factors, but DOI is NOT proof, higher rank is NOT truth, newer is NOT always correct.
    let confidenceScore = 50;

    if (hasLoc) confidenceScore += 15;
    if (provComplete) confidenceScore += 15;
    if (source && source.metadata.verificationStatus === 'verified') confidenceScore += 10;

    // Penalty if source rejected
    if (source && source.metadata.verificationStatus === 'rejected') {
      confidenceScore = Math.max(10, confidenceScore - 40);
    }

    confidenceScore = Math.min(100, confidenceScore);

    const assessmentReason = this.buildReasoning(
      type,
      isDirect,
      hasLoc,
      provComplete,
      source
    );

    return {
      evidence,
      source,
      type,
      relevanceScore,
      confidenceScore,
      assessmentReason,
      isDirectEvidence: isDirect,
      hasLocator: hasLoc,
      provenanceComplete: provComplete
    };
  }

  /**
   * Checks if evidence directly addresses the claim or if it is indirect/contextual.
   */
  private checkDirectness(claim: Claim, evidence: Evidence): boolean {
    if (!evidence.extractedSnippet || !claim.statement) return false;

    const claimKeywords = claim.statement
      .toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 4);

    if (claimKeywords.length === 0) return true;

    const matches = claimKeywords.filter(kw => evidence.extractedSnippet.toLowerCase().includes(kw));
    return matches.length / claimKeywords.length >= 0.5;
  }

  /**
   * Checks if specific locator metadata (page, section, paragraph) is available.
   */
  private checkLocatorAvailability(evidence: Evidence): boolean {
    if (!evidence.location) return false;
    const { page, section, paragraph } = evidence.location;
    return !!(page || section || paragraph);
  }

  /**
   * Checks if full provenance tracking is present.
   */
  private checkProvenanceCompleteness(evidence: Evidence, source?: Source): boolean {
    if (!source || !source.provenance) return false;
    return !!(source.provenance.sourceProvider && source.provenance.retrievalTimestamp);
  }

  private determineAssessmentType(
    claim: Claim,
    evidence: Evidence,
    source?: Source
  ): EvidenceAssessmentType {
    if (!evidence.extractedSnippet || evidence.extractedSnippet.trim().length < 10) {
      return 'insufficient';
    }

    if (source && source.metadata.verificationStatus === 'rejected') {
      return 'insufficient';
    }

    const snippetLower = evidence.extractedSnippet.toLowerCase();

    // Contradicting indicators
    if (
      snippetLower.includes('does not') ||
      snippetLower.includes('refutes') ||
      snippetLower.includes('contradicts') ||
      snippetLower.includes('نەخێر') ||
      snippetLower.includes('نەسەلمێنراوە')
    ) {
      return 'contradicting';
    }

    // Supporting indicators
    if (
      snippetLower.includes('supports') ||
      snippetLower.includes('confirms') ||
      snippetLower.includes('demonstrates') ||
      snippetLower.includes('سەلمێنراوە') ||
      snippetLower.includes('دەسەلمێنێت') ||
      this.checkDirectness(claim, evidence)
    ) {
      return 'supporting';
    }

    return 'contextual';
  }

  private buildReasoning(
    type: EvidenceAssessmentType,
    isDirect: boolean,
    hasLocator: boolean,
    provenanceComplete: boolean,
    source?: Source
  ): string {
    const parts: string[] = [`Assessment: ${type}.`];
    parts.push(isDirect ? 'Evidence directly addresses claim assertions.' : 'Evidence provides indirect/contextual framing.');
    parts.push(hasLocator ? 'Precise locator (page/section) present.' : 'Locator missing precise page/section.');
    parts.push(provenanceComplete ? 'Complete provenance metadata attached.' : 'Incomplete provenance tracking.');

    if (source?.metadata.doi) {
      parts.push('DOI provided (note: DOI verifies publication index, not factual veracity).');
    }

    return parts.join(' ');
  }
}
