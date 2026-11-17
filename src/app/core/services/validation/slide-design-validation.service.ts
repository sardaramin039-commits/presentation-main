import { Injectable, inject } from '@angular/core';
import {
  SlideDesignSpec,
  DesignValidationResult,
  DesignFinding,
  SlidePlan
} from '../../models/presentation.model';
import { SlideDensityService } from '../slide-density.service';
import { VisualBalanceService } from '../visual-balance.service';
import { ColorSystemService } from '../color-system.service';

@Injectable({
  providedIn: 'root'
})
export class SlideDesignValidationService {
  private densityService = inject(SlideDensityService, { optional: true }) ?? new SlideDensityService();
  private balanceService = inject(VisualBalanceService, { optional: true }) ?? new VisualBalanceService();
  private colorService = inject(ColorSystemService, { optional: true }) ?? new ColorSystemService();

  /**
   * Validates the complete visual design spec of a single slide.
   */
  validateSlideDesign(slideSpec: SlideDesignSpec, originalSlidePlan: SlidePlan): DesignValidationResult {
    const findings: DesignFinding[] = [];

    // 1. Density analysis
    const densityResult = this.densityService.analyzeDensity(originalSlidePlan);
    findings.push(...densityResult.findings);

    // 2. Balance analysis
    const balanceResult = this.balanceService.evaluateBalance(slideSpec);
    findings.push(...balanceResult.findings);

    // 3. Contrast check
    const contrastRatio = this.colorService.evaluateContrast(
      slideSpec.colorPalette.text,
      slideSpec.colorPalette.surface
    );
    const contrastPass = contrastRatio >= 4.5;
    if (!contrastPass) {
      findings.push({
        id: `contrast_${slideSpec.slideNumber}`,
        slideNumber: slideSpec.slideNumber,
        category: 'contrast',
        severity: 'critical',
        message: `تۆخایی و کونتراستی دەقی سڵایدی ${slideSpec.slideNumber} نزمترە لە ستانداردی AA.`,
        location: 'ڕەنگی دەق و پاشبنەما',
        rationale: 'کونتراستی نزم خوێندنەوەی دەق ئاڵۆز دەکات.',
        recommendation: 'ڕەنگی دەقەکان بەرامبەر پاشبنەمای سڵاید تۆختر بکەرەوە.'
      });
    }

    // 4. Citation Visibility & Provenance Integrity Check
    const hasCitations = slideSpec.layout.zones.some(z => z.type === 'citation_bar');
    const citationVisible = originalSlidePlan.citationMaps.length === 0 || hasCitations;

    if (!citationVisible) {
      findings.push({
        id: `citation_vis_${slideSpec.slideNumber}`,
        slideNumber: slideSpec.slideNumber,
        category: 'citation_visibility',
        severity: 'major',
        message: `سڵایدی ${slideSpec.slideNumber} ژێدەری تێدایە بەڵام زۆنی پێشاندانی ژێدەرەکان (Citation Bar) لە دیزاینەکەدا دیاری نەکراوە.`,
        location: 'پێپەڕەی سڵاید (Footer)',
        rationale: 'ژێدەرەکان دەبێت بە ڕوونی لەسەر سڵاید دەربکەون بۆ پاراستنی ئەمانەتی زانستی.',
        recommendation: 'زۆنی Citation Bar بگەڕێنەرەوە بۆ خوارەوەی سڵاید.'
      });
    }

    const provenanceIntact = originalSlidePlan.evidenceMaps.every(m => !!m.claimId);
    if (!provenanceIntact) {
      findings.push({
        id: `provenance_${slideSpec.slideNumber}`,
        slideNumber: slideSpec.slideNumber,
        category: 'provenance_integrity',
        severity: 'critical',
        message: `پەیوەندی بەڵگە و بانگەشەکان (Provenance) لە سڵایدی ${slideSpec.slideNumber} بە تەواوی نەپارێزراوە.`,
        location: 'نەخشەی بەڵگەکان (Evidence Maps)',
        rationale: 'تێکچوونی سەرچاوەی بەڵگەکان بڕواپێکراوی سڵایدەکە کەمدەکاتەوە.',
        recommendation: 'پەیوەندی ClaimId و EvidenceId دووبارە بەستنەوە بکەرەوە.'
      });
    }

    // Determine status
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const majorCount = findings.filter(f => f.severity === 'major').length;

    let status: 'pass' | 'pass_with_warnings' | 'needs_revision' | 'critical_revision' = 'pass';
    if (criticalCount > 0) {
      status = 'critical_revision';
    } else if (majorCount > 0) {
      status = 'needs_revision';
    } else if (findings.length > 0) {
      status = 'pass_with_warnings';
    }

    return {
      slideNumber: slideSpec.slideNumber,
      status,
      overflowRisk: densityResult.densityStatus === 'overloaded',
      densityStatus: densityResult.densityStatus,
      contrastPass,
      hierarchyValid: !!slideSpec.visualHierarchy.focalPointZoneId,
      citationVisible,
      provenanceIntact,
      findings
    };
  }
}
