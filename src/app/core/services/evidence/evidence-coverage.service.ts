import { Injectable } from '@angular/core';
import { ExtractedClaim } from '../../models/claim.model';
import { SelectedEvidenceItem } from '../../models/evidence.model';
import { ClaimEntailmentResult } from '../../models/entailment.model';
import { ContradictionItem } from '../../models/contradiction.model';
import { Source } from '../../models/research.model';
import { EvidenceCoverageMetrics, AcademicClaim, AcademicDocument, AcademicParagraph } from '../../models/academic-writing.model';

export interface P1EvidenceCoverageMetrics {
  totalClaims: number;
  totalFactualClaims: number;
  totalNonFactualClaims: number;
  supportedFactualClaims: number;
  evidenceCoverage: number;             // Supported Factual Claims / Total Factual Claims (0-100%)
  citationCoverage: number;            // Claims with citations / Total Claims (0-100%)
  verifiedSourceCoverage: number;      // Verified Sources / Total Sources (0-100%)
  contradictionCoverage: number;       // Analyzed Contradiction Items count
  highQualitySourceCoverage: number;   // High Quality Sources / Total Sources (0-100%)
  unsupportedClaimRatio: number;       // Unsupported Factual Claims / Total Factual Claims (0-100%)
  explanationKurdish: string;
}

@Injectable({
  providedIn: 'root'
})
export class EvidenceCoverageService {

  /**
   * Calculates EvidenceCoverageMetrics for a list of AcademicClaims
   */
  public calculateClaimCoverage(claims: AcademicClaim[] = []): EvidenceCoverageMetrics {
    const totalClaims = claims.length;
    if (totalClaims === 0) {
      return {
        totalClaims: 0,
        supportedClaims: 0,
        partiallySupportedClaims: 0,
        unsupportedClaims: 0,
        unverifiedClaims: 0,
        coverageScore: 0
      };
    }

    let supported = 0;
    let partiallySupported = 0;
    let unsupported = 0;
    let unverified = 0;

    claims.forEach(ac => {
      if (ac.status === 'supported') supported++;
      else if (ac.status === 'partially_supported') partiallySupported++;
      else if (ac.status === 'unsupported') unsupported++;
      else if (ac.status === 'unverified') unverified++;
    });

    const coverageScore = Math.round(((supported + (partiallySupported * 0.5)) / totalClaims) * 100);

    return {
      totalClaims,
      supportedClaims: supported,
      partiallySupportedClaims: partiallySupported,
      unsupportedClaims: unsupported,
      unverifiedClaims: unverified,
      coverageScore
    };
  }

  /**
   * Calculates EvidenceCoverageMetrics for a single AcademicParagraph
   */
  public calculateParagraphCoverage(paragraph: AcademicParagraph): EvidenceCoverageMetrics {
    return this.calculateClaimCoverage(paragraph?.claims || []);
  }

  /**
   * Calculates overall EvidenceCoverageMetrics across an AcademicDocument
   */
  public calculateDocumentCoverage(document: AcademicDocument): EvidenceCoverageMetrics {
    const allClaims: AcademicClaim[] = [];
    if (document && document.sections) {
      document.sections.forEach(s => {
        if (s.paragraphs) {
          s.paragraphs.forEach(p => {
            if (p.claims) {
              allClaims.push(...p.claims);
            }
          });
        }
      });
    }
    return this.calculateClaimCoverage(allClaims);
  }

  /**
   * Calculates comprehensive P1 Evidence Coverage metrics with explicit denominator handling
   */
  public calculateP1Coverage(
    claims: ExtractedClaim[],
    evidenceList: SelectedEvidenceItem[],
    entailments: ClaimEntailmentResult[],
    contradictions: ContradictionItem[],
    sources: Source[]
  ): P1EvidenceCoverageMetrics {
    const totalClaims = claims.length;

    // Separate Factual Claims from Non-Factual (Opinion/Interpretive)
    const factualClaims = claims.filter(c => c.isFactual);
    const nonFactualClaims = claims.filter(c => !c.isFactual);

    const totalFactualClaims = factualClaims.length;
    const totalNonFactualClaims = nonFactualClaims.length;

    // Supported Factual Claims
    const supportedFactualClaims = entailments.filter(e => {
      const claim = claims.find(c => c.id === e.claimId);
      return claim?.isFactual && (e.label === 'SUPPORTED' || e.label === 'PARTIALLY_SUPPORTED');
    }).length;

    // Evidence Coverage Calculation: Supported Factual Claims / Total Factual Claims
    const evidenceCoverage = totalFactualClaims > 0
      ? Math.round((supportedFactualClaims / totalFactualClaims) * 100)
      : 100;

    // Citation Coverage Calculation
    const claimsWithEvidence = claims.filter(c => c.evidenceIds.length > 0).length;
    const citationCoverage = totalClaims > 0
      ? Math.round((claimsWithEvidence / totalClaims) * 100)
      : 0;

    // Verified Source Coverage
    const totalSources = sources.length;
    const verifiedSources = sources.filter(s => s.metadata.verificationStatus === 'verified').length;
    const verifiedSourceCoverage = totalSources > 0
      ? Math.round((verifiedSources / totalSources) * 100)
      : 0;

    // High Quality Source Coverage (DOI / Journal verified)
    const highQualitySources = sources.filter(s => s.metadata.doi || s.metadata.journal).length;
    const highQualitySourceCoverage = totalSources > 0
      ? Math.round((highQualitySources / totalSources) * 100)
      : 0;

    // Unsupported Claim Ratio
    const unsupportedCount = totalFactualClaims - supportedFactualClaims;
    const unsupportedClaimRatio = totalFactualClaims > 0
      ? Math.round((unsupportedCount / totalFactualClaims) * 100)
      : 0;

    const contradictionCoverage = contradictions.length;

    const explanationKurdish = `داپۆشینی بەڵگە زانستییەکان: ${evidenceCoverage}% ی ئیدیعا ڕاستییەکان بە بەڵگەی سەلمێنراو پشکنراون (${supportedFactualClaims} لە ${totalFactualClaims}). ئیدیعا ناکۆکەکان: ${contradictionCoverage}.`;

    return {
      totalClaims,
      totalFactualClaims,
      totalNonFactualClaims,
      supportedFactualClaims,
      evidenceCoverage,
      citationCoverage,
      verifiedSourceCoverage,
      contradictionCoverage,
      highQualitySourceCoverage,
      unsupportedClaimRatio,
      explanationKurdish
    };
  }
}
