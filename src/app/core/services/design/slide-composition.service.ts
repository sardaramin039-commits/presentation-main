import { Injectable } from '@angular/core';
import {
  SlidePlan,
  VisualComposition,
  VisualElement,
  LayoutBounds
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class SlideCompositionService {
  /**
   * Plans the visual composition and spatial layout regions of a slide dynamically based on content.
   */
  planComposition(slide: SlidePlan, visualElements: VisualElement[] = []): VisualComposition {
    const layoutPattern = this.determineLayoutPattern(slide, visualElements);
    const regions = this.calculateRegions(layoutPattern, visualElements.length > 0);

    const totalTextLength = (slide.title + ' ' + (slide.contentPlan?.explanation || '') + ' ' + slide.contentPlan?.blocks.map(b => b.text).join(' ')).length;
    const whitespacePct = visualElements.length > 0 ? 30 : 45;

    let cognitiveLoadStatus: VisualComposition['cognitiveLoadStatus'] = 'balanced';
    if (totalTextLength > 400 && visualElements.length >= 2) {
      cognitiveLoadStatus = 'overloaded';
    } else if (totalTextLength < 80 && visualElements.length === 0 && slide.slideType !== 'title') {
      cognitiveLoadStatus = 'underutilized';
    }

    return {
      slideNumber: slide.slideNumber,
      layoutPattern,
      titleRegion: regions.title,
      contentRegion: regions.content,
      visualRegion: regions.visual,
      evidenceRegion: regions.evidence,
      footerRegion: regions.footer,
      visualElements,
      whitespacePct,
      cognitiveLoadStatus
    };
  }

  private determineLayoutPattern(slide: SlidePlan, visualElements: VisualElement[]): string {
    if (slide.slideType === 'title') return 'title_only';
    if (slide.slideType === 'reference') return 'references';
    if (slide.slideType === 'comparison') return 'two_column';

    if (visualElements.some(v => v.type === 'timeline')) return 'timeline';
    if (visualElements.some(v => v.type === 'process' || v.type === 'flowchart')) return 'process';
    if (visualElements.some(v => v.type === 'bar_chart' || v.type === 'line_chart' || v.type === 'pie_chart')) return 'chart';
    if (visualElements.some(v => v.type === 'table')) return 'table';
    if (visualElements.some(v => v.type === 'image')) return 'image_text';

    return 'title_content';
  }

  private calculateRegions(pattern: string, hasVisual: boolean): {
    title: LayoutBounds;
    content: LayoutBounds;
    visual: LayoutBounds;
    evidence: LayoutBounds;
    footer: LayoutBounds;
  } {
    const footer: LayoutBounds = { topPct: 92, leftPct: 5, widthPct: 90, heightPct: 6 };
    const evidence: LayoutBounds = { topPct: 82, leftPct: 5, widthPct: 90, heightPct: 9 };

    if (pattern === 'title_only') {
      return {
        title: { topPct: 30, leftPct: 10, widthPct: 80, heightPct: 35 },
        content: { topPct: 65, leftPct: 15, widthPct: 70, heightPct: 20 },
        visual: { topPct: 0, leftPct: 0, widthPct: 0, heightPct: 0 },
        evidence,
        footer
      };
    }

    if (hasVisual || pattern === 'chart' || pattern === 'image_text' || pattern === 'two_column') {
      return {
        title: { topPct: 6, leftPct: 5, widthPct: 90, heightPct: 14 },
        content: { topPct: 22, leftPct: 5, widthPct: 43, heightPct: 58 },
        visual: { topPct: 22, leftPct: 51, widthPct: 44, heightPct: 58 },
        evidence,
        footer
      };
    }

    return {
      title: { topPct: 6, leftPct: 5, widthPct: 90, heightPct: 14 },
      content: { topPct: 22, leftPct: 8, widthPct: 84, heightPct: 58 },
      visual: { topPct: 0, leftPct: 0, widthPct: 0, heightPct: 0 },
      evidence,
      footer
    };
  }
}
