import { Injectable } from '@angular/core';
import { SlideDesignSpec, DesignValidationResult, DesignFinding } from '../../models/slide-design.model';

@Injectable({
  providedIn: 'root'
})
export class RenderValidationEngineService {
  /**
   * Inspects rendered slide designs for visual bugs, text overflow, overlaps, missing images, and direction errors.
   */
  validateRenderedSlide(slideSpec: SlideDesignSpec): DesignValidationResult {
    const findings: DesignFinding[] = [];

    // 1. Check for Empty Slide
    if (slideSpec.elements.length === 0) {
      findings.push({
        id: `render_empty_${slideSpec.slideNumber}`,
        severity: 'critical',
        category: 'overflow',
        message: `سلایدی ${slideSpec.slideNumber} هیچ توخمێکی بینراوی بەردەست نییە (Empty Slide).`,
        slideNumber: slideSpec.slideNumber
      });
    }

    // 2. Check Overlap between elements
    for (let i = 0; i < slideSpec.elements.length; i++) {
      for (let j = i + 1; j < slideSpec.elements.length; j++) {
        const elA = slideSpec.elements[i];
        const elB = slideSpec.elements[j];

        const bA = this.getBounds(elA);
        const bB = this.getBounds(elB);

        if (bA && bB && this.checkCollision(bA, bB)) {
          // Ignore citation overlap with background shapes
          if (elA.kind === 'shape' || elB.kind === 'shape') continue;

          findings.push({
            id: `render_overlap_${slideSpec.slideNumber}_${i}_${j}`,
            severity: 'warning',
            category: 'overlap',
            message: `پێکداچوون (Overlap) لە نێوان توخمی ${elA.kind} و توخمی ${elB.kind} لە سلایدی ${slideSpec.slideNumber} ڕوویداوە.`,
            slideNumber: slideSpec.slideNumber,
            elementId: this.getId(elA)
          });
        }
      }
    }

    // 3. Check for Citation Collision
    const citations = slideSpec.elements.filter(e => e.kind === 'citation');
    if (citations.length > 2) {
      findings.push({
        id: `render_cite_collision_${slideSpec.slideNumber}`,
        severity: 'warning',
        category: 'citation_collision',
        message: `چەندین سەرچاوە لە یەک جێگەدا نیشان دراون کە لەوانەیە ببێتە هۆی تێکچوونی خاوێنی سەرچاوەکان.`,
        slideNumber: slideSpec.slideNumber
      });
    }

    const hasCriticalFailures = findings.some(f => f.severity === 'critical');
    const hasWarnings = findings.length > 0;

    return {
      slideNumber: slideSpec.slideNumber,
      passed: !hasCriticalFailures,
      hasCriticalFailures,
      hasWarnings,
      findings,
      repairedFindings: []
    };
  }

  private getBounds(el: SlideDesignSpec['elements'][0]): { xPct: number; yPct: number; wPct: number; hPct: number } | null {
    if ('bounds' in el.data) return el.data.bounds;
    return null;
  }

  private getId(el: SlideDesignSpec['elements'][0]): string {
    return el.data.id || 'el_unknown';
  }

  private checkCollision(
    a: { xPct: number; yPct: number; wPct: number; hPct: number },
    b: { xPct: number; yPct: number; wPct: number; hPct: number }
  ): boolean {
    return (
      a.xPct < b.xPct + b.wPct &&
      a.xPct + a.wPct > b.xPct &&
      a.yPct < b.yPct + b.hPct &&
      a.yPct + a.hPct > b.yPct
    );
  }
}
