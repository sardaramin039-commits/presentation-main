import { Injectable } from '@angular/core';
import {
  GridSpec,
  SpacingSpec,
  GridGuide
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class LayoutGridService {
  /**
   * Generates a 16:9 standard slide grid and spacing configuration.
   */
  generateGridSpec(
    columnCount = 2,
    slideWidthPx = 1920,
    slideHeightPx = 1080
  ): GridSpec {
    const margin = Math.round(slideWidthPx * 0.05); // 5% margin (96px at 1920)
    const topMargin = Math.round(slideHeightPx * 0.05); // 54px at 1080

    const safeZone = {
      top: topMargin,
      left: margin,
      right: slideWidthPx - margin,
      bottom: slideHeightPx - topMargin
    };

    const contentWidth = slideWidthPx - margin * 2;
    const gutterWidthPx = 32;
    const totalGutters = (columnCount - 1) * gutterWidthPx;
    const columnWidthPx = Math.floor((contentWidth - totalGutters) / columnCount);

    const verticalRhythmPx = 24;

    const alignmentGuides: GridGuide[] = [];
    // Vertical column guides
    for (let i = 0; i < columnCount; i++) {
      const colLeft = margin + i * (columnWidthPx + gutterWidthPx);
      alignmentGuides.push({ type: 'vertical', positionPx: colLeft });
      alignmentGuides.push({ type: 'vertical', positionPx: colLeft + columnWidthPx });
    }

    // Horizontal guides for header and footer
    alignmentGuides.push({ type: 'horizontal', positionPx: Math.round(slideHeightPx * 0.20) }); // Header baseline
    alignmentGuides.push({ type: 'horizontal', positionPx: Math.round(slideHeightPx * 0.88) }); // Citation/Footer baseline

    return {
      slideWidthPx,
      slideHeightPx,
      margins: { top: topMargin, right: margin, bottom: topMargin, left: margin },
      safeZone,
      columns: columnCount,
      columnWidthPx,
      gutterWidthPx,
      verticalRhythmPx,
      alignmentGuides
    };
  }

  /**
   * Generates spacing specifications based on slide density preferences.
   */
  generateSpacingSpec(scaleFactor = 1.0): SpacingSpec {
    const basePadding = 24;
    const baseMargin = 32;
    const baseItemGap = 16;
    const baseSectionGap = 32;

    return {
      paddingPx: Math.round(basePadding * scaleFactor),
      marginPx: Math.round(baseMargin * scaleFactor),
      itemGapPx: Math.round(baseItemGap * scaleFactor),
      sectionGapPx: Math.round(baseSectionGap * scaleFactor),
      scaleFactor
    };
  }
}
