import { Injectable, inject } from '@angular/core';
import {
  Evidence,
  EvidenceType,
  EvidenceLocation,
  Source,
  SourceVerificationStatus,
  Provenance
} from '../../models/research.model';
import { SourceVerificationService } from '../source-verification.service';

export interface EvidenceValidationResult {
  isValid: boolean;
  evidence: Evidence;
  warnings: string[];
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class EvidenceValidationService {
  private verificationService = inject(SourceVerificationService);

  async validateAndCreateEvidence(
    source: Source,
    extractedSnippet: string,
    evidenceType: EvidenceType = 'direct',
    locationInput?: Partial<EvidenceLocation>,
    quotedText?: string,
    contextNote?: string
  ): Promise<EvidenceValidationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];

    const cleanSnippet = extractedSnippet ? extractedSnippet.trim() : '';
    if (!cleanSnippet) {
      errors.push('دەقی بەڵگە (Snippet) بەتاڵە');
    }

    // Ensure Location has explicit page ('unknown' if absent - NO hallucinated page numbers!)
    const page = (locationInput?.page && locationInput.page.trim().length > 0)
      ? locationInput.page.trim()
      : 'unknown';

    if (page === 'unknown') {
      warnings.push('ژمارەی لاپەڕە نەدۆزرایەوە (لە کاتی نادیاریدا ئاماژە بە unknown دراوە)');
    }

    const location: EvidenceLocation = {
      page,
      section: locationInput?.section?.trim(),
      paragraph: locationInput?.paragraph?.trim()
    };

    // Verify quotedText against rawContent if available
    let isQuoteVerifiedInRawContent = false;
    if (quotedText && quotedText.trim() && source.rawContent) {
      const cleanQuote = quotedText.trim().toLowerCase();
      const cleanRaw = source.rawContent.toLowerCase();
      if (cleanRaw.includes(cleanQuote)) {
        isQuoteVerifiedInRawContent = true;
      } else {
        warnings.push('دەقی وەرگیراوی ڕاستەوخۆ (Quoted Text) بە تەواوی لەگەڵ دەقی خاوی سەرچاوەکەدا نەگونجا');
      }
    }

    // Calculate confidence score deterministically
    let confidence = 0.5;

    // Boost based on source verification status
    if (source.metadata.verificationStatus === 'verified') {
      confidence += 0.3;
    } else if (source.metadata.verificationStatus === 'partially_verified') {
      confidence += 0.15;
    } else if (source.metadata.verificationStatus === 'rejected') {
      confidence = 0;
      errors.push('سەرچاوەکە ڕەتکراوەیە، ناتوانرێت بەڵگەی لەسەر بنەمابنرێت');
    }

    // Boost based on direct quote verification
    if (evidenceType === 'direct') {
      if (isQuoteVerifiedInRawContent) confidence += 0.2;
      else if (quotedText) confidence += 0.1;
    }

    // Boost if location has section/page
    if (location.page !== 'unknown') confidence += 0.1;

    confidence = Number(Math.max(0, Math.min(1.0, confidence)).toFixed(2));

    // Determine evidence verification status constrained by source
    let evidenceVerificationStatus: SourceVerificationStatus = source.metadata.verificationStatus;
    if (evidenceVerificationStatus === 'verified' && page === 'unknown') {
      evidenceVerificationStatus = 'partially_verified';
    }

    const provenance: Provenance = {
      sourceProvider: source.provenance?.sourceProvider || 'Internal Verification Engine',
      providerSourceId: source.provenance?.providerSourceId,
      retrievalTimestamp: new Date().toISOString(),
      originalUrl: source.metadata.url,
      transformationHistory: [
        {
          timestamp: new Date().toISOString(),
          action: 'EVIDENCE_EXTRACTION_AND_VALIDATION',
          actor: 'EvidenceValidationService',
          details: `Type: ${evidenceType}, Page: ${page}, Confidence: ${confidence}`
        }
      ]
    };

    const evidence: Evidence = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourceId: source.id,
      evidenceType,
      extractedSnippet: cleanSnippet,
      quotedText: quotedText?.trim(),
      location,
      contextNote: contextNote?.trim(),
      confidenceScore: confidence,
      verificationStatus: evidenceVerificationStatus,
      provenance
    };

    return {
      isValid: errors.length === 0,
      evidence,
      warnings,
      errors
    };
  }
}
