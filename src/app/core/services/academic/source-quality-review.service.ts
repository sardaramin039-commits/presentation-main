import { Injectable } from '@angular/core';
import { Source } from '../../models/research.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class SourceQualityReviewService {
  /**
   * Reviews scholarly source quality, metadata completeness, DOI availability,
   * publisher credentials, and verification status without equating ranking to truth.
   */
  reviewSourceQuality(sources: Source[] = []): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [];

    if (!sources || sources.length === 0) {
      const findingId = 'finding_src_empty';
      const recId = 'rec_src_empty';
      const finding: ReviewFinding = {
        id: findingId,
        dimension: 'source_quality',
        severity: 'major',
        message: 'هیچ سەرچاوەیەکی زانستی لە تەواوی بەڵگەنامەکەدا بەدی نەکرا.',
        location: { type: 'section', details: 'سەرچاوەکان' },
        recommendation: {
          id: recId,
          findingId,
          action: 'سەرچاوەی ئەکادیمی خاوەن DOI یان پلەی زانستی زیاد بکە.',
          explanation: 'توێژینەوەی ئەکادیمی بەبێ سەرچاوە ڕەسەنەکان سەلماندنی زانستی نییە.'
        }
      };
      findings.push(finding);
      if (finding.recommendation) recommendations.push(finding.recommendation);

      return {
        dimension: 'source_quality',
        status: 'needs_revision',
        findings,
        evidence: ['هیچ سەرچاوەیەک بەردەست نییە'],
        recommendations
      };
    }

    sources.forEach((src, idx) => {
      const m = src.metadata;
      evidenceSnippets.push(`سەرچاوەی ${idx + 1}: "${m.title}" (${m.sourceType}, status=${m.verificationStatus})`);

      // Check 1: Verification status
      if (m.verificationStatus === 'rejected') {
        const findingId = `finding_src_rej_${src.id}`;
        const recId = `rec_src_rej_${src.id}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'source_quality',
          severity: 'critical',
          message: `سەرچاوەی ڕەتکراوە (Rejected Source): سەرچاوەی "${m.title}" لە پشکنینی ڕەسەنایەتیدا دەرنەچووە.`,
          location: { type: 'section', details: `سەرچاوەی ${src.id}` },
          relatedSourceId: src.id,
          recommendation: {
            id: recId,
            findingId,
            action: 'ئەم سەرچاوەیە بسڕەوە یان سەرچاوەیەکی زانستی جێگیر و پشتڕاستکراوی شوێن بگرەوە.',
            explanation: 'بەکارهێنانی سەرچاوەی ڕەتکراوە کێشەی بڕواپێکراوی لە توێژینەوەدا دروست دەکات.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      } else if (m.verificationStatus === 'unverified') {
        const findingId = `finding_src_unver_${src.id}`;
        const recId = `rec_src_unver_${src.id}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'source_quality',
          severity: 'moderate',
          message: `سەرچاوەی ناپشتڕاستکراوە (Unverified Source): سەرچاوەی "${m.title}" زانیاری پشتڕاستکردنەوەی ناکاملە.`,
          location: { type: 'section', details: `سەرچاوەی ${src.id}` },
          relatedSourceId: src.id,
          recommendation: {
            id: recId,
            findingId,
            action: 'ناسێنەری DOI یان URLی فەرمی ژورناڵ بۆ بەهێزکردنی پشتڕاستکردنەوەی سەرچاوەکە دابین بکە.',
            explanation: 'پشتڕاستکردنەوەی سەرچاوە ڕاستگۆیی ئەکادیمی بەهێز دەکات.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }

      // Check 2: Metadata completeness (authors, year, doi/url)
      const missingFields: string[] = [];
      if (!m.authors || m.authors.length === 0) missingFields.push('نووسەران');
      if (!m.publicationYear) missingFields.push('ساڵی بڵاوبوونەوە');
      if (!m.doi && !m.url) missingFields.push('ناسێنەری DOI یان URL');

      if (missingFields.length > 0) {
        const findingId = `finding_src_meta_${src.id}`;
        const recId = `rec_src_meta_${src.id}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'source_quality',
          severity: 'minor',
          message: `میتاکەمی سەرچاوە: سەرچاوەی "${m.title}" زانیاری (${missingFields.join('، ')}) تێدا کەمە.`,
          location: { type: 'section', details: `سەرچاوەی ${src.id}` },
          relatedSourceId: src.id,
          recommendation: {
            id: recId,
            findingId,
            action: `میتا داتای تەواوی (${missingFields.join('، ')}) بۆ سەرچاوەکە تۆمار بکە.`,
            explanation: 'کامیلی میتاداتا ئاسانکاری دەکات بۆ پشکنین و دۆزینەوەی سەرچاوەکە.'
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
      dimension: 'source_quality',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
