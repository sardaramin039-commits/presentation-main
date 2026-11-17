import { Injectable } from '@angular/core';
import {
  SlidePlan,
  SlideLayoutSpec,
  LayoutType,
  LayoutZone
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class SlideLayoutService {
  /**
   * Generates a complete layout specification for a slide based on SlidePlan.
   */
  generateLayoutSpec(slide: SlidePlan, isRtl = true): SlideLayoutSpec {
    const layoutType = this.determineLayoutType(slide);
    const zones = this.buildZonesForLayout(layoutType, slide, isRtl);
    const columnCount = this.determineColumnCount(layoutType);
    const visualEmphasisZone = this.determineEmphasisZone(layoutType, zones);
    const capacityScore = this.calculateCapacityScore(slide, zones);

    return {
      layoutType,
      zones,
      alignment: isRtl ? 'right' : 'left',
      columnCount,
      contentCapacityScore: capacityScore,
      visualEmphasisZone,
      rtl: isRtl
    };
  }

  private determineLayoutType(slide: SlidePlan): LayoutType {
    if (slide.slideType === 'title') return 'title_only';
    if (slide.slideType === 'reference') return 'references';
    if (slide.slideType === 'conclusion') return 'conclusion';
    if (slide.slideType === 'methodology') return 'methodology';

    if (slide.dataVizType === 'line_chart' || slide.dataVizType === 'bar_chart' || slide.dataVizType === 'pie_chart') {
      return 'chart';
    }
    if (slide.dataVizType === 'table') return 'table';
    if (slide.dataVizType === 'timeline') return 'timeline';
    if (slide.dataVizType === 'comparison_matrix') return 'comparison';

    if (slide.layoutIntent === 'two_column') return 'two_column';
    if (slide.layoutIntent === 'three_column') return 'three_column';
    if (slide.layoutIntent === 'quote_highlight') return 'quote';
    if (slide.imageRequired) return 'image_text';

    if (slide.contentPlan.blocks.some(b => b.type === 'statistic')) return 'statistic';

    return 'title_content';
  }

  private determineColumnCount(layoutType: LayoutType): number {
    switch (layoutType) {
      case 'two_column':
      case 'comparison':
      case 'image_text':
        return 2;
      case 'three_column':
        return 3;
      default:
        return 1;
    }
  }

  private determineEmphasisZone(layoutType: LayoutType, zones: LayoutZone[]): string {
    const visualZone = zones.find(z => z.type === 'visual_container');
    if (visualZone) return visualZone.id;
    const mainZone = zones.find(z => z.type === 'main_content');
    if (mainZone) return mainZone.id;
    return zones[0]?.id || 'header_zone';
  }

  private buildZonesForLayout(layoutType: LayoutType, slide: SlidePlan, isRtl: boolean): LayoutZone[] {
    const blockIds = slide.contentPlan.blocks.map(b => b.id);
    const citationIds = slide.citationMaps.map(c => c.citationId);

    const zones: LayoutZone[] = [
      {
        id: 'header_zone',
        name: 'Header Zone',
        type: 'header',
        bounds: { topPct: 5, leftPct: 5, widthPct: 90, heightPct: 15 },
        capacity: { maxWords: 20 },
        contentIds: []
      }
    ];

    if (layoutType === 'two_column' || layoutType === 'comparison') {
      const leftContentIds = blockIds.slice(0, Math.ceil(blockIds.length / 2));
      const rightContentIds = blockIds.slice(Math.ceil(blockIds.length / 2));

      zones.push({
        id: 'col_1_zone',
        name: isRtl ? 'ڕاست (کۆڵۆمی ۱)' : 'Left Column',
        type: 'main_content',
        bounds: isRtl
          ? { topPct: 22, leftPct: 52, widthPct: 43, heightPct: 65 }
          : { topPct: 22, leftPct: 5, widthPct: 43, heightPct: 65 },
        capacity: { maxWords: 120, maxBullets: 4 },
        contentIds: isRtl ? rightContentIds : leftContentIds
      });

      zones.push({
        id: 'col_2_zone',
        name: isRtl ? 'چەپ (کۆڵۆمی ۲)' : 'Right Column',
        type: 'secondary_content',
        bounds: isRtl
          ? { topPct: 22, leftPct: 5, widthPct: 43, heightPct: 65 }
          : { topPct: 22, leftPct: 52, widthPct: 43, heightPct: 65 },
        capacity: { maxWords: 120, maxBullets: 4 },
        contentIds: isRtl ? leftContentIds : rightContentIds
      });
    } else if (layoutType === 'three_column') {
      const third = Math.ceil(blockIds.length / 3);
      zones.push({
        id: 'col_1_zone',
        name: 'Column 1',
        type: 'main_content',
        bounds: { topPct: 22, leftPct: 5, widthPct: 28, heightPct: 65 },
        capacity: { maxWords: 80, maxBullets: 3 },
        contentIds: blockIds.slice(0, third)
      });
      zones.push({
        id: 'col_2_zone',
        name: 'Column 2',
        type: 'secondary_content',
        bounds: { topPct: 22, leftPct: 36, widthPct: 28, heightPct: 65 },
        capacity: { maxWords: 80, maxBullets: 3 },
        contentIds: blockIds.slice(third, third * 2)
      });
      zones.push({
        id: 'col_3_zone',
        name: 'Column 3',
        type: 'secondary_content',
        bounds: { topPct: 22, leftPct: 67, widthPct: 28, heightPct: 65 },
        capacity: { maxWords: 80, maxBullets: 3 },
        contentIds: blockIds.slice(third * 2)
      });
    } else if (layoutType === 'chart' || layoutType === 'table' || layoutType === 'timeline' || layoutType === 'image_text') {
      zones.push({
        id: 'text_zone',
        name: 'Text Content Zone',
        type: 'main_content',
        bounds: isRtl
          ? { topPct: 22, leftPct: 50, widthPct: 45, heightPct: 65 }
          : { topPct: 22, leftPct: 5, widthPct: 45, heightPct: 65 },
        capacity: { maxWords: 100, maxBullets: 4 },
        contentIds: blockIds
      });
      zones.push({
        id: 'visual_zone',
        name: 'Visual Asset Zone',
        type: 'visual_container',
        bounds: isRtl
          ? { topPct: 22, leftPct: 5, widthPct: 42, heightPct: 65 }
          : { topPct: 22, leftPct: 53, widthPct: 42, heightPct: 65 },
        capacity: { maxItems: 1 },
        contentIds: []
      });
    } else {
      zones.push({
        id: 'main_content_zone',
        name: 'Main Content Zone',
        type: 'main_content',
        bounds: { topPct: 22, leftPct: 5, widthPct: 90, heightPct: 65 },
        capacity: { maxWords: 200, maxBullets: 6 },
        contentIds: blockIds
      });
    }

    if (citationIds.length > 0 || slide.citationMaps.length > 0) {
      zones.push({
        id: 'citation_bar_zone',
        name: 'Citation Bar',
        type: 'citation_bar',
        bounds: { topPct: 88, leftPct: 5, widthPct: 90, heightPct: 8 },
        capacity: { maxWords: 40 },
        contentIds: citationIds
      });
    }

    return zones;
  }

  private calculateCapacityScore(slide: SlidePlan, zones: LayoutZone[]): number {
    const totalWords = slide.contentPlan.blocks.reduce((sum, b) => sum + b.text.split(/\s+/).length, 0);
    const maxCapacity = zones.reduce((sum, z) => sum + (z.capacity.maxWords || 150), 0);
    if (maxCapacity === 0) return 100;

    const ratio = totalWords / maxCapacity;
    if (ratio <= 0.8) return 100;
    if (ratio <= 1.0) return 85;
    if (ratio <= 1.2) return 65;
    return Math.max(20, Math.round(100 - (ratio - 1) * 100));
  }
}
