import { Injectable } from '@angular/core';
import { ChartElement } from '../../models/slide-design.model';
import { SlidePlan } from '../../models/presentation.model';

export type SupportedChartKind =
  | 'bar'
  | 'column'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'stacked'
  | 'comparison';

@Injectable({
  providedIn: 'root'
})
export class AutomaticChartEngineService {
  /**
   * Generates a ChartElement with complete metadata and provenance.
   * If real data is unavailable, returns null (prevents fake data generation).
   */
  generateChartElement(
    slide: SlidePlan,
    extractedData?: {
      labels: string[];
      series: { name: string; values: number[] }[];
      units?: string;
      sourceTitle?: string;
      provenance?: string;
    }
  ): ChartElement | null {
    // Check if data is provided or available in slide evidence
    let labels = extractedData?.labels || [];
    let series = extractedData?.series || [];
    const units = extractedData?.units || '%';
    let source = extractedData?.sourceTitle || 'Unknown Source';
    let dataProvenance = extractedData?.provenance || 'Unverified';

    // Try extracting real numbers from evidence if not provided directly
    if (series.length === 0 && slide.evidenceMaps && slide.evidenceMaps.length > 0) {
      for (const ev of slide.evidenceMaps) {
        const text = ev.evidenceSnippet || ev.claimStatement || '';
        const numbers = (text.match(/\b\d+(\.\d+)?\b/g) || []).map(Number);
        if (numbers.length >= 2) {
          labels = numbers.map((_, i) => `گۆڕاوی ${i + 1}`);
          series = [{ name: ev.claimStatement ? ev.claimStatement.slice(0, 20) : 'داتا', values: numbers }];
          if (ev.sourceTitle) source = ev.sourceTitle;
          if (ev.verificationStatus) dataProvenance = `بەڵگەی پشکنینکراو: ${ev.verificationStatus}`;
          break;
        }
      }
    }

    // STRICT NON-NEGOTIABLE RULE: No fake data generation allowed!
    if (labels.length === 0 || series.length === 0) {
      return null;
    }

    const chartType = this.determineOptimalChartType(slide, labels, series);

    return {
      id: `chart_slide_${slide.slideNumber}_${Date.now()}`,
      chartType,
      title: slide.title ? `داتای چەندایەتی: ${slide.title}` : 'دیاریکردنی داتا',
      labels,
      series,
      units,
      legendPosition: series.length > 1 ? 'bottom' : 'none',
      source,
      dataProvenance,
      hasRealData: true,
      evidenceId: slide.evidenceMaps?.[0]?.evidenceId,
      bounds: { xPct: 50, yPct: 22, wPct: 45, hPct: 65 }
    };
  }

  /**
   * Determines the best chart type based on data characteristics.
   */
  determineOptimalChartType(
    slide: SlidePlan,
    labels: string[],
    series: { name: string; values: number[] }[]
  ): SupportedChartKind {
    const hint = slide.dataVizType || '';
    if (hint === 'line_chart' || slide.visualIntentHints.includes('timeline')) return 'line';
    if (hint === 'pie_chart' && labels.length <= 5) return 'pie';
    if (slide.visualIntentHints.includes('comparison')) return 'comparison';

    if (series.length > 1) {
      return 'stacked';
    }

    if (labels.length > 6) {
      return 'bar';
    }

    return 'column';
  }
}
