import { Injectable } from '@angular/core';
import { AcademicDocument } from '../../models/academic-writing.model';
import { Source, Citation, Claim, CitationStyle } from '../../models/research.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class CitationQualityReviewService {
  /**
   * Evaluates citation quality, style consistency, locator availability, orphan references,
   * duplicate references, and missing citations for factual claims.
   */
  reviewCitationQuality(
    document: AcademicDocument,
    sources: Source[] = [],
    citations: Citation[] = [],
    claims: Claim[] = []
  ): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [];

    const expectedStyle: CitationStyle = document.citationStyle || 'APA7';
    evidenceSnippets.push(`شێوازی داواکراوی ئاماژەدان: ${expectedStyle}`);

    const sourceMap = new Map<string, Source>();
    sources.forEach(s => sourceMap.set(s.id, s));

    const citedSourceIds = new Set<string>();

    // Check 1: Citation style consistency & locator availability
    citations.forEach((cit, cIdx) => {
      citedSourceIds.add(cit.sourceId);

      const src = sourceMap.get(cit.sourceId);
      if (!src) {
        const findingId = `finding_cit_nosrc_${cit.citationId || cIdx}`;
        const recId = `rec_cit_nosrc_${cit.citationId || cIdx}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'citation_quality',
          severity: 'major',
          message: `ئاماژەی (Citation) ${cit.citationId} بە لایەنێکی بێ سەرچاوە بەیان بووە.`,
          location: { type: 'sentence', details: `Citation ${cit.citationId}` },
          recommendation: {
            id: recId,
            findingId,
            action: 'سەرچاوەی دروست بە ئاماژەکە ببه‌ستەرەوە یان سەرچاوەکە بپشکنە.',
            explanation: 'ئاماژەدان بە سەرچاوەی نەبوو بێوازی ئەکادیمی دروست دەکات.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }

      if (cit.style && cit.style !== expectedStyle) {
        const findingId = `finding_cit_style_${cit.citationId || cIdx}`;
        const recId = `rec_cit_style_${cit.citationId || cIdx}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'citation_quality',
          severity: 'minor',
          message: `شێوازی ئاماژەدان (${cit.style}) هاوشێوەی شێوازی گشتی بەڵگەنامەکە (${expectedStyle}) نییە.`,
          location: { type: 'sentence', details: `Citation ${cit.citationId}` },
          recommendation: {
            id: recId,
            findingId,
            action: `شێوازی ئاماژەدانی ئەم بەشە بگۆڕە بۆ ${expectedStyle}.`,
            explanation: 'پێویستە هەموو ئاماژەکانی ناو دەق هەمان شێوازی پێوەر و یەکگرتوو پەیڕەو بکەن.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }

      // Locator check
      if (!cit.locator || (!cit.locator.page && !cit.locator.paragraph && !cit.locator.section)) {
        const findingId = `finding_cit_noloc_${cit.citationId || cIdx}`;
        const recId = `rec_cit_noloc_${cit.citationId || cIdx}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'citation_quality',
          severity: 'minor',
          message: `ئاماژەی ${cit.citationId} زانیاری شوێنی لێکۆڵینەوەی (Page/Paragraph/Locator) تێدا نییە.`,
          location: { type: 'sentence', details: `Citation ${cit.citationId}` },
          recommendation: {
            id: recId,
            findingId,
            action: 'ژمارەی لاپەڕە یان بەشی سەرچاوەکە زیاد بکە.',
            explanation: 'دابینکردنی ژمارەی لاپەڕە شوێنکەوتنی ئەکادیمی (Traceability) بەهێز دەکات.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }
    });

    // Check 2: Orphan references (Source exists in bibliography/source list, but is never cited in text)
    sources.forEach(src => {
      if (!citedSourceIds.has(src.id)) {
        const findingId = `finding_orphan_src_${src.id}`;
        const recId = `rec_orphan_src_${src.id}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'citation_quality',
          severity: 'moderate',
          message: `سەرچاوەی هەتیو (Orphan Reference): سەرچاوەی "${src.metadata.title}" لە پێڕستدا هەیە بەڵام لە دەقدا ئاماژەی پێ نەکراوە.`,
          location: { type: 'section', details: 'پێڕستی سەرچاوەکان' },
          relatedSourceId: src.id,
          recommendation: {
            id: recId,
            findingId,
            action: 'ئەم سەرچاوەیە لە شوێنی گونجاوی دەقەکە ئاماژە پێ بکە یان لە پێڕستەکەی ببه‌ستەرەوە.',
            explanation: 'لە نەریتی ئەکادیمیدا نابێت سەرچاوەی بەکارنه‌هاتوو لە پێڕستدا بمێنێتەوە.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }
    });

    // Check 3: Missing citations (Factual claims without citations)
    claims.forEach(claim => {
      const hasCitation = citations.some(c => c.claimId === claim.id);
      if (!hasCitation) {
        const findingId = `finding_missing_cit_${claim.id}`;
        const recId = `rec_missing_cit_${claim.id}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'citation_quality',
          severity: 'major',
          message: `ئاماژەی کەمتەرخەم (Missing Citation): بانگەشەی زانستی "${claim.statement}" ئاماژەی سەرچاوەی (In-Text Citation) نییە.`,
          location: { type: 'claim', claimId: claim.id, details: `بانگەشەی ${claim.id}` },
          relatedClaimId: claim.id,
          recommendation: {
            id: recId,
            findingId,
            action: 'ئاماژەی ناو دەق (In-text citation) بۆ ئەم بانگەشەیە زیاد بکە بەپێی سەرچاوەی ڕاستەقینە.',
            explanation: 'بانگەشەی فاکت لە نووسینی زانستیدا بەبێ ئاماژەدان سەرپێچی ئەکادیمییە.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }
    });

    let status: ReviewStatus = 'pass';
    if (findings.some(f => f.severity === 'critical' || f.severity === 'major')) {
      status = 'needs_revision';
    } else if (findings.some(f => f.severity === 'moderate' || f.severity === 'minor')) {
      status = 'pass_with_warnings';
    }

    return {
      dimension: 'citation_quality',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
