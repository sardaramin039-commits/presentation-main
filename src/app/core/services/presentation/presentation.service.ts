import { Injectable, inject, signal, computed } from '@angular/core';
import {
  AcademicLevel,
  Presentation,
  Slide,
  SlideLayoutType,
  PresentationRequest,
  PresentationContext,
  PresentationPlan,
  SlideTheme,
  ExportTheme
} from '../../models/presentation.model';
import { validatePresentationResponse, validateSlide } from '../../validators/presentation.validator';
import { STORAGE_KEYS } from '../../constants/app.constants';
import { PresentationArchitectureEngineService } from '../presentation-architecture-engine.service';
import { classifyAcademicTopic } from '../../utils/academic-topic-classifier.util';

interface RawServerSlide extends Slide {
  visualLayout?: SlideLayoutType;
  comparisonTable?: { headers: string[]; rows: string[][] };
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PresentationService {
  private architectureEngine = inject(PresentationArchitectureEngineService);

  // Reactive State Signals for Slides & Presentation
  public readonly currentPresentation = signal<Presentation | null>(null);
  public readonly activeSlideIndex = signal<number>(0);
  public readonly slideTheme = signal<SlideTheme>('cosmic');
  public readonly exportTheme = signal<ExportTheme>('professional');
  public readonly isFullscreenMode = signal<boolean>(false);
  public readonly lastError = signal<string | null>(null);

  // Computed Derived State
  public readonly slides = computed<Slide[]>(() => this.currentPresentation()?.slides || []);

  public readonly currentSlide = computed<Slide | null>(() => {
    const pres = this.currentPresentation();
    if (!pres || !pres.slides || pres.slides.length === 0) return null;
    const idx = Math.max(0, Math.min(this.activeSlideIndex(), pres.slides.length - 1));
    return pres.slides[idx] || null;
  });

  public readonly activeSlide = this.currentSlide;

  public readonly totalSlidesCount = computed<number>(() => {
    return this.currentPresentation()?.slides?.length || 0;
  });

  public setActiveSlide(index: number): void {
    const total = this.totalSlidesCount();
    if (total === 0) {
      this.activeSlideIndex.set(0);
      return;
    }
    const clamped = Math.max(0, Math.min(index, total - 1));
    this.activeSlideIndex.set(clamped);
  }

  public setPresentation(presentation: Presentation | null): void {
    this.currentPresentation.set(presentation);
    this.activeSlideIndex.set(0);
  }

  public updateSlide(index: number, updatedSlide: Partial<Slide>): void {
    const pres = this.currentPresentation();
    if (!pres || !pres.slides[index]) return;

    const newSlides = [...pres.slides];
    newSlides[index] = {
      ...newSlides[index],
      ...updatedSlide
    };

    this.currentPresentation.set({
      ...pres,
      slides: newSlides
    });
  }

  public addSlide(afterIndex?: number): void {
    let pres = this.currentPresentation();
    if (!pres) {
      pres = {
        id: 'pres_' + Date.now(),
        title: 'پێشکەشکردنی نوێ',
        topic: 'تەوەری سەرەکی',
        academicLevel: 'bachelor',
        slides: [],
        createdAt: new Date().toISOString()
      };
      this.currentPresentation.set(pres);
    }

    const targetIdx = afterIndex !== undefined ? afterIndex + 1 : pres.slides.length;
    const newSlide: Slide = {
      slideNumber: targetIdx + 1,
      title: 'تەوەری لێکۆڵینەوە: پێناسە و چوارچێوەی تیۆری',
      points: [
        'پێناسەی زاراوەیی و شیکردنەوەی چەمکسازیی بابەتەکە لە دیدی سەرچاوە زانستییەکانەوە.',
        'لێکۆڵینەوە لە ڕەهەندە تیۆری و کردارییەکان لەگەڵ دەستنیشانکردنی لێکەوتە زانستییەکان.'
      ],
      speakerNotes: 'لەم بەشەدا تیشک دەخەینە سەر بنەما زانستی و میتۆدۆلۆژییەکان بۆ تێگەیشتنی قووڵ لە تەوەرەکە.',
      visualSuggestion: 'خشتەی بەراوردکاریی چەمکەکان یان هێڵکاریی ڕەهەندەکان'
    };

    const newSlides = [...pres.slides];
    newSlides.splice(targetIdx, 0, newSlide);
    const reindexed = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));

