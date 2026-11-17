import { Injectable } from '@angular/core';
import {
  SlidePlan,
  VisualIntentHint,
  DataVizType,
  SlideImagePurpose,
  PresentationContext
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class PresentationVisualIntentService {
  /**
   * Enriches slide plans with semantic visual intent hints, data visualization types, and image intents.
   */
  applyVisualIntents(slides: SlidePlan[], context: PresentationContext): SlidePlan[] {
    return slides.map(slide => {
      const visualIntentHints = this.deriveVisualHints(slide);
      const { dataVizType, dataVizDescription } = this.detectDataVizIntent(slide);
      const { imageRequired, imagePurpose, imageDescription } = this.detectImageIntent(slide, context);

      return {
        ...slide,
        visualIntentHints,
        dataVizType,
        dataVizDescription,
        imageRequired,
        imagePurpose,
        imageDescription
      };
    });
  }

  private deriveVisualHints(slide: SlidePlan): VisualIntentHint[] {
    const hints: VisualIntentHint[] = [];
    const text = (slide.title + ' ' + slide.contentPlan.explanation + ' ' + (slide.contentPlan.primaryClaim?.statement || '')).toLowerCase();

    if (slide.slideType === 'agenda' || text.includes('نەخشەڕێگا') || text.includes('پێڕست')) {
      hints.push('process');
    }

    if (slide.slideType === 'methodology' || text.includes('پڕۆسە') || text.includes('قۆناغ')) {
      hints.push('process');
    }

    if (slide.slideType === 'comparison' || text.includes('بەراورد') || text.includes('جیاوازی')) {
      hints.push('comparison');
    }

    if (text.includes('مێژوو') || text.includes('تێپەڕبوونی کات') || text.includes('ساڵ')) {
      hints.push('timeline');
    }

    if (slide.evidenceMaps.length > 0) {
      hints.push('evidence_card');
    }

    if (text.match(/\d+%/g) || text.match(/\d+\.\d+/g)) {
      hints.push('quantitative_data');
    }

    if (hints.length === 0) {
      hints.push('conceptual_diagram');
    }

    return hints;
  }

  private detectDataVizIntent(slide: SlidePlan): { dataVizType: DataVizType; dataVizDescription?: string } {
    const claimText = slide.contentPlan.primaryClaim?.statement || '';
    const evidenceText = slide.contentPlan.evidence.map(e => e.extractedSnippet).join(' ');
    const fullText = `${claimText} ${evidenceText} ${slide.title}`;

    if (slide.slideType === 'agenda' || slide.title.includes('نەخشەڕێگا')) {
      return {
        dataVizType: 'timeline',
        dataVizDescription: 'هێڵکاری و نەخشەڕێگای تەوەرە سەرەکییەکان (Roadmap Process Flow)'
      };
    }

    // Look for percentage patterns or numbers
    const percentages = fullText.match(/%\d+|\d+%/g);
    const numbers = fullText.match(/\b\d+(\.\d+)?\b/g);

    if (percentages && percentages.length >= 2) {
      return {
        dataVizType: 'bar_chart',
        dataVizDescription: `چارتی ستوونی بۆ نیشاندانی بەراوردی ڕێژە سەدییەکان: (${percentages.join('، ')})`
      };
    }

    if (fullText.includes('گۆڕانکاری لەگەڵ کاتدا') || fullText.includes('ڕەوت')) {
      return {
        dataVizType: 'line_chart',
        dataVizDescription: 'چارتی هێڵی بۆ ڕوونکردنەوەی ڕەوتی گەشە یان گۆڕانکاری'
      };
    }

    if (slide.slideType === 'comparison' && slide.contentPlan.evidence.length >= 2) {
      return {
        dataVizType: 'comparison_matrix',
        dataVizDescription: 'خشتەی بەراوردکاری بۆ دیاریکردنی خاڵە هاوبەش و جیاوازەکان'
      };
    }

    if (numbers && numbers.length >= 4) {
      return {
        dataVizType: 'table',
        dataVizDescription: 'خشتەی زانیاری بۆ ڕێکخستنی ژمارە و ئامارەکان'
      };
    }

    return { dataVizType: 'none' };
  }

  private detectImageIntent(
    slide: SlidePlan,
    context: PresentationContext
  ): { imageRequired: boolean; imagePurpose?: SlideImagePurpose; imageDescription?: string } {
    const topic = context.request.topic || '';
    const title = slide.title || '';
    const fullText = `${topic} ${title}`.toLowerCase();

    if (slide.slideType === 'title') {
      return {
        imageRequired: true,
        imagePurpose: 'conceptual_visual',
        imageDescription: `وێنەیەکی سەرنجڕاکێش، هونەری و پەیوەندیدار بە تەوەری سەرەکیی: ${topic || title}`
      };
    }

    if (title.includes('پرسیار') || title.includes('q&a') || title.includes('گفتوگۆ')) {
      return {
        imageRequired: true,
        imagePurpose: 'conceptual_visual',
        imageDescription: 'وێنە یان ئایکۆنێکی سادە، مینیماڵ و پاکی نیشانەی پرسیار و دەرفەتی دیالۆگ (Clean minimalist Q&A visual)'
      };
    }

    if (fullText.includes('مێژوو') || fullText.includes('مێژوویی') || fullText.includes('شۆڕش')) {
      return {
        imageRequired: true,
        imagePurpose: 'historical_context',
        imageDescription: `وێنەی بەڵگەنامەیی یان مێژوویی پەیوەندیدار بە: ${slide.title}`
      };
    }

    if (fullText.includes('جوگرافیا') || fullText.includes('نەخشە') || fullText.includes('شوێن')) {
      return {
        imageRequired: true,
        imagePurpose: 'geographic_context',
        imageDescription: `نەخشە یان وێنەی جوگرافی بۆ: ${slide.title}`
      };
    }

    if (fullText.includes('زانستی') || fullText.includes('پزیشکی') || fullText.includes('تەکنەلۆژیا')) {
      return {
        imageRequired: true,
        imagePurpose: 'scientific_illustration',
        imageDescription: `دیاگرام یان هێڵکاریی زانستی بۆ: ${slide.title}`
      };
    }

    return { imageRequired: false };
  }
}
