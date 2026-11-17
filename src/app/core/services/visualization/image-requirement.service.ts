import { Injectable } from '@angular/core';
import {
  SlidePlan,
  ImageSpecification,
  PresentationContext,
  SlideImagePurpose
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class ImageRequirementService {
  /**
   * Evaluates image necessity and generates semantic ImageSpecification for a slide.
   */
  evaluateImageRequirement(
    slide: SlidePlan,
    context?: PresentationContext
  ): {
    status: 'image_needed' | 'image_optional' | 'image_not_needed';
    spec?: ImageSpecification;
    reason: string;
  } {
    const topic = context?.request.topic || '';
    const title = slide.title || '';
    const text = `${topic} ${title} ${slide.contentPlan?.explanation || ''}`.toLowerCase();

    // Pure text/title slides don't need images
    if (slide.slideType === 'title' || slide.slideType === 'agenda' || slide.slideType === 'reference') {
      return {
        status: 'image_not_needed',
        reason: 'سلایدی سەرەک یان سەرچاوەکان پێویستی بە وێنەی دیکۆراتی نییە'
      };
    }

    // Historical context
    if (text.includes('مێژوو') || text.includes('شوێنەوار') || text.includes('سەردەم') || text.includes('history')) {
      const spec = this.buildImageSpec(slide, 'historical_context', 'historical_photo', topic);
      return {
        status: 'image_needed',
        spec,
        reason: 'سلایدەکە باسی خاڵی مێژوویی یان کلتوری دەکات کە وێنەی بەڵگەنامەیی بەهای زانستی زیاد دەکات'
      };
    }

    // Geographic context
    if (text.includes('جوگرافیا') || text.includes('نەخشە') || text.includes('هەرێم') || text.includes('geography')) {
      const spec = this.buildImageSpec(slide, 'geographic_context', 'contextual_photo', topic);
      return {
        status: 'image_needed',
        spec,
        reason: 'سلایدەکە زانیاری شوێنپێی جوگرافی لەخۆدەگرێت'
      };
    }

    // Scientific or technological
    if (text.includes('زانستی') || text.includes('پزیشکی') || text.includes('تەکنەلۆژیا') || text.includes('تاقیگە')) {
      const spec = this.buildImageSpec(slide, 'scientific_illustration', 'scientific_illustration', topic);
      return {
        status: 'image_needed',
        spec,
        reason: 'ڕوونکردنەوەی زانستی و دیاگرام بە شێوەی وێنەیی لایەنی تێگەیشتن کارا دەکات'
      };
    }

    // Artifact or visual evidence
    if (slide.imageRequired && slide.imagePurpose) {
      const spec = this.buildImageSpec(slide, slide.imagePurpose, 'contextual_photo', topic);
      return {
        status: 'image_needed',
        spec,
        reason: slide.imageDescription || 'پێویستی وێنەیی بەپێی پلانەکەی پێشوو دیاریکراوە'
      };
    }

    return {
      status: 'image_not_needed',
      reason: 'سەرمایەی بینراوی ئەم سلایدە لەڕێگەی دیاگرام، خشتە یان دەقی ڕێکخراو زیاتر دەپڕکێندرێت'
    };
  }

  private buildImageSpec(
    slide: SlidePlan,
    purpose: SlideImagePurpose,
    visualStyle: ImageSpecification['visualStyle'],
    topic: string
  ): ImageSpecification {
    const isHistorical = purpose === 'historical_context';
    const isGeographic = purpose === 'geographic_context';

    return {
      id: `img_spec_${slide.slideNumber}_${Date.now()}`,
      subject: `${slide.title} (${topic})`,
      purpose,
      visualStyle,
      aspectRatio: '16:9',
      composition: 'هاوسەنگکراوی ئەکادیمی لەگەڵ ڕووبەری بەتاڵ بۆ ناونیشان و ڕوونکردنەوە',
      requiredElements: [slide.title, 'بەڵگەی بەکارهاتووی زانستی'],
      prohibitedElements: ['وێنەی دیکۆراتیی بێمۆڵەت', 'تێکستی دروستکراو سەر وێنە'],
      academicContext: `بۆ ئاستی زانستی: ${topic}`,
      sourceRequirement: isHistorical || isGeographic ? 'سەرچاوەی بەڵگەنامەیی پشتڕاستکراوە' : undefined,
      evidenceRequirement: slide.evidenceMaps[0]?.evidenceSnippet,
      imageRequired: true,
      accessibilityDescription: `وێنەی بەڵگەنامەیی بۆ ڕوونکردنەوەی ${slide.title}`
    };
  }
}
