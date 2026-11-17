import { Injectable } from '@angular/core';
import { AcademicDocument } from '../../models/academic-writing.model';
import { Claim, Evidence, Source, Citation } from '../../models/research.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class CompletenessReviewService {
  /**
   * Reviews document completeness (claims, evidence, citations, references, metadata)
   * tailored to the specific academic level and document type.
   */
  reviewCompleteness(
    document: AcademicDocument,
    claims: Claim[] = [],
    evidenceList: Evidence[] = [],
    sources: Source[] = [],
    citations: Citation[] = [],
    academicLevel = '🎓 زانکۆ - بەکالۆریۆس',
    documentType = 'research_paper'
  ): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [
      `ئاستی ئەکادیمی: ${academicLevel}، جۆری بەڵگەنامە: ${documentType}`
    ];

    // Check 1: Empty document or sections
    if (!document.sections || document.sections.length === 0) {
      const findingId = 'finding_comp_no_sections';
      const recId = 'rec_comp_no_sections';
      const finding: ReviewFinding = {
        id: findingId,
        dimension: 'completeness',
        severity: 'critical',
        message: 'بەڵگەنامەکە بێ ناواخن و بێ بەشە (No Sections).',
        location: { type: 'section', details: 'بەڵگەنامە' },
        recommendation: {
          id: recId,
          findingId,
          action: 'بەشە ئەکادیمییە سەرەکییەکان دروست بکە.',
          explanation: 'بەڵگەنامەی بێ ناواخن ناکرێت بۆ پڕۆسەی پێداچوونەوە ئامادە بێت.'
        }
      };
      findings.push(finding);
      if (finding.recommendation) recommendations.push(finding.recommendation);

      return {
        dimension: 'completeness',
        status: 'critical_revision',
        findings,
        evidence: ['بەڵگەنامەکە هیچ بەشێکی تێدا نییە'],
        recommendations
      };
    }

    evidenceSnippets.push(`ژمارەی بەشەکان: ${document.sections.length}، ژمارەی بانگەشەکان: ${claims.length}، ژمارەی سەرچاوەکان: ${sources.length}`);

    // Check 2: Claims without any evidence
    const unsupportedClaims = claims.filter(c => !evidenceList.some(e => e.claimId === c.id));
    if (unsupportedClaims.length > 0) {
      const findingId = 'finding_comp_unsupported_claims';
      const recId = 'rec_comp_unsupported_claims';
      const finding: ReviewFinding = {
        id: findingId,
        dimension: 'completeness',
        severity: 'major',
        message: `تەواونەنیشاندانی بەڵگە: ${unsupportedClaims.length} بانگەشەی زانستی هیچ بەڵگەیەکیان نییە.`,
        location: { type: 'section', details: 'کۆکراوەی بانگەشەکان' },
        recommendation: {
          id: recId,
          findingId,
          action: 'بەڵگەی زانستی بە هەموو بانگەشە بێ بەڵگەکان ببەستەرەوە.',
          explanation: 'تەواکاری بەڵگە زامنی دروستیی ئەکادیمی بەڵگەنامەکەیە.'
        }
      };
      findings.push(finding);
      if (finding.recommendation) recommendations.push(finding.recommendation);
    }

    // Check 3: Sources without citations in text
    const citationSourceIds = new Set(citations.map(c => c.sourceId));
    const uncitedSources = sources.filter(s => !citationSourceIds.has(s.id));
    if (uncitedSources.length > 0) {
      const findingId = 'finding_comp_uncited_sources';
      const recId = 'rec_comp_uncited_sources';
      const finding: ReviewFinding = {
        id: findingId,
        dimension: 'completeness',
        severity: 'moderate',
        message: `تەواونەنیشاندانی ئاماژە: ${uncitedSources.length} سەرچاوە هەن کە لە ناو دەقدا ئاماژەیان پێ نەکراوە.`,
        location: { type: 'section', details: 'پێڕستی سەرچاوەکان' },
        recommendation: {
          id: recId,
          findingId,
          action: 'سەرچاوەکان لە شوێنی گونجاوی دەقەکە ئاماژە پێ بکە.',
          explanation: 'هەر سەرچاوەیەک لە پێڕست بێت دەبێت لە دەقیشدا بەکاربهێنرێت.'
        }
      };
      findings.push(finding);
      if (finding.recommendation) recommendations.push(finding.recommendation);
    }

    let status: ReviewStatus = 'pass';
    if (findings.some(f => f.severity === 'critical' || f.severity === 'major')) {
      status = 'needs_revision';
    } else if (findings.some(f => f.severity === 'moderate' || f.severity === 'minor')) {
      status = 'pass_with_warnings';
    }

    return {
      dimension: 'completeness',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
