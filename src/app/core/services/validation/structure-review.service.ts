import { Injectable } from '@angular/core';
import { AcademicDocument } from '../../models/academic-writing.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class StructureReviewService {
  /**
   * Reviews document structure against standard academic sections tailored to
   * academicLevel, documentType, and researchType.
   */
  reviewStructure(
    document: AcademicDocument,
    academicLevel = '🎓 زانکۆ - بەکالۆریۆس',
    documentType: 'research_paper' | 'thesis' | 'essay' | 'report' | 'article' = 'research_paper',
    researchType: 'empirical' | 'theoretical' | 'review' | 'case_study' | 'qualitative' | 'quantitative' = 'empirical'
  ): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidence: string[] = [];

    const existingSectionTitles = (document.sections || []).map(s => s.sectionTitle.toLowerCase());
    evidence.push(`بەشە دەستنیشانکراوەکانی بەڵگەنامەکە: ${existingSectionTitles.join(', ') || 'هیچ بەشێک دیاری نەکراوە'}`);

    // Determine required sections dynamically
    const requiredSections = this.getRequiredSections(academicLevel, documentType, researchType);

    requiredSections.forEach(req => {
      const isPresent = existingSectionTitles.some(title =>
        title.includes(req.key.toLowerCase()) || req.aliases.some(alias => title.includes(alias.toLowerCase()))
      );

      if (!isPresent) {
        const findingId = `finding_struct_missing_${req.key}`;
        const recId = `rec_struct_missing_${req.key}`;
        const severity = req.isMandatory ? 'major' : 'moderate';

        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'structure_and_organization',
          severity,
          message: `بەشی پێویست "${req.label}" لە بەڵگەنامەکەدا بەدی نەکرا.`,
          location: {
            type: 'section',
            sectionTitle: req.label,
            details: `پێکهاتەی بەڵگەنامە (${documentType} / ${academicLevel})`
          },
          recommendation: {
            id: recId,
            findingId,
            action: `بەشی "${req.label}" بەپێی پێوەری ئەکادیمی بۆ ${req.label} زیاد بکە.`,
            explanation: req.rationale
          }
        };

        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
      }
    });

    // Check logical order of existing sections
    const orderIssues = this.checkSectionOrdering(document);
    orderIssues.forEach(issue => {
      const findingId = `finding_struct_order_${issue.sectionId}`;
      const recId = `rec_struct_order_${issue.sectionId}`;
      const finding: ReviewFinding = {
        id: findingId,
        dimension: 'structure_and_organization',
        severity: 'minor',
        message: issue.message,
        location: {
          type: 'section',
          sectionId: issue.sectionId,
          sectionTitle: issue.sectionTitle
        },
        recommendation: {
          id: recId,
          findingId,
          action: 'ڕیزبەندی بەشەکان بپشکنە و بەپێی نەریتی ئەکادیمی ڕێکیان بخەرەوە.',
          explanation: 'ڕیزبەندی لۆجیکی بەشەکان خوێنەرەوەی ئەکادیمی بەرەو ئارگومێنتی تەواو ڕێنوێنی دەکات.'
        }
      };
      findings.push(finding);
      if (finding.recommendation) recommendations.push(finding.recommendation);
    });

    let status: ReviewStatus = 'pass';
    if (findings.some(f => f.severity === 'critical' || f.severity === 'major')) {
      status = 'needs_revision';
    } else if (findings.some(f => f.severity === 'moderate' || f.severity === 'minor')) {
      status = 'pass_with_warnings';
    }

    return {
      dimension: 'structure_and_organization',
      status,
      findings,
      evidence,
      recommendations
    };
  }

  private getRequiredSections(
    level: string,
    docType: string,
    researchType: string
  ): { key: string; label: string; aliases: string[]; isMandatory: boolean; rationale: string }[] {
    const isPostgrad = level.includes('ماستەر') || level.includes('دکتۆرا');
    const isSchool = level.includes('قوتابخانە');

    if (docType === 'essay') {
      return [
        { key: 'intro', label: 'پێشەکی (Introduction)', aliases: ['پێشەکی', 'introduction', 'intro'], isMandatory: true, rationale: 'وتار (Essay) پێویستی بە پێشەکییە بۆ دیاریکردنی تێزی سەرەکی.' },
        { key: 'body', label: 'ناوەڕۆک/شیکاری (Analysis)', aliases: ['شیکاری', 'ناوەڕۆک', 'body', 'analysis'], isMandatory: true, rationale: 'تەوەرەی سەرەکی بۆ خستنەڕووی ئارگومێنتەکان.' },
        { key: 'conclusion', label: 'دەرئەنجام (Conclusion)', aliases: ['دەرئەنجام', 'کۆتایی', 'conclusion'], isMandatory: true, rationale: 'کۆکردنەوە و دەستکەوتی سەرەکی وتارەکە.' },
        { key: 'references', label: 'سەرچاوەکان (References)', aliases: ['سەرچاوەکان', 'پێڕستی سەرچاوەکان', 'references'], isMandatory: true, rationale: 'دەستنیشانکردنی سەرچاوەی فیکری ئارگومێنتەکان.' }
      ];
    }

    // Default research_paper or thesis
    const list = [
      { key: 'intro', label: 'پێشەکی (Introduction)', aliases: ['پێشەکی', 'introduction'], isMandatory: true, rationale: 'خستنەڕووی زەمینە و کێشەی توێژینەوە.' },
      { key: 'problem', label: 'کێشەی توێژینەوە (Problem Statement)', aliases: ['کێشەی توێژینەوە', 'کێشە', 'problem'], isMandatory: !isSchool, rationale: 'دیاریکردنی ڕوونی ئەو کێشەیەی توێژینەوەکە هەوڵی چارەسەرکردنی دەدات.' },
      { key: 'questions', label: 'پرسیارەکانی توێژینەوە (Research Questions)', aliases: ['پرسیارەکان', 'پرسیاری توێژینەوە', 'questions'], isMandatory: true, rationale: 'دیاریکردنی ئاراستەی زانستی توێژینەوەکە.' },
      { key: 'literature', label: 'پێداچوونەوەی ئەدەبیات (Literature Review)', aliases: ['پێداچوونەوەی ئەدەبیات', 'ئەدەبیاتی توێژینەوە', 'literature review'], isMandatory: isPostgrad || docType === 'thesis' || researchType === 'review', rationale: 'پێویستە زەمینەی ئەکادیمی و توێژینەوەکانی پێشوو بەراورد بکرێن.' },
      { key: 'methodology', label: 'میثۆدۆلۆژی (Methodology)', aliases: ['میثۆدۆلۆژی', 'ڕێبازی توێژینەوە', 'methodology'], isMandatory: researchType === 'empirical' || isPostgrad, rationale: 'شێوازی کۆکردنەوە و شیکردنەوەی داتاکان ڕوون دەکاتەوە.' },
      { key: 'analysis', label: 'شیکاری و داتاکان (Analysis)', aliases: ['شیکاری', 'داتاکان', 'analysis', 'findings'], isMandatory: true, rationale: 'خستنەڕووی داتا و بەڵگە زانستییەکان.' },
      { key: 'conclusion', label: 'دەرئەنجام (Conclusion)', aliases: ['دەرئەنجام', 'conclusion'], isMandatory: true, rationale: 'وەڵامدانەوەی پرسیارەکان و دەرئەنجامی سەرەکی.' },
      { key: 'references', label: 'سەرچاوەکان (References)', aliases: ['سەرچاوەکان', 'پێڕستی سەرچاوەکان', 'references', 'bibliography'], isMandatory: true, rationale: 'پاراستنی ڕاستگۆیی ئەکادیمی و سەلماندنی سەرچاوەکان.' }
    ];

    return list;
  }

  private checkSectionOrdering(doc: AcademicDocument): { sectionId: string; sectionTitle: string; message: string }[] {
    const issues: { sectionId: string; sectionTitle: string; message: string }[] = [];
    if (!doc.sections || doc.sections.length < 2) return issues;

    const titles = doc.sections.map(s => s.sectionTitle.toLowerCase());
    const introIdx = titles.findIndex(t => t.includes('پێشەکی') || t.includes('introduction'));
    const conclusionIdx = titles.findIndex(t => t.includes('دەرئەنجام') || t.includes('conclusion'));
    const refsIdx = titles.findIndex(t => t.includes('سەرچاوە') || t.includes('references'));

    if (introIdx > 0 && introIdx > conclusionIdx && conclusionIdx !== -1) {
      issues.push({
        sectionId: doc.sections[introIdx].id,
        sectionTitle: doc.sections[introIdx].sectionTitle,
        message: 'بەشی پێشەکی لە دوای بەشی دەرئەنجام داهاتووە کە پێچەوانەی ڕیزبەندی ئەکادیمییە.'
      });
    }

    if (refsIdx !== -1 && refsIdx < titles.length - 1 && refsIdx < conclusionIdx) {
      issues.push({
        sectionId: doc.sections[refsIdx].id,
        sectionTitle: doc.sections[refsIdx].sectionTitle,
        message: 'پێڕستی سەرچاوەکان دەبێت لە کۆتایی بەڵگەنامەکە دابنرێت.'
      });
    }

    return issues;
  }
}
