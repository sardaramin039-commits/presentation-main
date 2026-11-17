import { Injectable } from '@angular/core';
import { AcademicDocument, AcademicParagraph } from '../../models/academic-writing.model';
import { Claim, Evidence } from '../../models/research.model';
import {
  DimensionReviewResult,
  ReviewFinding,
  ReviewRecommendation,
  ReviewStatus
} from '../../models/academic-review.model';

@Injectable({
  providedIn: 'root'
})
export class ArgumentCoherenceReviewService {
  /**
   * Assesses argument coherence (Claim -> Evidence -> Reasoning -> Conclusion) and identifies
   * reasoning defects or possible logical jumps without asserting fallacies as fact without evidence.
   */
  reviewArgumentCoherence(
    document: AcademicDocument,
    claims: Claim[] = [],
    evidenceList: Evidence[] = []
  ): DimensionReviewResult {
    const findings: ReviewFinding[] = [];
    const recommendations: ReviewRecommendation[] = [];
    const evidenceSnippets: string[] = [];

    if (claims.length > 0 && evidenceList.length === 0) {
      evidenceSnippets.push(`ژمارەی بانگەشەکان: ${claims.length}، بەبێ بەڵگەی سەلمێنراو`);
    }

    const allParagraphs: AcademicParagraph[] = [];
    (document.sections || []).forEach(sec => {
      (sec.paragraphs || []).forEach(p => allParagraphs.push(p));
    });

    allParagraphs.forEach((p, pIdx) => {
      const pText = p.text ? p.text.trim() : '';
      if (!pText) return;

      // Check 1: Overgeneralization indicators ("هەموان", "هەمیشە", "بێ هیچ گومانێک", "always", "everyone", "undoubtedly")
      const overgeneralizationKeywords = ['هەموان', 'هەمیشە', 'سەدا سەد', 'بێ هیچ گومانێک', 'everyone', 'always', 'undoubtedly', '100%'];
      const foundOG = overgeneralizationKeywords.find(kw => pText.toLowerCase().includes(kw));

      if (foundOG) {
        const findingId = `finding_arg_og_${p.id || pIdx}`;
        const recId = `rec_arg_og_${p.id || pIdx}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'argument_coherence',
          severity: 'moderate',
          message: `کاندیدی گشتاندنی زۆر (Overgeneralization): بڕگەکە زاراوەی توندی وەکو "${foundOG}" بەکارهێناوە.`,
          location: {
            type: 'paragraph',
            paragraphId: p.id,
            sectionId: p.sectionId,
            sentenceText: pText.substring(0, 100) + '...'
          },
          recommendation: {
            id: recId,
            findingId,
            action: 'زاراوەی هاوسەنگتر (Hedging) بەکاربهێنە وەکو "زیاتری بەڵگەکان ئاماژە بەوە دەکەن" یان "لە زۆربەی بارودۆخەکاندا".',
            explanation: 'لە نووسینی ئەکادیمیدا گشتاندنی بێ بەڵگەی سەدا سەد ئاستی باوڕپێکراوی ئارگومێنت کەم دەکاتەوە.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
        evidenceSnippets.push(`بڕگەی ${pIdx + 1}: زاراوەی گشتاندن ("${foundOG}")`);
      }

      // Check 2: Logical jump / Unsupported conclusion ("کەواتە دەسەلمێنرێت کە", "بەم پێیە بێگومان", "therefore it proves") without claims or citations
      const hasJumpPhrase = pText.includes('کەواتە دەسەلمێنرێت') || pText.includes('بەم پێیە بێگومان') || pText.includes('therefore it proves');
      const hasClaims = p.claims && p.claims.length > 0;
      const hasCitations = p.citations && p.citations.length > 0;

      if (hasJumpPhrase && !hasClaims && !hasCitations) {
        const findingId = `finding_arg_jump_${p.id || pIdx}`;
        const recId = `rec_arg_jump_${p.id || pIdx}`;
        const finding: ReviewFinding = {
          id: findingId,
          dimension: 'argument_coherence',
          severity: 'major',
          message: 'گومانی بازدانی لۆجیکی (Logical Jump): ئارگومێنتەکە گەیشتووەتە دەرئەنجامی توند بەبێ خستنەڕووی بەڵگە یان ئاماژەدان بە سەرچاوە.',
          location: {
            type: 'paragraph',
            paragraphId: p.id,
            sectionId: p.sectionId,
            sentenceText: pText
          },
          recommendation: {
            id: recId,
            findingId,
            action: 'بەڵگەی زانستی و زنجیرەی شیکاری ڕوون (Reasoning) پێش خستنەڕووی دەرئەنجام بەیان بکە.',
            explanation: 'دەرئەنجامگیری بێ زنجیرەی شیکاری بە بازدانی لۆجیکی دادەنرێت.'
          }
        };
        findings.push(finding);
        if (finding.recommendation) recommendations.push(finding.recommendation);
        evidenceSnippets.push(`بڕگەی ${pIdx + 1}: دەرئەنجامگیری بێ بەڵگە`);
      }

      // Check 3: Circular reasoning potential (repeating exact claim statement in conclusion without adding new reasoning)
      if (p.claims) {
        p.claims.forEach(ac => {
          const claimStmt = ac.claim?.statement?.trim();
          if (claimStmt && pText.includes(claimStmt) && pText.split(claimStmt).length > 2) {
            const findingId = `finding_arg_circular_${ac.claim.id}`;
            const recId = `rec_arg_circular_${ac.claim.id}`;
            const finding: ReviewFinding = {
              id: findingId,
              dimension: 'argument_coherence',
              severity: 'moderate',
              message: 'پێشبینی دەوری لۆجیکی (Possible Circular Reasoning): بانگەشەکە بە هەمان وشە لە بڕگەکەدا دووبارە بووەتەوە بەبێ پێشکەشکردنی هۆکاری سەربەخۆ.',
              location: {
                type: 'claim',
                claimId: ac.claim.id,
                paragraphId: p.id,
                sectionId: p.sectionId
              },
              relatedClaimId: ac.claim.id,
              recommendation: {
                id: recId,
                findingId,
                action: 'هۆکار و بەڵگەی سەربەخۆ بۆ سەلماندنی بانگەشەکە زیاد بکە لەجاتی دووبارەکردنەوەی هەمان دەستەواژە.',
                explanation: 'سەلماندنی بانگەشە بە هەمان دەق لە ڕووی لۆجیکییەوە بازنەیییە.'
              }
            };
            findings.push(finding);
            if (finding.recommendation) recommendations.push(finding.recommendation);
            evidenceSnippets.push(`بانگەشەی ${ac.claim.id}: دووبارەبوونەوەی دەوری`);
          }
        });
      }
    });

    let status: ReviewStatus = 'pass';
    if (findings.some(f => f.severity === 'critical' || f.severity === 'major')) {
      status = 'needs_revision';
    } else if (findings.some(f => f.severity === 'moderate' || f.severity === 'minor')) {
      status = 'pass_with_warnings';
    }

    return {
      dimension: 'argument_coherence',
      status,
      findings,
      evidence: evidenceSnippets,
      recommendations
    };
  }
}
