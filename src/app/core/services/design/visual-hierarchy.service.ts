import { Injectable } from '@angular/core';
import {
  SlidePlan,
  SlideLayoutSpec,
  VisualHierarchy
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class VisualHierarchyService {
  /**
   * Establishes a strict visual hierarchy for a given slide and layout.
   */
  establishHierarchy(slide: SlidePlan, layout: SlideLayoutSpec): VisualHierarchy {
    const primaryMessage = slide.title || 'سڵایدی ئەکادیمی';
    const secondaryMessage = slide.contentPlan.takeaway || slide.contentPlan.explanation || '';
    const supportingEvidence = slide.evidenceMaps[0]?.evidenceSnippet || '';
    const supportingVisual = slide.dataVizDescription || slide.imageDescription || '';
    const metadataText = slide.citationMaps.map(c => c.inText).join('; ');

    const focalPointZoneId = layout.visualEmphasisZone || layout.zones[0]?.id || 'header_zone';
    const readingOrder = this.determineReadingOrder(layout, focalPointZoneId);
    const emphasisLevels = this.assignEmphasisLevels(layout.zones, focalPointZoneId);
    const densityScore = this.calculateDensityScore(slide, layout);

    return {
      primaryMessage,
      secondaryMessage: secondaryMessage || undefined,
      supportingEvidence: supportingEvidence || undefined,
      supportingVisual: supportingVisual || undefined,
      metadataText: metadataText || undefined,
      focalPointZoneId,
      readingOrder,
      emphasisLevels,
      informationDensityScore: densityScore
    };
  }

  private determineReadingOrder(layout: SlideLayoutSpec, focalZoneId: string): string[] {
    const zones = [...layout.zones];
    const order: string[] = [];

    // Header zone first if present
    const header = zones.find(z => z.type === 'header');
    if (header) order.push(header.id);

    // Focal zone next if not already added
    if (focalZoneId && !order.includes(focalZoneId)) {
      order.push(focalZoneId);
    }

    // Sort remaining zones by spatial arrangement (RTL or LTR top-to-bottom, right-to-left or left-to-right)
    const remaining = zones.filter(z => !order.includes(z.id));
    remaining.sort((a, b) => {
      if (Math.abs(a.bounds.topPct - b.bounds.topPct) > 5) {
        return a.bounds.topPct - b.bounds.topPct;
      }
      return layout.rtl
        ? b.bounds.leftPct - a.bounds.leftPct
        : a.bounds.leftPct - b.bounds.leftPct;
    });

    remaining.forEach(z => order.push(z.id));
    return order;
  }

  private assignEmphasisLevels(
    zones: SlideLayoutSpec['zones'],
    focalZoneId: string
  ): Record<string, 'high' | 'medium' | 'low' | 'muted'> {
    const levels: Record<string, 'high' | 'medium' | 'low' | 'muted'> = {};

    zones.forEach(zone => {
      if (zone.id === focalZoneId || zone.type === 'header') {
        levels[zone.id] = 'high';
      } else if (zone.type === 'main_content' || zone.type === 'visual_container') {
        levels[zone.id] = 'medium';
      } else if (zone.type === 'secondary_content' || zone.type === 'subheader') {
        levels[zone.id] = 'low';
      } else {
        levels[zone.id] = 'muted';
      }
    });

    return levels;
  }

  private calculateDensityScore(slide: SlidePlan, layout: SlideLayoutSpec): number {
    const totalWords = slide.contentPlan.blocks.reduce((acc, b) => acc + b.text.split(/\s+/).length, 0);
    const totalBlocks = slide.contentPlan.blocks.length;
    const totalCitations = slide.citationMaps.length;

    const rawScore = totalWords * 0.4 + totalBlocks * 5 + totalCitations * 4;
    return Math.min(100, Math.round(rawScore / (layout.columnCount || 1)));
  }
}
