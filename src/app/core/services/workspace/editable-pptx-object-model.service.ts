import { Injectable } from '@angular/core';
import pptxgen from 'pptxgenjs';
import { Presentation, Slide, ExportTheme } from '../../models/presentation.model';
import { SlideDesignSpec } from '../../models/slide-design.model';

export interface EditablePptxObject {
  id: string;
  type: 'text' | 'shape' | 'image' | 'chart' | 'table' | 'citation' | 'speaker_notes';
  isNativeEditable: boolean;
  properties: {
    xPct: number;
    yPct: number;
    wPct: number;
    hPct: number;
    text?: string;
    fontPt?: number;
    colorHex?: string;
    bold?: boolean;
    align?: 'left' | 'center' | 'right' | 'justify';
    rtl?: boolean;
    fillHex?: string;
    borderHex?: string;
    chartType?: string;
    labels?: string[];
    series?: { name: string; values: number[] }[];
    headers?: string[];
    rows?: (string | number)[][];
    base64Image?: string;
    speakerNotes?: string;
    lineSpacing?: number;
    fontFace?: string;
    shapeType?: string;
  };
}

export interface EditableSlideModel {
  slideNumber: number;
  title: string;
  objects: EditablePptxObject[];
  speakerNotes: string;
  backgroundColorHex?: string;
}

