import { Injectable } from '@angular/core';
import { PresentationDesignSystem, AcademicLevel } from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class VisualDesignSystemService {
  /**
   * Generates a centralized, magic-number-free design system based on academic level and aspect ratio.
   */
  getDesignSystem(academicLevel: AcademicLevel = 'bachelor', aspectRatio: '16:9' | '4:3' = '16:9'): PresentationDesignSystem {
    const isPostgrad = academicLevel === 'postgrad';
    const isSchool = academicLevel === 'qutabxana';

    const titlePx = isSchool ? 44 : isPostgrad ? 36 : 40;
    const sectionTitlePx = isSchool ? 28 : isPostgrad ? 22 : 24;
    const bodyPx = isSchool ? 20 : isPostgrad ? 15 : 17;

    return {
      typography: {
        titlePx,
        sectionTitlePx,
        bodyPx,
        captionPx: 13,
        citationPx: 12,
        fontFamily: 'Vazirmatn, system-ui, sans-serif'
      },
      spacing: {
        paddingPx: 24,
        marginPx: 32,
        gapPx: 16,
        sectionGapPx: 28
      },
      grid: {
        columns: 12,
        gutterPx: 20,
        marginPx: aspectRatio === '16:9' ? 48 : 36,
        safeZoneMarginPct: 5
      },
      shapes: {
        borderRadiusPx: isPostgrad ? 8 : 12,
        borderWidthPx: 1,
        shadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
      },
      charts: {
        palette: ['#0f766e', '#0369a1', '#7c3aed', '#b45309', '#0d9488'],
        maxCategories: 6,
        showGridLines: true,
        legendPosition: 'bottom'
      },
      images: {
        defaultAspectRatio: aspectRatio,
        borderRadiusPx: 8,
        captionStyle: 'subtle'
      },
      citations: {
        placement: 'footer',
        style: 'academic'
      },
      hierarchy: {
        headingWeight: 700,
        bodyWeight: 400,
        primaryContrastRatio: 4.5
      }
    };
  }
}
