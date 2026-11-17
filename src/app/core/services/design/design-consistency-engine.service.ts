import { Injectable } from '@angular/core';
import { SlideDesignSpec, ThemeSpec, DesignFinding } from '../../models/slide-design.model';

@Injectable({
  providedIn: 'root'
})
export class DesignConsistencyEngineService {
  /**
   * Enforces global design system consistency across all slides while allowing layout flexibility.
   */
  normalizePresentationDesign(slides: SlideDesignSpec[], globalTheme: ThemeSpec): {
    slides: SlideDesignSpec[];
    consistencyScore: number;
    findings: DesignFinding[];
  } {
    const findings: DesignFinding[] = [];
    let mismatchedThemes = 0;

    const updatedSlides = slides.map(slide => {
      // 1. Enforce Theme Uniformity
      if (slide.theme.id !== globalTheme.id) {
        mismatchedThemes++;
        slide.theme = globalTheme;
      }

      // 2. Enforce Typography Hierarchy
      slide.typography.titleFont = globalTheme.fontFamilyTitle;
      slide.typography.bodyFont = globalTheme.fontFamilyBody;

      // 3. Ensure Page Numbers / Footers are Present
      const hasFootnote = slide.elements.some(e => e.kind === 'text' && e.data.type === 'caption');
      if (!hasFootnote) {
        slide.elements.push({
          kind: 'text',
          data: {
            id: `page_num_${slide.slideNumber}`,
            type: 'caption',
            text: `${slide.slideNumber} / ${slides.length}`,
            direction: 'ltr',
            fontPt: 9,
            fontWeight: 'normal',
            colorHex: globalTheme.mutedTextColor.hex,
            align: 'left',
            bounds: { xPct: 5, yPct: 92, wPct: 15, hPct: 4 }
          }
        });
      }

      return slide;
    });

    if (mismatchedThemes > 0) {
      findings.push({
        id: `consist_theme_mismatch`,
        severity: 'info',
        category: 'consistency',
        message: `${mismatchedThemes} سلاید کە خاوەنی تیمی نایەکسان بوون بۆ ڕێکخستنی جێگیر گۆڕدران.`,
        slideNumber: 0,
        autoRepaired: true
      });
    }

    const consistencyScore = Math.max(0, 100 - mismatchedThemes * 10);

    return {
      slides: updatedSlides,
      consistencyScore,
      findings
    };
  }
}