export interface EditablePresentationModel {
  title: string;
  topic?: string;
  academicLevel?: string;
  slides: EditableSlideModel[];
  theme?: string;
  executiveSummary?: string;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EditablePptxObjectModelService {
  private readonly themePalettes: Record<string, { bg: string; slideBg: string; titleText: string; headText: string; bodyText: string; accent: string; font: string }> = {
    professional: {
      bg: '1E293B',
      slideBg: 'F8FAFC',
      titleText: 'FFFFFF',
      headText: '0F172A',
      bodyText: '334155',
      accent: '4F46E5',
      font: 'Calibri'
    },
    academic: {
      bg: '1E1B4B',
      slideBg: 'FFFDF9',
      titleText: 'FAFAF9',
      headText: '111827',
      bodyText: '2E2B2A',
      accent: '991B1B',
      font: 'Georgia'
    },
    creative: {
      bg: '581C87',
      slideBg: 'FDF4FF',
      titleText: 'FDF4FF',
      headText: '581C87',
      bodyText: '1E1B4B',
      accent: 'EA580C',
      font: 'Verdana'
    }
  };

  /**
   * Converts Presentation domain model into an editable PowerPoint object model.
   * Ensures all elements (text, shapes, citations, notes, visuals) are native and editable.
   */
  buildEditableModel(
    presentation: Presentation,
    options?: {
      exportTheme?: ExportTheme;
      summary?: string;
      getKurdishLevelName?: (level: string) => string;
    }
  ): EditablePresentationModel {
    const themeKey = options?.exportTheme || 'professional';
    const theme = this.themePalettes[themeKey] || this.themePalettes['professional'];
    const getLevelName = options?.getKurdishLevelName || ((lvl: string) => lvl);
    const summary = options?.summary || '';

    const slideModels: EditableSlideModel[] = [];

    // 1. Cover Slide
    const coverObjects: EditablePptxObject[] = [
      {
        id: 'cover_title',
        type: 'text',
        isNativeEditable: true,
        properties: {
          xPct: 5,
          yPct: 25,
          wPct: 90,
          hPct: 20,
          text: presentation.title,
          fontPt: 32,
          bold: true,
          colorHex: theme.titleText,
          fontFace: theme.font,
          align: 'right',
          rtl: true
        }
      },
      {
        id: 'cover_separator',
        type: 'shape',
        isNativeEditable: true,
        properties: {
          xPct: 5,
          yPct: 48,
          wPct: 90,
          hPct: 0.8,
          fillHex: theme.accent,
          shapeType: 'rect'
        }
      },
      {
        id: 'cover_meta',
        type: 'text',
        isNativeEditable: true,
        properties: {
          xPct: 5,
          yPct: 54,
          wPct: 90,
          hPct: 15,
          text: `بابەت: ${presentation.topic || presentation.title}\nئاستی ئەکادیمی: ${getLevelName(presentation.academicLevel)}`,
          fontPt: 16,
          colorHex: theme.titleText,
          fontFace: theme.font,
          align: 'right',
          rtl: true
        }
      },
      {
        id: 'cover_branding',
        type: 'text',
        isNativeEditable: true,
        properties: {
          xPct: 5,
          yPct: 80,
          wPct: 90,
          hPct: 10,
          text: 'دروستکراوە بە بزوێنەری ئاسۆ (کوردیش پرێزێنتس)',
          fontPt: 11,
          colorHex: theme.titleText,
          fontFace: theme.font,
          align: 'center',
          rtl: true
        }
      }
    ];

    slideModels.push({
      slideNumber: 1,
      title: presentation.title,
      objects: coverObjects,
      speakerNotes: `دەستپێکی پرێزێنتەیشن لەسەر بابەت: ${presentation.topic || presentation.title}`,
      backgroundColorHex: theme.bg
    });

    // 2. Executive Summary Slide (if present)
    if (summary) {
      const summaryObjects: EditablePptxObject[] = [
        {
          id: 'summary_title',
          type: 'text',
          isNativeEditable: true,
          properties: {
            xPct: 5,
            yPct: 8,
            wPct: 90,
            hPct: 10,
            text: 'کورتەی جێبەجێکار / Executive Summary',
            fontPt: 22,
            bold: true,
            colorHex: theme.headText,
            fontFace: theme.font,
            align: 'right',
            rtl: true
          }
        },
        {
          id: 'summary_separator',
          type: 'shape',
          isNativeEditable: true,
          properties: {
            xPct: 5,
            yPct: 18,
            wPct: 90,
            hPct: 0.6,
            fillHex: theme.accent,
            shapeType: 'rect'
          }
        },
        {
          id: 'summary_body',
          type: 'text',
          isNativeEditable: true,
          properties: {
            xPct: 8,
            yPct: 24,
            wPct: 84,
            hPct: 65,
            text: summary,
            fontPt: 13,
            colorHex: theme.bodyText,
            fontFace: theme.font,
            align: 'right',
            rtl: true,
            lineSpacing: 22
          }
        }
      ];

      slideModels.push({
        slideNumber: slideModels.length + 1,
        title: 'کورتەی جێبەجێکار',
        objects: summaryObjects,
        speakerNotes: `کورتەی جێبەجێکاری پرێزێنتەیشن: ${summary}`,
        backgroundColorHex: theme.slideBg
      });
    }

    // 3. Content Slides
    (presentation.slides || []).forEach((slide: Slide, index: number) => {
      const slideObjects: EditablePptxObject[] = [];

      // Title
      slideObjects.push({
        id: `slide_${index}_title`,
        type: 'text',
        isNativeEditable: true,
        properties: {
          xPct: 5,
          yPct: 8,
          wPct: 90,
          hPct: 10,
          text: slide.title,
          fontPt: 22,
          bold: true,
          colorHex: theme.headText,
          fontFace: theme.font,
          align: 'right',
          rtl: true
        }
      });

      // Horizontal separator
      slideObjects.push({
        id: `slide_${index}_sep`,
        type: 'shape',
        isNativeEditable: true,
        properties: {
          xPct: 5,
          yPct: 17,
          wPct: 90,
          hPct: 0.6,
          fillHex: theme.accent,
          shapeType: 'rect'
        }
      });

      // Points block
      const bulletLines = (slide.points || []).map(p => `• ${p}`).join('\n\n');
      slideObjects.push({
        id: `slide_${index}_bullets`,
        type: 'text',
        isNativeEditable: true,
        properties: {
          xPct: 38,
          yPct: 22,
          wPct: 57,
          hPct: 68,
          text: bulletLines,
          fontPt: 13,
          colorHex: theme.bodyText,
          fontFace: theme.font,
          align: 'right',
          rtl: true,
          lineSpacing: 20
        }
      });

      // Visual element (Image or Graphic Card)
      if (slide.aiImage) {
        slideObjects.push({
          id: `slide_${index}_image`,
          type: 'image',
          isNativeEditable: true,
          properties: {
            xPct: 5,
            yPct: 22,
            wPct: 30,
            hPct: 58,
            base64Image: slide.aiImage
          }
        });
      } else {
        slideObjects.push({
          id: `slide_${index}_visual_card`,
          type: 'shape',
          isNativeEditable: true,
          properties: {
            xPct: 5,
            yPct: 22,
            wPct: 30,
            hPct: 58,
            fillHex: theme.bg,
            borderHex: theme.accent,
            shapeType: 'roundRect'
          }
        });

        slideObjects.push({
          id: `slide_${index}_visual_text`,
          type: 'text',
          isNativeEditable: true,
          properties: {
            xPct: 6,
            yPct: 25,
            wPct: 28,
            hPct: 52,
            text: `[بینراوی سلاید ${index + 1}]\n\n${slide.visualSuggestion || ''}`,
            fontPt: 10,
            colorHex: theme.titleText,
            fontFace: theme.font,
            align: 'center',
            rtl: true
          }
        });
      }

      // Academic Sources citation
      if (slide.sources && slide.sources.length > 0) {
        slideObjects.push({
          id: `slide_${index}_sources`,
          type: 'citation',
          isNativeEditable: true,
          properties: {
            xPct: 16,
            yPct: 91,
            wPct: 79,
            hPct: 5,
            text: `📚 سەرچاوە: ${slide.sources.join(' | ')}`,
            fontPt: 8,
            colorHex: theme.bodyText,
            fontFace: theme.font,
            align: 'right',
            rtl: true
          }
        });
      }

      // Slide indicator footnote
      slideObjects.push({
        id: `slide_${index}_num`,
        type: 'text',
        isNativeEditable: true,
        properties: {
          xPct: 5,
          yPct: 91,
          wPct: 10,
          hPct: 5,
          text: `${index + 1} / ${presentation.slides.length}`,
          fontPt: 9,
          colorHex: theme.bodyText,
          fontFace: theme.font,
          align: 'left'
        }
      });

      // Complete speaker notes
      let completeNotes = slide.speakerNotes || '';
      if (slide.sources && slide.sources.length > 0) {
        completeNotes += `\n\n[سەرچاوەی ئەکادیمی (کتێب/توێژینەوە/گۆڤار)]:\n${slide.sources.map(s => `• ${s}`).join('\n')}`;
      }

      slideModels.push({
        slideNumber: slideModels.length + 1,
        title: slide.title,
        objects: slideObjects,
        speakerNotes: completeNotes,
        backgroundColorHex: theme.slideBg
      });
    });

    return {
      title: presentation.title,
      topic: presentation.topic,
      academicLevel: presentation.academicLevel,
      slides: slideModels,
      theme: themeKey,
      executiveSummary: summary,
      createdAt: presentation.createdAt
    };
  }

  /**
   * Converts SlideDesignSpec into native editable PowerPoint objects.
   * Guarantees texts, tables, shapes, notes, and charts remain natively editable in PPTX export.
   */
  buildEditableSlideModel(slideDesign: SlideDesignSpec): EditableSlideModel {
    const objects: EditablePptxObject[] = [];

    for (const el of slideDesign.elements) {
      if (el.kind === 'text') {
        objects.push({
          id: el.data.id,
          type: 'text',
          isNativeEditable: true,
          properties: {
            xPct: el.data.bounds.xPct,
            yPct: el.data.bounds.yPct,
            wPct: el.data.bounds.wPct,
            hPct: el.data.bounds.hPct,
            text: el.data.text,
            fontPt: el.data.fontPt,
            colorHex: el.data.colorHex,
            align: el.data.align as 'left' | 'center' | 'right' | 'justify',
            rtl: el.data.direction === 'rtl'
          }
        });
      } else if (el.kind === 'chart') {
        objects.push({
          id: el.data.id,
          type: 'chart',
          isNativeEditable: true,
          properties: {
            xPct: el.data.bounds.xPct,
            yPct: el.data.bounds.yPct,
            wPct: el.data.bounds.wPct,
            hPct: el.data.bounds.hPct,
            chartType: el.data.chartType,
            labels: el.data.labels,
            series: el.data.series
          }
        });
      } else if (el.kind === 'table') {
        objects.push({
          id: el.data.id,
          type: 'table',
          isNativeEditable: true,
          properties: {
            xPct: el.data.bounds.xPct,
            yPct: el.data.bounds.yPct,
            wPct: el.data.bounds.wPct,
            hPct: el.data.bounds.hPct,
            headers: el.data.headers,
            rows: el.data.rows
          }
        });
      } else if (el.kind === 'shape') {
        objects.push({
          id: el.data.id,
          type: 'shape',
          isNativeEditable: true,
          properties: {
            xPct: el.data.bounds.xPct,
            yPct: el.data.bounds.yPct,
            wPct: el.data.bounds.wPct,
            hPct: el.data.bounds.hPct,
            fillHex: el.data.fillColorHex,
            borderHex: el.data.borderColorHex,
            shapeType: 'rect'
          }
        });
      } else if (el.kind === 'image') {
        objects.push({
          id: el.data.id,
          type: 'image',
          isNativeEditable: true,
          properties: {
            xPct: el.data.bounds.xPct,
            yPct: el.data.bounds.yPct,
            wPct: el.data.bounds.wPct,
            hPct: el.data.bounds.hPct,
            base64Image: el.data.base64Data
          }
        });
      } else if (el.kind === 'citation') {
        objects.push({
          id: el.data.id,
          type: 'citation',
          isNativeEditable: true,
          properties: {
            xPct: el.data.bounds.xPct,
            yPct: el.data.bounds.yPct,
            wPct: el.data.bounds.wPct,
            hPct: el.data.bounds.hPct,
            text: `سەرچاوە: ${el.data.inTextCitation} — ${el.data.fullReference}`,
            fontPt: 9,
            colorHex: '#64748B',
            align: 'right',
            rtl: true
          }
        });
      }
    }

    return {
      slideNumber: slideDesign.slideNumber,
      title: slideDesign.title,
      objects,
      speakerNotes: slideDesign.speakerNotes?.notes || ''
    };
  }

  /**
   * Generates and downloads the native editable PowerPoint (.pptx) file using pptxgenjs.
   */
  async generateAndDownloadFile(model: EditablePresentationModel, presentationTitle?: string): Promise<void> {
    const pptx = new pptxgen();

    pptx.title = model.title || presentationTitle || 'پێشکەشکردنی ئەکادیمی';
    pptx.subject = model.topic || model.title;
    pptx.author = 'ڕاهێنەری پرێزێنتەیشنی کوردی - بزوێنەری ئاسۆ';
    pptx.layout = 'LAYOUT_16x9';

    for (const slideModel of model.slides) {
      const slide = pptx.addSlide();
      if (slideModel.backgroundColorHex) {
        slide.background = { color: slideModel.backgroundColorHex.replace('#', '') };
      }

      for (const obj of slideModel.objects) {
        const p = obj.properties;

        if (obj.type === 'text' || obj.type === 'citation') {
          if (p.text) {
            slide.addText(p.text, {
              x: `${p.xPct}%`,
              y: `${p.yPct}%`,
              w: `${p.wPct}%`,
              h: `${p.hPct}%`,
              fontSize: p.fontPt || 14,
              bold: !!p.bold,
              color: (p.colorHex || '000000').replace('#', ''),
              fontFace: p.fontFace || 'Calibri',
              align: p.align || (p.rtl ? 'right' : 'left'),
              lineSpacing: p.lineSpacing
            });
          }
        } else if (obj.type === 'shape') {
          const shapeTypeEnum = p.shapeType === 'roundRect' ? pptx.ShapeType.roundRect : pptx.ShapeType.rect;
          slide.addShape(shapeTypeEnum, {
            x: `${p.xPct}%`,
            y: `${p.yPct}%`,
            w: `${p.wPct}%`,
            h: `${p.hPct}%`,
            fill: { color: (p.fillHex || '4F46E5').replace('#', '') },
            ...(p.borderHex ? { line: { color: p.borderHex.replace('#', ''), width: 1.5 } } : {})
          });
        } else if (obj.type === 'image') {
          if (p.base64Image) {
            slide.addImage({
              data: p.base64Image.startsWith('data:') ? p.base64Image : `image/jpeg;base64,${p.base64Image}`,
              x: `${p.xPct}%`,
              y: `${p.yPct}%`,
              w: `${p.wPct}%`,
              h: `${p.hPct}%`
            });
          }
        } else if (obj.type === 'chart') {
          if (p.series && p.labels) {
            const chartData = p.series.map(s => ({
              name: s.name,
              labels: p.labels || [],
              values: s.values
            }));
            let chartTypeEnum = pptx.ChartType.bar;
            if (p.chartType === 'line') chartTypeEnum = pptx.ChartType.line;
            if (p.chartType === 'pie') chartTypeEnum = pptx.ChartType.pie;
            if (p.chartType === 'donut') chartTypeEnum = pptx.ChartType.doughnut;

            slide.addChart(chartTypeEnum, chartData, {
              x: `${p.xPct}%`,
              y: `${p.yPct}%`,
              w: `${p.wPct}%`,
              h: `${p.hPct}%`,
              showTitle: true,
              showLegend: true
            });
          }
        } else if (obj.type === 'table') {
          if (p.headers && p.rows) {
            const tableRows = [
              p.headers.map(h => ({ text: h, options: { bold: true, fill: '1E293B', color: 'FFFFFF' } })),
              ...p.rows.map(row => row.map(cell => ({ text: String(cell), options: { color: '334155' } })))
            ];
            slide.addTable(tableRows, {
              x: `${p.xPct}%`,
              y: `${p.yPct}%`,
              w: `${p.wPct}%`,
              h: `${p.hPct}%`
            });
          }
        }
      }

      // Speaker Notes
      if (slideModel.speakerNotes) {
        slide.addNotes(slideModel.speakerNotes);
      }
    }

    const title = presentationTitle || model.title || 'پێشکەشکردن';
    const finalFileName = `${title.replace(/\s+/g, '_')}_سەکۆ.pptx`;
    await pptx.writeFile({ fileName: finalFileName });
  }
}
