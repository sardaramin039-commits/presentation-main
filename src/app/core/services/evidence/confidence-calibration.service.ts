import { Injectable, inject } from '@angular/core';
import { CalibratedConfidenceResult, ConfidenceLevel, ConfidenceBreakdown } from '../../models/confidence.model';
import { SelectedEvidenceItem } from '../../models/evidence.model';
import { ClaimEntailmentResult } from '../../models/entailment.model';
import { ContradictionItem } from '../../models/contradiction.model';
import { CitationVerificationReport } from '../citation-evidence-verifier.service';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

@Injectable({
  providedIn: 'root'
})
export class ConfidenceCalibrationService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Calculates a mathematically calibrated confidence score with strict feature attribution
   */
  public calibrateConfidence(
    evidenceList: SelectedEvidenceItem[],
    entailments: ClaimEntailmentResult[],
    contradictions: ContradictionItem[],
    citationReports: CitationVerificationReport[]
  ): CalibratedConfidenceResult {
    // 1. Evidence Strength Score (0 to +25)
    let evidenceStrengthScore = 0;
    if (evidenceList.length > 0) {
      const avgEvConf = evidenceList.reduce((acc, e) => acc + e.confidenceScore, 0) / evidenceList.length;
      evidenceStrengthScore = Math.min(25, Math.round((avgEvConf / 100) * 25));
    }

    // 2. Source Quality Score (0 to +20)
    let sourceQualityScore = 0;
    if (evidenceList.length > 0) {
      const verifiedCount = evidenceList.filter(e => e.verificationStatus === 'verified').length;
      sourceQualityScore = Math.min(20, Math.round((verifiedCount / evidenceList.length) * 20));
    }

    // 3. Entailment Strength Score (0 to +25)
    let entailmentStrengthScore = 0;
    if (entailments.length > 0) {
      const supportedCount = entailments.filter(e => e.label === 'SUPPORTED' || e.label === 'PARTIALLY_SUPPORTED').length;
      entailmentStrengthScore = Math.min(25, Math.round((supportedCount / entailments.length) * 25));
    }

    // 4. Verification Status Score (0 to +15)
    let verificationStatusScore = 0;
    if (evidenceList.some(e => e.sourceDoi)) {
      verificationStatusScore += 10;
    }
    if (citationReports.some(c => c.isFullyGroundable)) {
      verificationStatusScore += 5;
    }

    // 5. Citation Match Score (0 to +10)
    let citationMatchScore = 0;
    if (citationReports.length > 0) {
      const validCites = citationReports.filter(c => c.hasValidSource).length;
      citationMatchScore = Math.min(10, Math.round((validCites / citationReports.length) * 10));
    }

    // 6. Retrieval Consistency Score (0 to +10)
    const retrievalConsistencyScore = evidenceList.length >= 2 ? 10 : (evidenceList.length === 1 ? 5 : 0);

    // 7. Penalties
    const contradictionPenalty = contradictions.length > 0 ? Math.min(30, contradictions.length * 15) : 0;
    const missingEvidencePenalty = evidenceList.length === 0 ? 25 : 0;
    const uncertaintyPenalty = entailments.some(e => e.label === 'NOT_SUPPORTED') ? 15 : 0;

    const breakdown: ConfidenceBreakdown = {
      evidenceStrengthScore,
      sourceQualityScore,
      entailmentStrengthScore,
      verificationStatusScore,
      citationMatchScore,
      retrievalConsistencyScore,
      contradictionPenalty,
      missingEvidencePenalty,
      uncertaintyPenalty
    };

    // Calculate raw mathematical sum
    const rawSum = (
      evidenceStrengthScore +
      sourceQualityScore +
      entailmentStrengthScore +
      verificationStatusScore +
      citationMatchScore +
      retrievalConsistencyScore
    ) - (contradictionPenalty + missingEvidencePenalty + uncertaintyPenalty);

    let finalScore = Math.max(0, Math.min(100, rawSum));

    // NON-NEGOTIABLE RULE: High confidence WITHOUT evidence is STRICTLY FORBIDDEN!
    const isEvidenceBacked = evidenceList.length > 0;
    if (!isEvidenceBacked) {
      finalScore = Math.min(29, finalScore); // Hard capped at LOW / VERY_LOW
    }

    // Map to ConfidenceLevel
    let level: ConfidenceLevel = 'VERY_LOW';
    if (finalScore >= 85) level = 'VERY_HIGH';
    else if (finalScore >= 70) level = 'HIGH';
    else if (finalScore >= 50) level = 'MODERATE';
    else if (finalScore >= 30) level = 'LOW';
    else level = 'VERY_LOW';

    const explanationKurdish = `ئاستی دڵنیایی (${finalScore}% - ${level}): بڕی بەڵگەکان (+${evidenceStrengthScore}), کوالێتی سەرچاوەکان (+${sourceQualityScore}), هەڵسەنگاندنی ئیدیعاكان (+${entailmentStrengthScore}), سزادانی ناکۆکیی دەقەکان (-${contradictionPenalty}).`;

    const prov = this.provenanceService.createChain(
      'confidence_calibration',
      `Calibrated confidence score to ${finalScore}% (${level}). Evidence backed: ${isEvidenceBacked}`
    );

    return {
      finalScore,
      level,
      breakdown,
      explanationKurdish,
      isEvidenceBacked,
      provenance: prov
    };
  }
}
