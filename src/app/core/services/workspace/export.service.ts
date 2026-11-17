import { Injectable, inject } from '@angular/core';
import { EditablePptxObjectModelService } from './editable-pptx-object-model.service';
import { PptxExportFidelityService } from './pptx-export-fidelity.service';
import { ExportTheme, Presentation, Slide, SlideTheme } from '../../models/presentation.model';

interface ThemeColor {
  red: number;
  green: number;
  blue: number;
}

interface ThemeConfig {
  bg: ThemeColor;
  title: ThemeColor;
  body: ThemeColor;
  accent: ThemeColor;
  visualText: ThemeColor;
}

const GOOGLE_SLIDES_THEMES: Record<string, ThemeConfig> = {
  cosmic: {
    bg: { red: 0.08, green: 0.09, blue: 0.16 },
    title: { red: 1.0, green: 1.0, blue: 1.0 },
    body: { red: 0.75, green: 0.78, blue: 0.86 },
    accent: { red: 0.47, green: 0.31, blue: 0.71 },
    visualText: { red: 1.0, green: 1.0, blue: 1.0 }
  },
  sand: {
    bg: { red: 0.97, green: 0.96, blue: 0.94 },
    title: { red: 0.13, green: 0.13, blue: 0.13 },
    body: { red: 0.31, green: 0.29, blue: 0.27 },
    accent: { red: 0.85, green: 0.65, blue: 0.13 },
    visualText: { red: 0.13, green: 0.13, blue: 0.13 }
  },
  emerald: {
    bg: { red: 0.04, green: 0.15, blue: 0.11 },
    title: { red: 0.86, green: 0.96, blue: 0.92 },
    body: { red: 0.63, green: 0.78, blue: 0.73 },
    accent: { red: 0.08, green: 0.35, blue: 0.27 },
    visualText: { red: 0.86, green: 0.96, blue: 0.92 }
  },
  charcoal: {
    bg: { red: 0.09, green: 0.09, blue: 0.11 },
    title: { red: 1.0, green: 1.0, blue: 1.0 },
    body: { red: 0.83, green: 0.83, blue: 0.85 },
    accent: { red: 0.96, green: 0.62, blue: 0.04 },
    visualText: { red: 0.09, green: 0.09, blue: 0.11 }
  }
};

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private readonly pptxModelService = inject(EditablePptxObjectModelService);
  private readonly fidelityService = inject(PptxExportFidelityService);

  /**
   * هەناردەکردنی سیمینار بۆ فایلی PowerPoint (.pptx)
   * جێگرەوەی تەواوی فایلی src/app/pptx-export.ts
   */
  async exportToPptx(
    presentation: Presentation,
    exportTheme: ExportTheme = 'professional',
    summary = '',
    getKurdishLevelName?: (level: string) => string
  ): Promise<void> {
    // ١. دروستکردنی مۆدێلی شیاوی دەستکاریکردن بۆ سلایدەکان
    const pptxObjectModel = (exportTheme === 'professional' && !summary && !getKurdishLevelName)
      ? this.pptxModelService.buildEditableModel(presentation)
      : this.pptxModelService.buildEditableModel(presentation, {
          exportTheme,
          summary,
          getKurdishLevelName
        });

    // ٢. پشکنینی کوالێتی و ڕێکخستنی فۆنت و ڕەنگەکان (Fidelity Check)
    const validatedModel = this.fidelityService.validateAndRepair(pptxObjectModel);

    // ٣. دروستکردن و دابەزاندنی فایلەکە
    await this.pptxModelService.generateAndDownloadFile(validatedModel, presentation.title);
  }

  /**
   * پشتیوانی لە پەیوەندی پێشوو (Backward Compatibility) بۆ exportToPPTX
   */
  async exportToPPTX(
    presentation: Presentation,
    exportTheme: ExportTheme = 'professional',
    summary = '',
    getKurdishLevelName?: (level: string) => string
  ): Promise<void> {
    return this.exportToPptx(presentation, exportTheme, summary, getKurdishLevelName);
  }

  /**
   * هەناردەکردنی سیمینار بۆ Google Slides / JSON
   * جێگرەوەی تەواوی فایلی src/app/slides-export.ts
   */
  async exportToSlides(
    presentation: Presentation,
    accessToken?: string,
    slideTheme: SlideTheme = 'cosmic',
    onProgress?: (step: string) => void
  ): Promise<string> {
    if (!accessToken) {
      // ئەگەر دەستڕاگەیشتن بە OAuth نەبوو، فایلی داتای JSON دابەزێنە
      this.exportToJson(presentation);
      return '';
    }

    const t = GOOGLE_SLIDES_THEMES[slideTheme] || GOOGLE_SLIDES_THEMES['cosmic'];

    // 1. Create a blank Google Slides Presentation
    if (onProgress) onProgress('دروستکردنی دەفتەری سلاید لە Google Drive...');
    const createRes = await fetch('https://slides.googleapis.com/v1/presentations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: presentation.title })
    });

    if (!createRes.ok) {
      const errorData = await createRes.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || 'هەڵەیەک لە دروستکردنی پرێزێنتەیشنی Google Slides ڕوویدا.');
    }

    const createdPres = await createRes.json();
    const presentationId = createdPres.presentationId;
    const defaultPageId = createdPres.slides?.[0]?.pageId;

    // 2. Prepare BatchUpdate requests
    if (onProgress) onProgress('نەخشەکێشان و شێوازی گرافیکی سلایدەکان...');
    const requests: unknown[] = [];

    (presentation.slides || []).forEach((slide: Slide, idx: number) => {
      const slidePageId = `slide_page_${idx}`;
      const bgShapeId = `bg_rect_${idx}`;
      const titleBoxId = `title_box_${idx}`;
      const bodyBoxId = `body_box_${idx}`;
      const visualCardId = `visual_card_${idx}`;

      // A. Add a blank slide
      requests.push({
        createSlide: {
          objectId: slidePageId,
          insertionIndex: idx,
          slideLayoutReference: { predefinedLayout: 'BLANK' }
        }
      });

      // B. Background Rectangle
      requests.push({
        createShape: {
          objectId: bgShapeId,
          shapeType: 'RECTANGLE',
          elementProperties: {
            pageId: slidePageId,
            size: {
              width: { magnitude: 720, unit: 'PT' },
              height: { magnitude: 405, unit: 'PT' }
            },
            transform: { scaleX: 1, scaleY: 1, translateX: 0, translateY: 0, unit: 'PT' }
          }
        }
      });

      // C. Fill Background
      requests.push({
        updateShapeProperties: {
          objectId: bgShapeId,
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: t.bg } } },
            outline: { outlineFill: { solidFill: { color: t.bg } } }
          },
          fields: 'shapeBackgroundFill,outline'
        }
      });

      // D. Title Box
      requests.push({
        createShape: {
          objectId: titleBoxId,
          shapeType: 'RECTANGLE',
          elementProperties: {
            pageId: slidePageId,
            size: {
              width: { magnitude: 640, unit: 'PT' },
              height: { magnitude: 60, unit: 'PT' }
            },
            transform: { scaleX: 1, scaleY: 1, translateX: 40, translateY: 30, unit: 'PT' }
          }
        }
      });

      // E. Insert Title Text
      requests.push({
        insertText: {
          objectId: titleBoxId,
          text: slide.title
        }
      });

      // F. Format Title Text Box (RTL, bold, color)
      requests.push({
        updateParagraphStyle: {
          objectId: titleBoxId,
          style: { alignment: 'RIGHT', direction: 'RIGHT_TO_LEFT' },
          fields: 'alignment,direction'
        }
      });
      requests.push({
        updateTextStyle: {
          objectId: titleBoxId,
          style: {
            fontFamily: 'Arial',
            fontSize: { magnitude: 24, unit: 'PT' },
            bold: true,
            foregroundColor: { opaqueColor: { rgbColor: t.title } }
          },
          fields: 'fontFamily,fontSize,bold,foregroundColor'
        }
      });

      // G. Body Text Box
      requests.push({
        createShape: {
          objectId: bodyBoxId,
          shapeType: 'RECTANGLE',
          elementProperties: {
            pageId: slidePageId,
            size: {
              width: { magnitude: 400, unit: 'PT' },
              height: { magnitude: 250, unit: 'PT' }
            },
            transform: { scaleX: 1, scaleY: 1, translateX: 280, translateY: 110, unit: 'PT' }
          }
        }
      });

      // H. Insert Body Points
      const bulletedText = (slide.points || []).map((p: string) => `• ${p}`).join('\n');
      requests.push({
        insertText: {
          objectId: bodyBoxId,
          text: bulletedText
        }
      });

      // I. Format Body Points
      requests.push({
        updateParagraphStyle: {
          objectId: bodyBoxId,
          style: { alignment: 'RIGHT', direction: 'RIGHT_TO_LEFT', lineSpacing: 125 },
          fields: 'alignment,direction,lineSpacing'
        }
      });
      requests.push({
        updateTextStyle: {
          objectId: bodyBoxId,
          style: {
            fontFamily: 'Arial',
            fontSize: { magnitude: 15, unit: 'PT' },
            foregroundColor: { opaqueColor: { rgbColor: t.body } }
          },
          fields: 'fontFamily,fontSize,foregroundColor'
        }
      });

      // J. Visual Card Box
      requests.push({
        createShape: {
          objectId: visualCardId,
          shapeType: 'RECTANGLE',
          elementProperties: {
            pageId: slidePageId,
            size: {
              width: { magnitude: 220, unit: 'PT' },
              height: { magnitude: 250, unit: 'PT' }
            },
            transform: { scaleX: 1, scaleY: 1, translateX: 40, translateY: 110, unit: 'PT' }
          }
        }
      });

      // K. Accent coloring for visual card
      requests.push({
        updateShapeProperties: {
          objectId: visualCardId,
          shapeProperties: {
            shapeBackgroundFill: { solidFill: { color: { rgbColor: t.accent } } },
            outline: { outlineFill: { solidFill: { color: t.accent } } }
          },
          fields: 'shapeBackgroundFill,outline'
        }
      });

      // L. Add visual description
      const cardText = `🎭 پێشنیاری بینراو:\n\n${slide.visualSuggestion || ''}`;
      requests.push({
        insertText: {
          objectId: visualCardId,
          text: cardText
        }
      });

      // M. Format Visual Card text
      requests.push({
        updateParagraphStyle: {
          objectId: visualCardId,
          style: { alignment: 'RIGHT', direction: 'RIGHT_TO_LEFT' },
          fields: 'alignment,direction'
        }
      });
      requests.push({
        updateTextStyle: {
          objectId: visualCardId,
          style: {
            fontFamily: 'Arial',
            fontSize: { magnitude: 12, unit: 'PT' },
            italic: true,
            foregroundColor: { opaqueColor: { rgbColor: t.visualText } }
          },
          fields: 'fontFamily,fontSize,italic,foregroundColor'
        }
      });
    });

    // Delete default first slide
    if (defaultPageId) {
      requests.push({
        deleteObject: { objectId: defaultPageId }
      });
    }

    // 3. Dispatch batch update
    if (onProgress) onProgress('هەناردەکردنی گرافیک و تێکستی سلایدەکان...');
    const batchRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ requests })
    });

    if (!batchRes.ok) {
      const errorData = await batchRes.json().catch(() => ({}));
      throw new Error(errorData?.error?.message || 'هەڵەیەک لە هەناردەکردنی ڕازاندنەوەی سلایدەکان ڕوویدا.');
    }

    // 4. Update speaker notes
    if (onProgress) onProgress('تۆمارکردنی تێبینییەکانی پێشکەشکار کاتی یەکەم...');
    const getMetaRes = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (getMetaRes.ok) {
      const metaData = await getMetaRes.json();
      const metaSlides = metaData.slides || [];
      const notesRequests: unknown[] = [];

      (presentation.slides || []).forEach((slide: Slide, idx: number) => {
        const metaSlide = metaSlides[idx];
        const notesBoxId = metaSlide?.slideProperties?.notesPage?.notesProperties?.speakerNotesObjectId;

        if (notesBoxId && slide.speakerNotes) {
          notesRequests.push({
            insertText: {
              objectId: notesBoxId,
              text: slide.speakerNotes
            }
          });
          notesRequests.push({
            updateTextStyle: {
              objectId: notesBoxId,
              style: {
                fontFamily: 'Arial',
                fontSize: { magnitude: 12, unit: 'PT' }
              },
              fields: 'fontFamily,fontSize'
            }
          });
        }
      });

      if (notesRequests.length > 0) {
        if (onProgress) onProgress('تەواوکردنی کۆتایی نووسینی تێبینییەکانی پێشکەشکار...');
        await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ requests: notesRequests })
        }).catch((err) => console.warn('Failed to write speaker notes:', err));
      }
    }

    if (onProgress) onProgress('سلایدەکانت ئامادەن!');
    return `https://docs.google.com/presentation/d/${presentationId}/edit`;
  }

  /**
   * پشتیوانی لە پەیوەندی پێشوو (Backward Compatibility) بۆ exportToGoogleSlides
   */
  async exportToGoogleSlides(
    presentation: Presentation,
    accessToken: string,
    slideTheme: SlideTheme = 'cosmic',
    onProgress?: (step: string) => void
  ): Promise<string> {
    return this.exportToSlides(presentation, accessToken, slideTheme, onProgress);
  }

  /**
   * هەناردەکردنی پێشکەشکردن بۆ فۆرماتی JSON
   */
  exportToJson(presentation: Presentation): string {
    const jsonStr = JSON.stringify(presentation, null, 2);
    if (typeof document !== 'undefined') {
      const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(presentation.title || 'presentation').replace(/\s+/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    return jsonStr;
  }

  /**
   * هەناردەکردنی پوختە بۆ فایلی دەقی کوردی (.txt)
   */
  exportToTextFile(presentation: Presentation, summary: string, getKurdishLevelName: (level: string) => string): void {
    const title = presentation.title || 'presentation';
    let txtContent = `===========================================================\n`;
    txtContent += `       پێشکەشکردنی فەرمی: ${title}\n`;
    txtContent += `       ئاستی ئەکادیمی: ${getKurdishLevelName(presentation.academicLevel)}\n`;
    txtContent += `       ڕێکەوتی دروستکردن: ${presentation.createdAt}\n`;
    txtContent += `===========================================================\n\n`;

    if (summary) {
      txtContent += `[کورتەی جێبەجێکار / Abstract]\n`;
      txtContent += `${summary}\n\n`;
      txtContent += `===========================================================\n\n`;
    }

    (presentation.slides || []).forEach((s, index) => {
      txtContent += `[سلایدی ${index + 1}: ${s.title}]\n`;
      (s.points || []).forEach(p => {
        txtContent += ` - ${p}\n`;
      });
      if (s.sources && s.sources.length > 0) {
        txtContent += `\n📚 سەرچاوە زانستییەکان (کتێب / توێژینەوە / گۆڤار):\n`;
        s.sources.forEach(src => {
          txtContent += `   • ${src}\n`;
        });
      }
      txtContent += `\n* تێبینییەکانی پێشکەشکار:\n${s.speakerNotes || ''}\n`;
      txtContent += `\n* پێشنیاری بینراو:\n${s.visualSuggestion || ''}\n`;
      txtContent += `\n-----------------------------------------------------------\n\n`;
    });

    if (typeof document !== 'undefined') {
      const blob = new Blob(['\ufeff' + txtContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.replace(/\s+/g, '_')}_پێشکەشکردن.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  }

  getFormattedFullText(presentation: Presentation, getKurdishLevelName: (level: string) => string): string {
    let fullText = `=== ناونیشانی سەرەکی: ${presentation.title} ===\n`;
    fullText += `ئاستی ئەکادیمی: ${getKurdishLevelName(presentation.academicLevel)}\n\n`;

    (presentation.slides || []).forEach((slide) => {
      fullText += `--------------------------------------------------\n`;
      fullText += `سلایدی ${slide.slideNumber}: ${slide.title}\n`;
      fullText += `--------------------------------------------------\n`;
      fullText += `● خاڵەکانی سەر شاشە:\n`;
      (slide.points || []).forEach(p => {
        fullText += `   - ${p}\n`;
      });
      if (slide.sources && slide.sources.length > 0) {
        fullText += `\n📚 سەرچاوە زانستییەکان (کتێب / توێژینەوە / گۆڤار):\n`;
        slide.sources.forEach(src => {
          fullText += `   • ${src}\n`;
        });
      }
      fullText += `\n📝 تێبینییەکانی پێشکەشکار (Speaker Notes):\n`;
      fullText += `${slide.speakerNotes || ''}\n\n`;
      fullText += `👁️ پێشنیاری بینراو (Visual Suggestion):\n`;
      fullText += `${slide.visualSuggestion || ''}\n\n`;
    });

    return fullText;
  }

  copyToClipboard(text: string): void {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  }
}

/**
 * فەنکشنی یاریدەدەری سەربەخۆ بۆ هاوئاهەنگی لەگەڵ جێبەجێکردنی پێشووی generatePPTXFile لە pptx-export.ts
 */
export async function generatePPTXFile(
  currentPresentation: Presentation,
  exportTheme: ExportTheme = 'professional',
  executiveSummary = '',
  getKurdishLevelName?: (level: string) => string
): Promise<void> {
  const modelService = new EditablePptxObjectModelService();
  const fidelityService = new PptxExportFidelityService();

  const model = modelService.buildEditableModel(currentPresentation, {
    exportTheme,
    summary: executiveSummary,
    getKurdishLevelName
  });

  const validated = fidelityService.validateAndRepair(model);
  await modelService.generateAndDownloadFile(validated, currentPresentation.title);
}

/**
 * فەنکشنی یاریدەدەری سەربەخۆ بۆ هاوئاهەنگی لەگەڵ جێبەجێکردنی پێشووی exportToGoogleSlides لە slides-export.ts
 */
export async function exportToGoogleSlides(
  presentationTitle: string,
  slides: Slide[],
  accessToken: string,
  themeKey: SlideTheme = 'cosmic',
  onProgress?: (step: string) => void
): Promise<string> {
  const service = new ExportService();
  const presentation: Presentation = {
    id: `temp_${Date.now()}`,
    title: presentationTitle,
    topic: presentationTitle,
    academicLevel: 'bachelor',
    createdAt: new Date().toISOString(),
    slides
  };
  return service.exportToSlides(presentation, accessToken, themeKey, onProgress);
}
