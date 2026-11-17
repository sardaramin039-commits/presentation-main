import { Injectable } from '@angular/core';
import { LayoutCategory, VisualLayout } from '../../models/slide-design.model';
import { SlidePlan } from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class IntelligentLayoutEngineService {
  /**
   * Selects an explainable layout based on slide plan characteristics.
   */
  selectLayout(slide: SlidePlan, isRtl = true): { layout: VisualLayout; rationale: string } {
    let category: LayoutCategory = 'two_column';
    let rationale = '';

    const slideType = slide.slideType?.toLowerCase() || '';
    const purpose = slide.purpose?.toLowerCase() || '';
    const dataVizType = slide.dataVizType?.toLowerCase() || 'none';

    if (slideType === 'title' || purpose === 'introduce') {
      category = 'title';
      rationale = 'هەڵبژێردرا بۆ سلایدی سەرەتایی و ناساندن (Title Slide) بۆ دروستکردنی سەرنجی سەرەکی.';
    } else if (slideType === 'agenda' || slideType === 'context' || slideType === 'appendix') {
      category = 'section_divider';
      rationale = 'هەڵبژێردرا بۆ دابەشکردنی بەشەکان یان پێڕستی بەشەکان (Section Divider).';
    } else if (slideType === 'reference' || purpose === 'citesources') {
      category = 'references';
      rationale = 'هەڵبژێردرا بۆ پیشاندانی سەرچاوە زانستییەکان بە ڕێکی و پێوانەی ئەکادیمی (Academic References).';
    } else if (slideType === 'methodology') {
      category = 'methodology';
      rationale = 'هەڵبژێردرا بۆ ڕوونکردنەوەی قۆناغەکانی میتۆدۆلۆژی و ڕێکاری توێژینەوە (Methodology Layout).';
    } else if (slideType === 'conclusion' || purpose === 'conclude' || purpose === 'recommend') {
      category = 'conclusion';
      rationale = 'هەڵبژێردرا بۆ دەرئەنجام و ڕاهێنانی بەهێزی کۆتایی (Conclusion & Recommendations).';
    } else if (purpose === 'presentfinding' || slideType === 'finding') {
      category = 'key_finding';
      rationale = 'هەڵبژێردرا بۆ جەختکردنەوە لەسەر دۆزینەوەی سەرەکی توێژینەوەکە (Key Finding Highlight).';
    } else if (slide.visualIntentHints.includes('temporal') || slide.visualIntentHints.includes('timeline')) {
      category = 'timeline';
      rationale = 'هەڵبژێردرا بەهۆی بوونی زنجیرەی کاتی یان مێژوویی لە ناوەڕۆکدا (Temporal Timeline).';
    } else if (slide.visualIntentHints.includes('comparison') || slideType === 'comparison' || purpose === 'compare') {
      category = 'comparison';
      rationale = 'هەڵبژێردرا بەهۆی بەراوردکاری نێوان دوو یان زیاتر لە گۆڕاوەکان (Comparison Layout).';
    } else if (slide.visualIntentHints.includes('process') || purpose === 'demonstrate') {
      category = 'process';
      rationale = 'هەڵبژێردرا بۆ پیشاندانی قۆناغەکانی پڕۆسەیەک یان لۆجیکی ڕەوتەکە (Process Diagram).';
    } else if (slide.visualIntentHints.includes('hierarchy')) {
      category = 'hierarchy';
      rationale = 'هەڵبژێردرا بەهۆی پەیوەندی پلەبەند و پەیکەربەندی ناوەڕۆک (Hierarchy Layout).';
    } else if (dataVizType === 'table') {
      category = 'table';
      rationale = 'هەڵبژێردرا بۆ ڕێکخستنی خشتەی داتای ووردی بەڵگەدار (Table Layout).';
    } else if (dataVizType !== 'none' && dataVizType !== '') {
      category = 'chart';
      rationale = 'هەڵبژێردرا بۆ دراماتیکردنی چارت و داتای چەندایەتی (Chart Layout).';
    } else if (slide.visualIntentHints.includes('quote')) {
      category = 'quote';
      rationale = 'هەڵبژێردرا بۆ پیشاندانی وتەی زانستی یان دەقی بەڵگەیی بە شێوازێکی بڵند (Quote Layout).';
    } else if (slide.imageRequired || slide.imageDescription) {
      category = 'text_image';
      rationale = 'هەڵبژێردرا بۆ ڕێکخستنی دەق لەگەڵ وێنەی بەڵگەنامەیی یان دیاگرام (Text + Image Layout).';
    } else if (slide.contentPlan?.blocks?.length >= 5) {
      category = 'three_column';
      rationale = 'هەڵبژێردرا بۆ دروستکردنی سێ کۆڵۆمی جیاواز بۆ دابەشکردنی چڕیی ناوەڕۆک (Three Column).';
    } else {
      category = 'two_column';
      rationale = 'هەڵبژێردرا وەک دیزاینی هاوسەنگی ستاندارد بۆ دەق و بەڵگەنامەکان (Two Column Standard).';
    }

    const layout = this.buildLayoutZones(category, isRtl, rationale);
    return { layout, rationale };
  }

  private buildLayoutZones(category: LayoutCategory, rtl: boolean, rationale: string): VisualLayout {
    const zones: VisualLayout['zones'] = [
      { id: 'header', type: 'header', bounds: { xPct: 5, yPct: 5, wPct: 90, hPct: 15 } },
      { id: 'footnote', type: 'footnote', bounds: { xPct: 5, yPct: 90, wPct: 50, hPct: 5 } },
      { id: 'citation', type: 'citation', bounds: { xPct: 55, yPct: 90, wPct: 40, hPct: 5 } }
    ];

    let columnCount = 1;

    switch (category) {
      case 'title':
        zones.push({ id: 'main', type: 'main', bounds: { xPct: 10, yPct: 25, wPct: 80, hPct: 60 } });
        break;
      case 'section_divider':
        zones.push({ id: 'main', type: 'main', bounds: { xPct: 15, yPct: 30, wPct: 70, hPct: 50 } });
        break;
      case 'text_image':
        columnCount = 2;
        if (rtl) {
          zones.push({ id: 'main', type: 'main', bounds: { xPct: 45, yPct: 22, wPct: 50, hPct: 65 } });
          zones.push({ id: 'visual', type: 'visual', bounds: { xPct: 5, yPct: 22, wPct: 35, hPct: 65 } });
        } else {
          zones.push({ id: 'main', type: 'main', bounds: { xPct: 5, yPct: 22, wPct: 50, hPct: 65 } });
          zones.push({ id: 'visual', type: 'visual', bounds: { xPct: 60, yPct: 22, wPct: 35, hPct: 65 } });
        }
        break;
      case 'three_column':
        columnCount = 3;
        zones.push({ id: 'col1', type: 'main', bounds: { xPct: 5, yPct: 22, wPct: 28, hPct: 65 } });
        zones.push({ id: 'col2', type: 'secondary', bounds: { xPct: 36, yPct: 22, wPct: 28, hPct: 65 } });
        zones.push({ id: 'col3', type: 'visual', bounds: { xPct: 67, yPct: 22, wPct: 28, hPct: 65 } });
        break;
      case 'chart':
      case 'table':
      case 'timeline':
      case 'process':
      case 'hierarchy':
      case 'matrix':
        columnCount = 2;
        if (rtl) {
          zones.push({ id: 'main', type: 'main', bounds: { xPct: 50, yPct: 22, wPct: 45, hPct: 65 } });
          zones.push({ id: 'visual', type: 'visual', bounds: { xPct: 5, yPct: 22, wPct: 42, hPct: 65 } });
        } else {
          zones.push({ id: 'main', type: 'main', bounds: { xPct: 5, yPct: 22, wPct: 45, hPct: 65 } });
          zones.push({ id: 'visual', type: 'visual', bounds: { xPct: 53, yPct: 22, wPct: 42, hPct: 65 } });
        }
        break;
      case 'quote':
      case 'key_finding':
        zones.push({ id: 'main', type: 'main', bounds: { xPct: 10, yPct: 25, wPct: 80, hPct: 60 } });
        break;
      case 'references':
        zones.push({ id: 'main', type: 'main', bounds: { xPct: 5, yPct: 22, wPct: 90, hPct: 65 } });
        break;
      default: // two_column
        columnCount = 2;
        zones.push({ id: 'main', type: 'main', bounds: { xPct: 52, yPct: 22, wPct: 43, hPct: 65 } });
        zones.push({ id: 'secondary', type: 'secondary', bounds: { xPct: 5, yPct: 22, wPct: 43, hPct: 65 } });
        break;
    }

    return {
      layoutCategory: category,
      name: category.replace('_', ' ').toUpperCase(),
      explanation: rationale,
      columnCount,
      rtl,
      zones
    };
  }
}
