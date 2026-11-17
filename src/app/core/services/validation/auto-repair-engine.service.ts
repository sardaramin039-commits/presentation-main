import { Injectable } from '@angular/core';
import { SlideDesignSpec, DesignFinding } from '../../models/slide-design.model';

@Injectable({
  providedIn: 'root'
})
export class AutoRepairEngineService {
  /**
   * Automatically repairs design and layout issues STRICTLY in the design layer.
   * ABSOLUTELY PRESERVES claims, evidence, citations, sources, and factual text.
   */
  repairSlideDesign(slideSpec: SlideDesignSpec): {
    repairedSpec: SlideDesignSpec;
    repairedCount: number;
    repairs: DesignFinding[];
  } {
    const repairedSpec: SlideDesignSpec = JSON.parse(JSON.stringify(slideSpec));
    const repairs: DesignFinding[] = [];
    let repairedCount = 0;

    for (const finding of slideSpec.validation?.findings || []) {
      if (finding.category === 'overflow') {
        // Fix text overflow by reducing font size in Design Layer ONLY
        for (const el of repairedSpec.elements) {
          if (el.kind === 'text') {
            el.data.fontPt = Math.max(10, el.data.fontPt - 2);
            repairedCount++;
            repairs.push({
              ...finding,
              autoRepaired: true,
              repairDetails: `قەبارەی فۆنتی دەق بۆ ${el.data.fontPt}pt لە تەبەقەی دیزاین کەمکرایەوە. هەموو دەقە زانستییەکە پارێزراوە.`
            });
          }
        }
      } else if (finding.category === 'overlap') {
        // Fix element overlaps by repositioning visual elements in Design Layer ONLY
        for (const el of repairedSpec.elements) {
          if (el.kind === 'chart' || el.kind === 'image' || el.kind === 'table') {
            el.data.bounds.xPct = 52;
            el.data.bounds.wPct = 43;
            repairedCount++;
            repairs.push({
              ...finding,
              autoRepaired: true,
              repairDetails: `شوێنی توخمی بینراو بۆ x: 52% جێبەجێکرایەوە. هیچ داتایەک دەستکاری نەکرا.`
            });
          }
        }
      } else if (finding.category === 'citation_collision') {
        // Fix citation collision by adjusting vertical Y coordinates in Design Layer ONLY
        const citationEls = repairedSpec.elements.filter(e => e.kind === 'citation');
        citationEls.forEach((cEl, idx) => {
          if (cEl.kind === 'citation') {
            cEl.data.bounds.yPct = 86 + idx * 4;
            repairedCount++;
            repairs.push({
              ...finding,
              autoRepaired: true,
              repairDetails: `ڕێکخستنی شوێنی ڕوونی سەرچاوە #${idx + 1} بە بێ دەستکاریکردنی سەرچاوەکە.`
            });
          }
        });
      }
    }

    repairedSpec.validation.repairedFindings = repairs;

    return {
      repairedSpec,
      repairedCount,
      repairs
    };
  }
}
