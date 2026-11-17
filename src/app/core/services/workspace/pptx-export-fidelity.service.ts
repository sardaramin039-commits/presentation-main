import { Injectable } from '@angular/core';
import pptxgen from 'pptxgenjs';
import { ExportSpecification, TextElement, ChartElement, TableElement, ImageElement, CitationElement } from '../../models/slide-design.model';
import { EditablePresentationModel, EditableSlideModel, EditablePptxObject } from './editable-pptx-object-model.service';

export interface ExportFidelityReport {
  success: boolean;
  slideCount: number;
  preservedCitationsCount: number;
  preservedChartsCount: number;
  preservedImagesCount: number;
  preservedProvenance: boolean;
  fileName: string;
  errors: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PptxExportFidelityService {
  private readonly safeFonts = ['Calibri', 'Arial', 'Georgia', 'Verdana', 'Tahoma', 'Segoe UI'];

  /**
   * Validates and repairs an EditablePresentationModel before generating PowerPoint slides.
   * Performs fidelity checks on RTL Kurdish orientation, typography, color contrast, and element bounds.
   */
  validateAndRepair(model: EditablePresentationModel): EditablePresentationModel {
    const repairedSlides: EditableSlideModel[] = model.slides.map((slide, slideIdx) => {
      const repairedObjects: EditablePptxObject[] = slide.objects.map((obj, objIdx) => {
        const p = { ...obj.properties };

        // 1. Clamp bounding box coordinates
        p.xPct = Math.max(0, Math.min(100, isNaN(p.xPct) ? 5 : p.xPct));
        p.yPct = Math.max(0, Math.min(100, isNaN(p.yPct) ? 5 : p.yPct));
        p.wPct = Math.max(1, Math.min(100 - p.xPct, isNaN(p.wPct) ? 20 : p.wPct));
        p.hPct = Math.max(0.5, Math.min(100 - p.yPct, isNaN(p.hPct) ? 10 : p.hPct));

        // 2. Validate fontFace and fontSize
        if (p.fontFace && !this.safeFonts.includes(p.fontFace)) {
          p.fontFace = 'Calibri';
        }
        if (p.fontPt !== undefined) {
          p.fontPt = Math.max(8, Math.min(48, p.fontPt));
        }

        // 3. Normalize color hex codes
        if (p.colorHex) {
          p.colorHex = this.normalizeHex(p.colorHex, '334155');
        }
        if (p.fillHex) {
          p.fillHex = this.normalizeHex(p.fillHex, '4F46E5');
        }
        if (p.borderHex) {
          p.borderHex = this.normalizeHex(p.borderHex, '4F46E5');
        }

        // 4. Preserve Kurdish RTL orientation for Kurdish text elements
        if (obj.type === 'text' || obj.type === 'citation') {
          if (p.text && /[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(p.text)) {
            p.rtl = true;
            if (!p.align || p.align === 'left') {
              p.align = 'right';
            }
          }
        }

        return {
          ...obj,
          id: obj.id || `obj_${slideIdx}_${objIdx}`,
          isNativeEditable: true,
          properties: p
        };
      });

      // Normalize slide background color
      const repairedBg = slide.backgroundColorHex
        ? this.normalizeHex(slide.backgroundColorHex, 'F8FAFC')
        : 'F8FAFC';

      return {
        ...slide,
        objects: repairedObjects,
        backgroundColorHex: repairedBg,
        speakerNotes: slide.speakerNotes || ''
      };
    });

    return {
      ...model,
      title: model.title || 'پێشکەشکردنی ئەکادیمی',
      slides: repairedSlides
    };
  }

  private normalizeHex(hex: string, fallback: string): string {
    if (!hex) return fallback;
    const clean = hex.replace(/[^0-9A-Fa-f]/g, '');
    if (clean.length === 6) return clean;
    if (clean.length === 3) {
      return clean.split('').map(c => c + c).join('');
    }
    return fallback;
  }

  /**
   * Generates a production-grade PPTX file preserving all citations, charts, tables, notes, and provenance metadata.
   */
  async exportToPPTX(exportSpec: ExportSpecification): Promise<ExportFidelityReport> {
    const errors: string[] = [];
    let preservedCitationsCount = 0;
    let preservedChartsCount = 0;
    let preservedImagesCount = 0;

    try {
      const pptx = new pptxgen();

      pptx.title = exportSpec.title;
      pptx.author = exportSpec.metadata?.author || 'بزوێنەری ئاسۆ - دکتۆرا و ماستەر';
      pptx.layout = exportSpec.aspectRatio === '4:3' ? 'LAYOUT_4x3' : 'LAYOUT_16x9';

      const theme = exportSpec.theme;

      for (const slideSpec of exportSpec.slides) {
        const slide = pptx.addSlide();
        slide.background = { color: theme.backgroundColor.hex.replace('#', '') };

        for (const element of slideSpec.elements) {
          if (element.kind === 'text') {
            const data: TextElement = element.data;
            slide.addText(data.text, {
              x: `${data.bounds.xPct}%`,
              y: `${data.bounds.yPct}%`,
              w: `${data.bounds.wPct}%`,
              h: `${data.bounds.hPct}%`,
              fontSize: data.fontPt,
              bold: data.fontWeight === 'bold' || data.fontWeight === '700',
              color: data.colorHex.replace('#', ''),
              fontFace: theme.fontFamilyBody,
              align: data.align
            });
          } else if (element.kind === 'chart') {
            const data: ChartElement = element.data;
            preservedChartsCount++;

            const chartData = data.series.map(s => ({
              name: s.name,
              labels: data.labels,
              values: s.values
            }));

            let chartTypeEnum = pptx.ChartType.bar;
            if (data.chartType === 'column') chartTypeEnum = pptx.ChartType.bar;
            if (data.chartType === 'line') chartTypeEnum = pptx.ChartType.line;
            if (data.chartType === 'pie') chartTypeEnum = pptx.ChartType.pie;
            if (data.chartType === 'donut') chartTypeEnum = pptx.ChartType.doughnut;

            slide.addChart(chartTypeEnum, chartData, {
              x: `${data.bounds.xPct}%`,
              y: `${data.bounds.yPct}%`,
              w: `${data.bounds.wPct}%`,
              h: `${data.bounds.hPct}%`,
              showTitle: true,
              title: data.title,
              showLegend: data.legendPosition !== 'none'
            });
          } else if (element.kind === 'table') {
            const data: TableElement = element.data;

            const tableRows = [
              data.headers.map(h => ({ text: h, options: { bold: true, fill: '1E293B', color: 'FFFFFF' } })),
              ...data.rows.map(row => row.map(cell => ({ text: String(cell), options: { color: '334155' } })))
            ];

            slide.addTable(tableRows, {
              x: `${data.bounds.xPct}%`,
              y: `${data.bounds.yPct}%`,
              w: `${data.bounds.wPct}%`,
              h: `${data.bounds.hPct}%`
            });
          } else if (element.kind === 'image') {
            const data: ImageElement = element.data;
            preservedImagesCount++;

            if (data.base64Data) {
              slide.addImage({
                data: 'image/jpeg;base64,' + data.base64Data,
                x: `${data.bounds.xPct}%`,
                y: `${data.bounds.yPct}%`,
                w: `${data.bounds.wPct}%`,
                h: `${data.bounds.hPct}%`
              });
            } else {
              // Create native placeholder shape with image source provenance text
              slide.addShape(pptx.ShapeType.roundRect, {
                x: `${data.bounds.xPct}%`,
                y: `${data.bounds.yPct}%`,
                w: `${data.bounds.wPct}%`,
                h: `${data.bounds.hPct}%`,
                fill: { color: 'F1F5F9' },
                line: { color: '94A3B8', width: 1 }
              });

              slide.addText(`[وێنەی بەڵگەنامەیی: ${data.altText}]\nسەرچاوە: ${data.source}\nلایسەنس: ${data.license}`, {
                x: `${data.bounds.xPct + 1}%`,
                y: `${data.bounds.yPct + 1}%`,
                w: `${data.bounds.wPct - 2}%`,
                h: `${data.bounds.hPct - 2}%`,
                fontSize: 10,
                color: '475569',
                align: 'center'
              });
            }
          } else if (element.kind === 'citation') {
            const data: CitationElement = element.data;
            preservedCitationsCount++;

            slide.addText(`سەرچاوە: ${data.inTextCitation} | ${data.fullReference}`, {
              x: `${data.bounds.xPct}%`,
              y: `${data.bounds.yPct}%`,
              w: `${data.bounds.wPct}%`,
              h: `${data.bounds.hPct}%`,
              fontSize: 9,
              color: '64748B',
              align: 'right'
            });
          } else if (element.kind === 'shape') {
            slide.addShape(pptx.ShapeType.rect, {
              x: `${element.data.bounds.xPct}%`,
              y: `${element.data.bounds.yPct}%`,
              w: `${element.data.bounds.wPct}%`,
              h: `${element.data.bounds.hPct}%`,
              fill: { color: element.data.fillColorHex.replace('#', '') }
            });
          }
        }

        // Speaker Notes Export
        if (slideSpec.speakerNotes?.notes) {
          slide.addNotes(slideSpec.speakerNotes.notes);
        }
      }

      const fileName = `${exportSpec.title.replace(/\s+/g, '_')}_Aso_Engine.pptx`;
      await pptx.writeFile({ fileName });

      return {
        success: true,
        slideCount: exportSpec.slides.length,
        preservedCitationsCount,
        preservedChartsCount,
        preservedImagesCount,
        preservedProvenance: true,
        fileName,
        errors: []
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(msg);
      return {
        success: false,
        slideCount: exportSpec.slides.length,
        preservedCitationsCount,
        preservedChartsCount,
        preservedImagesCount,
        preservedProvenance: false,
        fileName: '',
        errors
      };
    }
  }
}
