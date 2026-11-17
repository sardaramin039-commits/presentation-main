import { Injectable } from '@angular/core';
import {
  TypographySpec as PresentationTypographySpec,
  FontSpec,
  PresentationRequest
} from '../../models/presentation.model';
import { TypographySpec as SlideDesignTypographySpec } from '../../models/slide-design.model';

@Injectable({
  providedIn: 'root'
})
export class TypographyService {
  private readonly kurdishArabicRegex = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

  // ==========================================
  // ١. میتۆدە بنەڕەتییەکانی typography.service.ts
  // ==========================================

  /**
   * Generates typography specifications tailored to language, academic level, and text scaling needs.
   */
  generateTypographySpec(
    request: PresentationRequest,
    isRtl = true,
    scaleFactor = 1.0
  ): PresentationTypographySpec {
    const lang = request.language || 'ckb';
    const fontFamily = this.getFontFamilyForLanguage(lang);
    const direction = isRtl ? 'rtl' : 'ltr';
    const align = isRtl ? 'right' : 'left';

    const presentationTitle: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(44 * scaleFactor),
      fontWeight: 700,
      lineHeightEm: 1.2,
      letterSpacingEm: -0.02,
      colorCss: '#0f172a',
      alignment: 'center'
    };

    const slideTitle: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(32 * scaleFactor),
      fontWeight: 700,
      lineHeightEm: 1.25,
      letterSpacingEm: -0.01,
      colorCss: '#1e293b',
      alignment: align
    };

    const sectionTitle: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(24 * scaleFactor),
      fontWeight: 600,
      lineHeightEm: 1.3,
      letterSpacingEm: 0,
      colorCss: '#334155',
      alignment: align
    };

    const body: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(18 * scaleFactor),
      fontWeight: 400,
      lineHeightEm: 1.6,
      letterSpacingEm: 0,
      colorCss: '#334155',
      alignment: align
    };

    const caption: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(14 * scaleFactor),
      fontWeight: 400,
      lineHeightEm: 1.4,
      letterSpacingEm: 0,
      colorCss: '#64748b',
      alignment: align
    };

    const citation: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(13 * scaleFactor),
      fontWeight: 500,
      lineHeightEm: 1.35,
      letterSpacingEm: 0,
      colorCss: '#475569',
      alignment: align
    };

    const footnote: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(12 * scaleFactor),
      fontWeight: 400,
      lineHeightEm: 1.3,
      letterSpacingEm: 0,
      colorCss: '#94a3b8',
      alignment: align
    };

    const dataLabel: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(14 * scaleFactor),
      fontWeight: 600,
      lineHeightEm: 1.2,
      letterSpacingEm: 0.02,
      colorCss: '#0f172a',
      alignment: 'center'
    };

    const chartLabel: FontSpec = {
      fontFamily,
      fontSizePx: Math.round(12 * scaleFactor),
      fontWeight: 500,
      lineHeightEm: 1.2,
      letterSpacingEm: 0,
      colorCss: '#64748b',
      alignment: 'center'
    };

    return {
      language: lang,
      direction,
      presentationTitle,
      slideTitle,
      sectionTitle,
      body,
      caption,
      citation,
      footnote,
      dataLabel,
      chartLabel,
      overflowProtected: true
    };
  }

  public getFontFamilyForLanguage(lang: string): string {
    switch (lang.toLowerCase()) {
      case 'ckb':
      case 'ar':
      case 'fa':
        return `'Vazirmatn', 'Noto Naskh Arabic', 'Segoe UI', system-ui, sans-serif`;
      default:
        return `'Plus Jakarta Sans', 'Inter', system-ui, sans-serif`;
    }
  }

  /**
   * Adjusts typography font size downwards if text density threatens overflow.
   */
  getScaledTypography(spec: PresentationTypographySpec, reductionRatio: number): PresentationTypographySpec {
    const factor = Math.max(0.75, Math.min(1.0, 1.0 - reductionRatio));
    return {
      ...spec,
      slideTitle: { ...spec.slideTitle, fontSizePx: Math.round(spec.slideTitle.fontSizePx * factor) },
      body: { ...spec.body, fontSizePx: Math.round(spec.body.fontSizePx * factor) },
      caption: { ...spec.caption, fontSizePx: Math.round(spec.caption.fontSizePx * factor) },
      citation: { ...spec.citation, fontSizePx: Math.round(spec.citation.fontSizePx * factor) }
    };
  }

  // ==========================================
  // ٢. میتۆدە گوازراوەکانی typography-engine.service.ts
  // ==========================================

  /**
   * Detects direction (RTL/LTR) based on text script.
   */
  detectDirection(text: string): 'rtl' | 'ltr' {
    if (!text || text.trim() === '') return 'rtl'; // Default for Sorani Kurdish app
    return this.kurdishArabicRegex.test(text) ? 'rtl' : 'ltr';
  }

  /**
   * Builds TypographySpec for a slide based on language and direction.
   */
  getTypographySpec(
    language: 'ckb' | 'ar' | 'fa' | 'en' | string = 'ckb',
    sampleText = ''
  ): SlideDesignTypographySpec {
    const direction = this.detectDirection(sampleText);
    const fontFallbackChain = [
      'Vazirmatn',
      'Noto Naskh Arabic',
      'Tahoma',
      'Segoe UI',
      'Calibri',
      'Arial',
      'sans-serif'
    ];

    const isRtl = direction === 'rtl';
    const primaryFont = isRtl ? 'Vazirmatn' : 'Calibri';

    return {
      language,
      direction,
      titleFont: primaryFont,
      bodyFont: primaryFont,
      fontFallbackChain,
      titleSizePt: 28,
      subtitleSizePt: 20,
      headingSizePt: 18,
      bodySizePt: 14,
      captionSizePt: 11,
      citationSizePt: 10,
      footnoteSizePt: 9,
      tableSizePt: 12,
      chartSizePt: 11,
      lineHeightEm: 1.4,
      overflowProtected: true
    };
  }

  /**
   * Evaluates text for potential overflow in a target bounding height/width.
   */
  evaluateTextOverflow(
    text: string,
    fontPt: number,
    boxWidthPct: number,
    boxHeightPct: number
  ): { isOverflow: boolean; estimatedLines: number; recommendedFontPt: number } {
    if (!text) return { isOverflow: false, estimatedLines: 0, recommendedFontPt: fontPt };

    // Rough conversion: 100% width on 13.33 inch slide is ~1200px
    const approxCharsPerLine = Math.max(10, Math.floor((boxWidthPct * 12) / (fontPt * 0.5)));
    const totalLines = Math.ceil(text.length / approxCharsPerLine) + (text.split('\n').length - 1);
    const requiredHeightPt = totalLines * (fontPt * 1.3);

    // Box height on 7.5 inch slide
    const availableHeightPt = (boxHeightPct / 100) * 7.5 * 72;

    const isOverflow = requiredHeightPt > availableHeightPt;
    let recommendedFontPt = fontPt;

    if (isOverflow) {
      recommendedFontPt = Math.max(10, Math.floor(fontPt * (availableHeightPt / requiredHeightPt)));
    }

    return {
      isOverflow,
      estimatedLines: totalLines,
      recommendedFontPt
    };
  }
}

// بۆ ئەوەی هەر فایلێک پێشتر TypographyEngineServiceـی بەکارهێناوە تووشی هەڵە نەبێت تا پاک دەکرێتەوە:
export { TypographyService as TypographyEngineService };
export type { PresentationTypographySpec, SlideDesignTypographySpec };
