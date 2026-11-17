import { Injectable } from '@angular/core';
import {
  SlidePlan,
  SlideValidationResult,
  PresentationValidationResult,
  AcademicIntegrityGateResult,
  PresentationNarrative,
  PresentationContext
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class PresentationValidationService {
  /**
   * Validates density, flow, repetition, integrity, and auditability across all slides in a presentation plan.
   */
  validatePresentation(
    slides: SlidePlan[],
    narrative: PresentationNarrative,
    context: PresentationContext
  ): {
    validation: PresentationValidationResult;
    integrityGate: AcademicIntegrityGateResult;
  } {
    const slideValidationResults = slides.map(s => this.validateSingleSlide(s));

    const overloadedSlidesCount = slideValidationResults.filter(r => r.isOverloaded).length;
    const repetitionCount = this.detectRepetitions(slides);
    const narrativeGapCount = this.validateNarrativeFlow(slides);

    const { unsupportedClaimsCount, citationLossCount, evidenceLossCount, missingCriticalContent } =
      this.evaluateIntegrityMetrics(slides, context);

    const warnings: string[] = [];
    const errors: string[] = [];

    if (overloadedSlidesCount > 0) {
      warnings.push(`ژمارەی ${overloadedSlidesCount} سڵاید ناوەڕۆکیان لەڕادەبەدەر چڕە.`);
    }

    if (repetitionCount > 0) {
      warnings.push(`ژمارەی ${repetitionCount} دووبارەبوونەوەی ناپێویست لە نێوان سڵایدەکاندا دۆزرایەوە.`);
    }

    if (narrativeGapCount > 0) {
      warnings.push(`ژمارەی ${narrativeGapCount} ناتەواوی لە پەیوەندی مەنتقیی نێوان سڵایدەکان دۆزرایەوە.`);
    }

    if (unsupportedClaimsCount > 0) {
      warnings.push(`ژمارەی ${unsupportedClaimsCount} بانگەشەی بێ بەڵگە لە سڵایدەکاندا هەیە.`);
    }

    const isValid = errors.length === 0;
    const status: 'valid' | 'warnings' | 'blocked' = errors.length > 0
      ? 'blocked'
      : warnings.length > 0
      ? 'warnings'
      : 'valid';

    const validation: PresentationValidationResult = {
      isValid,
      status,
      missingCriticalContent,
      unsupportedClaimsCount,
      citationLossCount,
      evidenceLossCount,
      overloadedSlidesCount,
      repetitionCount,
      narrativeGapCount,
      slideValidationResults,
      warnings,
      errors
    };

    const integrityGate = this.evaluateAcademicIntegrityGate(slides, context, validation);

    return { validation, integrityGate };
  }

  private validateSingleSlide(slide: SlidePlan): SlideValidationResult {
    const textLength = slide.contentPlan.blocks.reduce((acc, b) => acc + b.text.length, 0);
    const claimCount = (slide.contentPlan.primaryClaim ? 1 : 0) + slide.contentPlan.supportingClaims.length;
    const evidenceCount = slide.contentPlan.evidence.length;
    const citationCount = slide.contentPlan.citations.length;

    const warnings: string[] = [];
    const recommendations: string[] = [];

    const isOverloaded = textLength > 300 || slide.contentPlan.blocks.length > 7 || claimCount > 2 || evidenceCount > 3;

    if (isOverloaded) {
      warnings.push('ناوەڕۆکی سڵایدەکە لە سنووری پێشنیارکراو تێپەڕیوە.');
      recommendations.push('پێشنیازی دابەشکردنی سڵایدەکە دەکرێت بۆ پاراستنی ڕوونی visual.');
    }

    return {
      slideNumber: slide.slideNumber,
      isOverloaded,
      textLength,
      claimCount,
      evidenceCount,
      citationCount,
      warnings,
      recommendations
    };
  }

  private detectRepetitions(slides: SlidePlan[]): number {
    let repetitions = 0;
    const seenStatements = new Set<string>();

    slides.forEach(slide => {
      if (slide.slideType === 'reference' || slide.slideType === 'title') return;

      slide.contentPlan.blocks.forEach(block => {
        if (block.text.length > 20) {
          const norm = block.text.trim().toLowerCase();
          if (seenStatements.has(norm)) {
            repetitions++;
          } else {
            seenStatements.add(norm);
          }
        }
      });
    });

    return repetitions;
  }

  private validateNarrativeFlow(slides: SlidePlan[]): number {
    let gapCount = 0;
    if (slides.length < 2) return gapCount;

    // Check if title is first
    if (slides[0].slideType !== 'title') {
      gapCount++;
    }

    // Check if references/conclusion are present at the end of longer presentations
    if (slides.length >= 5) {
      const lastType = slides[slides.length - 1].slideType;
      if (lastType !== 'reference' && lastType !== 'conclusion') {
        gapCount++;
      }
    }

    return gapCount;
  }

  private evaluateIntegrityMetrics(
    slides: SlidePlan[],
    context: PresentationContext
  ): {
    unsupportedClaimsCount: number;
    citationLossCount: number;
    evidenceLossCount: number;
    missingCriticalContent: boolean;
  } {
    let unsupportedClaimsCount = 0;
    let citationLossCount = 0;
    const evidenceLossCount = 0;

    const inputClaimsCount = context.claims?.length || 0;
    const inputCitationsCount = context.citations?.length || 0;

    slides.forEach(s => {
      s.evidenceMaps.forEach(m => {
        if (m.verificationStatus === 'unsupported' || m.verificationStatus === 'unverified') {
          unsupportedClaimsCount++;
        }
      });
    });

    const mappedCitationsCount = slides.reduce((sum, s) => sum + s.citationMaps.length, 0);
    if (inputCitationsCount > 0 && mappedCitationsCount === 0) {
      citationLossCount = inputCitationsCount;
    }

    const missingCriticalContent = inputClaimsCount > 0 && slides.length < 3;

    return {
      unsupportedClaimsCount,
      citationLossCount,
      evidenceLossCount,
      missingCriticalContent
    };
  }

  private evaluateAcademicIntegrityGate(
    slides: SlidePlan[],
    context: PresentationContext,
    validation: PresentationValidationResult
  ): AcademicIntegrityGateResult {
    const blockingReasons: string[] = [];
    const warnings: string[] = [...validation.warnings];

    const inputClaims = context.claims || [];

    const traceableClaimsCount = slides.filter(s => s.evidenceMaps.length > 0).length;
    const totalClaimsCount = Math.max(1, inputClaims.length);
    const traceableClaimsPercentage = Math.min(100, Math.round((traceableClaimsCount / totalClaimsCount) * 100));

    const preservedCitationsCount = slides.reduce((sum, s) => sum + s.citationMaps.length, 0);
    const preservedEvidenceCount = slides.reduce((sum, s) => sum + s.evidenceMaps.filter(m => m.evidenceId).length, 0);

    // Gate checks
    if (validation.missingCriticalContent) {
      blockingReasons.push('ناوەڕۆکی سەرەکی توێژینەوەکە بە شێوەیەکی تێکچوو یان زۆر کەم نیشان دراوە.');
    }

    if (validation.errors.length > 0) {
      blockingReasons.push(...validation.errors);
    }

    let status: 'PASS' | 'PASS_WITH_WARNINGS' | 'BLOCKED' = 'PASS';
    let isPassed = true;

    if (blockingReasons.length > 0) {
      status = 'BLOCKED';
      isPassed = false;
    } else if (warnings.length > 0) {
      status = 'PASS_WITH_WARNINGS';
    }

    return {
      status,
      isPassed,
      traceableClaimsPercentage,
      preservedCitationsCount,
      preservedEvidenceCount,
      warnings,
      blockingReasons
    };
  }
}