    this.currentPresentation.set({
      ...pres,
      slides: reindexed
    });
    this.setActiveSlide(targetIdx);
  }

  public deleteSlide(index: number): void {
    const pres = this.currentPresentation();
    if (!pres || pres.slides.length <= 1) return;

    const newSlides = pres.slides.filter((_, idx) => idx !== index);
    const reindexed = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));

    this.currentPresentation.set({
      ...pres,
      slides: reindexed
    });

    const newIdx = Math.max(0, Math.min(this.activeSlideIndex(), reindexed.length - 1));
    this.setActiveSlide(newIdx);
  }

  public moveSlide(fromIndex: number, toIndex: number): void {
    const pres = this.currentPresentation();
    if (!pres || fromIndex === toIndex) return;

    const newSlides = [...pres.slides];
    const [moved] = newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, moved);

    const reindexed = newSlides.map((s, idx) => ({ ...s, slideNumber: idx + 1 }));
    this.currentPresentation.set({
      ...pres,
      slides: reindexed
    });
    this.setActiveSlide(toIndex);
  }

  public generatePresentationPlan(
    request: PresentationRequest,
    context?: Partial<PresentationContext>
  ): PresentationPlan {
    return this.architectureEngine.buildPresentationPlan(request, context);
  }

  public convertPlanToPresentation(plan: PresentationPlan): Presentation {
    const slides: Slide[] = plan.slides.map((s, idx) => {
      const points = s.contentPlan.blocks.map(b => b.text);
      const layout = (s.layoutIntent as SlideLayoutType) || 'bento-grid';
      return {
        slideNumber: s.slideNumber || idx + 1,
        title: s.title,
        points: points.length > 0 ? points : [s.contentPlan.explanation],
        speakerNotes: s.speakerNotes,
        visualSuggestion: s.dataVizDescription || s.imageDescription || `شێوازی نەخشە: ${layout}`,
        visualData: {
          layout,
          transition: 'fade'
        }
      };
    });

    const levelMap: Record<string, AcademicLevel> = {
      school: 'qutabxana',
      undergraduate: 'bachelor',
      postgraduate: 'postgrad',
      master: 'postgrad',
      doctoral: 'postgrad'
    };

    return {
      id: plan.id || 'pres_' + Date.now(),
      title: plan.title,
      topic: plan.request.topic,
      academicLevel: levelMap[plan.request.targetAudience] || 'bachelor',
      slides,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * یەکخستنی داتای گەڕاوە لە سێرڤەرەوە لەگەڵ مۆدێلی فرۆنت-ئێند (Schema Unification)
   */
  private mapServerSlideToClientSlide(rawSlide: RawServerSlide, idx: number, isQuantitative: boolean): Slide {
    const qualitativeLayouts: SlideLayoutType[] = [
      'bento-grid',
      'comparison-table',
      'process-timeline',
      'hero-split-image'
    ];
    const defaultLayout = qualitativeLayouts[idx % qualitativeLayouts.length];
    const resolvedLayout: SlideLayoutType =
      rawSlide.visualData?.layout || rawSlide.visualLayout || defaultLayout;

    const resolvedTable = rawSlide.visualData?.table || rawSlide.comparisonTable;

    return {
      ...rawSlide,
      slideNumber: idx + 1,
      bulletPoints: rawSlide.points,
      // پاککردنەوەی هەر ئامارێکی زیادە ئەگەر بابەتەکە چەندێتی نەبوو
      dataStats: isQuantitative ? rawSlide.dataStats : undefined,
      visualData: {
        layout: resolvedLayout,
        transition: rawSlide.visualData?.transition || 'fade',
        table: resolvedTable,
        image: rawSlide.visualData?.image || (rawSlide.imageUrl ? {
          url: rawSlide.imageUrl,
          searchQuery: rawSlide.title,
          alt: rawSlide.title,
          position: 'right'
        } : undefined)
      }
    };
  }

  public async generatePresentation(
    topic: string,
    academicLevel: AcademicLevel,
    slideCount: number,
    sources: string[] = []
  ): Promise<Presentation> {
    this.lastError.set(null);
    const domainAnalysis = classifyAcademicTopic(topic);

    try {
      const response = await fetch('/api/generate-presentation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, academicLevel, slideCount, sources })
      });

      if (response.ok) {
        const rawData = await response.json();
        const validated = validatePresentationResponse(rawData);

        const enrichedSlides = (validated.slides as RawServerSlide[]).map((s, idx) =>
          this.mapServerSlideToClientSlide(s, idx, domainAnalysis.isQuantitative)
        );

        const newPresentation: Presentation = {
          id: 'pres_' + Date.now(),
          title: validated.title,
          topic: validated.topic,
          academicLevel: validated.academicLevel,
          slides: enrichedSlides,
          createdAt: new Date().toISOString()
        };

        this.setPresentation(newPresentation);
        return newPresentation;
      }

      const errBody = await response.json().catch(() => ({}));
      this.lastError.set(errBody?.error || `کێشە لە وەڵامی سێرڤەر (${response.status})`);
    } catch (fetchErr) {
      this.lastError.set('پەیوەندی لەگەڵ سێرڤەری ژیریی دەستکرد پچڕا؛ پلانی پێکهاتەیی ناوخۆیی بەکار هێنرا.');
      console.warn('API /api/generate-presentation fetch error:', fetchErr);
    }

    // بەکارهێنانی بزوێنەری ئەندازیاریی پرێزنتەیشن بۆ دروستکردنی پێکهاتەی پاک و بێ داتای ساختە
    const audienceMap: Record<AcademicLevel, 'school' | 'undergraduate' | 'doctoral'> = {
      qutabxana: 'school',
      bachelor: 'undergraduate',
      postgrad: 'doctoral'
    };

    try {
      const plan = this.generatePresentationPlan({
        topic,
        targetAudience: audienceMap[academicLevel],
        slideCount
      } as unknown as PresentationRequest);

      const fallbackPres = this.convertPlanToPresentation(plan);
      this.setPresentation(fallbackPres);
      return fallbackPres;
    } catch {
      const cleanStructuralSlides = this.buildStructuralOutlineSlides(topic, academicLevel, slideCount);
      const fallbackPresentation: Presentation = {
        id: 'pres_' + Date.now(),
        title: `توێژینەوەی ئەکادیمی: ${topic}`,
        topic,
        academicLevel,
        slides: cleanStructuralSlides,
        createdAt: new Date().toISOString()
      };
      this.setPresentation(fallbackPresentation);
      return fallbackPresentation;
    }
  }

  /**
   * دروستکردنی چوارچێوەی زانستی بەپێی ژمارەی تەواوی سلایدە داواکراوەکان بەبێ هیچ ئامار و سەرچاوەیەکی ساختە
   */
  private buildStructuralOutlineSlides(topic: string, level: AcademicLevel, count: number): Slide[] {
    const coreStages: { name: string; layout: SlideLayoutType }[] = [
      { name: 'دەروازە و چوارچێوەی چەمکسازی', layout: 'bento-grid' },
      { name: 'پاشخانی مێژوویی و گەشەسەندنی تیۆری', layout: 'process-timeline' },
      { name: 'پۆلێنکاری و بەراوردکاریی میتۆدۆلۆژی', layout: 'comparison-table' },
      { name: 'شیکاریی ڕەهەندە سەرەکییەکان', layout: 'bento-grid' },
      { name: 'خوێندنەوەی ڕەخنەگرانە و لێکەوتەکان', layout: 'hero-split-image' },
      { name: 'دەرئەنجامە زانستییەکان و ڕاسپاردەکان', layout: 'bento-grid' }
    ];

    const slides: Slide[] = [];
    for (let i = 0; i < count; i++) {
      const stage = coreStages[i % coreStages.length];
      const partLabel = i >= coreStages.length ? ` (بەشی ${Math.floor(i / coreStages.length) + 1})` : '';

      slides.push({
        slideNumber: i + 1,
        title: `${stage.name}${partLabel}: ${topic}`,
        subtitle: `تەوەری ژمارە ${i + 1} - ئاستی ${level}`,
        points: [
          `خستنەڕووی بنەما تیۆری و چەمکە سەرەکییەکانی پەیوەست بە «${topic}» لە چوارچێوەی «${stage.name}»دا.`,
          'شیکردنەوەی هۆکار، میکانیزم و لێکەوتە زانستییەکان لەسەر بنەمای سەرچاوە باوەڕپێکراوەکانی توێژینەوەکە.'
        ],
        speakerNotes: `لەم سلایدەدا تیشک دەخەینە سەر «${stage.name}» دەربارەی بابەتی «${topic}».`,
        visualSuggestion: `نەخشەی ڕێکخستنی زانیاری بە شێوازی ${stage.layout}`,
        sources: [],
        visualData: {
          layout: stage.layout,
          transition: 'fade'
        }
      });
    }
    return slides;
  }

  public async refineSlide(
    slide: Slide,
    instruction: string,
    academicLevel: AcademicLevel
  ): Promise<Slide> {
    this.lastError.set(null);
    const response = await fetch('/api/refine-slide', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slide, instruction, academicLevel })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error || 'چاکسازیی سلایدەکە سەرکەوتوو نەبوو، تکایە دووبارە هەوڵ بدەرەوە.';
      this.lastError.set(msg);
      throw new Error(msg);
    }

    const rawSlide = await response.json();
    return validateSlide(rawSlide, slide.slideNumber);
  }

  public async generateSummary(
    topic: string,
    academicLevel: AcademicLevel,
    presentationId: string
  ): Promise<string> {
    this.lastError.set(null);
    const response = await fetch('/api/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, academicLevel })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error || 'دروستکردنی کورتەی زانستی سەرکەوتوو نەبوو.';
      this.lastError.set(msg);
      throw new Error(msg);
    }

    const data = (await response.json()) as { summary: string };
    const summaryText = data.summary || '';

    if (typeof window !== 'undefined' && presentationId && summaryText) {
      try {
        localStorage.setItem(`${STORAGE_KEYS.SUMMARY_PREFIX}${presentationId}`, summaryText);
      } catch (e) {
        console.error('Failed to save summary to localStorage:', e);
      }
    }

    return summaryText;
  }

  public getAssociatedSummary(presentationId: string): string {
    if (typeof window === 'undefined' || !presentationId) return '';
    try {
      return localStorage.getItem(`${STORAGE_KEYS.SUMMARY_PREFIX}${presentationId}`) || '';
    } catch {
      return '';
    }
  }
}
