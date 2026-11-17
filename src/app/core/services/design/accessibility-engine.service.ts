import { Injectable } from '@angular/core';
import { SlideDesignSpec, DesignFinding } from '../../models/slide-design.model';

@Injectable({
  providedIn: 'root'
})
export class AccessibilityEngineService {
  /**
   * Audits slide design against WCAG and accessibility standards.
   */
  auditAccessibility(slideSpec: SlideDesignSpec): {
    passed: boolean;
    contrastPassed: boolean;
    altTextPassed: boolean;
    fontSizePassed: boolean;
    findings: DesignFinding[];
  } {
    const findings: DesignFinding[] = [];
    let contrastPassed = true;
    let altTextPassed = true;
    let fontSizePassed = true;

    // 1. Audit Text Elements Font Sizes
    for (const el of slideSpec.elements) {
      if (el.kind === 'text') {
        if (el.data.fontPt < 11 && el.data.type !== 'footnote') {
          fontSizePassed = false;
          findings.push({
            id: `acc_font_${slideSpec.slideNumber}_${el.data.id}`,
            severity: 'warning',
            category: 'accessibility',
            message: `قەبارەی فۆنت (${el.data.fontPt}pt) کەمترە لە ئاستی ستانداردی بەکارهێنەرانی خاوەن پێداویستی تایبەت (11pt).`,
            slideNumber: slideSpec.slideNumber,
            elementId: el.data.id
          });
        }
      }

      // 2. Audit Image Alt Text
      if (el.kind === 'image') {
        if (!el.data.altText || el.data.altText.trim() === '' || el.data.altText === 'unknown') {
          altTextPassed = false;
          findings.push({
            id: `acc_alt_${slideSpec.slideNumber}_${el.data.id}`,
            severity: 'warning',
            category: 'accessibility',
            message: `وێنەکە خاوەنی دەقی جێگرەوە (Alt Text) ی ڕوون نییە بۆ شاشەخوێنەکان.`,
            slideNumber: slideSpec.slideNumber,
            elementId: el.data.id
          });
        }
      }

      // 3. Audit Chart Labeling
      if (el.kind === 'chart') {
        if (!el.data.labels || el.data.labels.length === 0) {
          findings.push({
            id: `acc_chart_${slideSpec.slideNumber}_${el.data.id}`,
            severity: 'warning',
            category: 'accessibility',
            message: `چارتەکە خاوەنی ناونیشانی ناوچەییی ڕوون نییە و پشت تەنها بە ڕەنگ دەبەستێت.`,
            slideNumber: slideSpec.slideNumber,
            elementId: el.data.id
          });
        }
      }
    }

    // 4. Color contrast check against theme
    const bgHex = slideSpec.theme?.backgroundColor?.hex || '#FFFFFF';
    const textHex = slideSpec.theme?.textColor?.hex || '#000000';
    const contrastRatio = this.calculateContrastRatio(bgHex, textHex);

    if (contrastRatio < 4.5) {
      contrastPassed = false;
      findings.push({
        id: `acc_contrast_${slideSpec.slideNumber}`,
        severity: 'critical',
        category: 'contrast',
        message: `ڕێژەی پێچەوانەی ڕەنگەکان (Contrast Ratio: ${contrastRatio.toFixed(2)}) لە ئاستی WCAG AA (4.5:1) نزمترە.`,
        slideNumber: slideSpec.slideNumber
      });
    }

    const passed = contrastPassed && altTextPassed && fontSizePassed && findings.length === 0;

    return {
      passed,
      contrastPassed,
      altTextPassed,
      fontSizePassed,
      findings
    };
  }

  /**
   * Helper to compute WCAG relative contrast ratio between two hex colors.
   */
  private calculateContrastRatio(hex1: string, hex2: string): number {
    const l1 = this.getLuminance(hex1);
    const l2 = this.getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  private getLuminance(hex: string): number {
    const cleaned = hex.replace('#', '');
    const r = parseInt(cleaned.substring(0, 2) || '00', 16) / 255;
    const g = parseInt(cleaned.substring(2, 4) || '00', 16) / 255;
    const b = parseInt(cleaned.substring(4, 6) || '00', 16) / 255;

    const a = [r, g, b].map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
}
