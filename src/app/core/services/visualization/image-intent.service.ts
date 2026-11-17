import { Injectable } from '@angular/core';
import {
  SlidePlan,
  ImageRequirementStatus,
  RecommendedImagePurpose,
  ImageSpecification
} from '../../models/presentation.model';

export interface ImageIntentResult {
  status: ImageRequirementStatus;
  purpose?: RecommendedImagePurpose;
  rationale: string;
  imageSpec?: ImageSpecification;
}

@Injectable({
  providedIn: 'root'
})
export class ImageIntentService {
  /**
   * Evaluates image necessity and purpose based on academic context and topic semantics.
   */
  evaluateImageIntent(slide: SlidePlan, topic = ''): ImageIntentResult {
    const text = `${topic} ${slide.title} ${slide.contentPlan?.explanation || ''}`.toLowerCase();

    // Title and Reference slides do not need background decorative images
    if (slide.slideType === 'title' || slide.slideType === 'agenda' || slide.slideType === 'reference') {
      return {
        status: 'imageNotRecommended',
        rationale: 'سلایدی سەرەکی یان پێڕست و سەرچاوەکان دەبێت سادە و ڕوون بن بە بێ وێنەی زیادە'
      };
    }

    // Historical context
    if (text.includes('مێژوو') || text.includes('سەردەم') || text.includes('شوێنەوار') || text.includes('history')) {
      return {
        status: 'imageRequired',
        purpose: 'historical',
        rationale: 'ناوەڕۆکی مێژوویی بۆ سەلماندنی ئەکادیمی پێویستی بە وێنەی بەڵگەنامەیی هەیە',
        imageSpec: this.buildSpec(slide, 'historical', 'historical_photo', topic)
      };
    }

    // Scientific / Experimental / Technical
    if (text.includes('تاقیگە') || text.includes('پزیشکی') || text.includes('زانستی') || text.includes('نەخشە')) {
      return {
        status: 'imageRequired',
        purpose: 'scientific',
        rationale: 'ڕوونکردنەوەی تاقیگەیی و پرۆسەی زانستی پێویستی بە وێنەی تەکنیكی یان دیاگرامە',
        imageSpec: this.buildSpec(slide, 'scientific', 'scientific_illustration', topic)
      };
    }

    // Explicit requirement from slide plan
    if (slide.imageRequired) {
      const purposeMap: Record<string, RecommendedImagePurpose> = {
        historical_context: 'historical',
        geographic_context: 'context',
        scientific_illustration: 'scientific',
        artifact_photo: 'context',
        concept_diagram: 'conceptual'
      };
      const purpose = purposeMap[slide.imagePurpose || ''] || 'illustration';

      return {
        status: 'imageRequired',
        purpose,
        rationale: slide.imageDescription || 'وێنەیی پێویست بەپێی پلانی سلاید دیاریکراوە',
        imageSpec: this.buildSpec(slide, purpose, 'contextual_photo', topic)
      };
    }

    return {
      status: 'imageOptional',
      purpose: 'illustration',
      rationale: 'وێنە لەم سلایدەدا بەکارهێنانی ئارەزوومەندانەیە و تەنها بۆ پشتیوانی چەمکەکە دەبێت'
    };
  }

  private buildSpec(
    slide: SlidePlan,
    purpose: RecommendedImagePurpose,
    visualStyle: ImageSpecification['visualStyle'],
    topic: string
  ): ImageSpecification {
    return {
      id: `img_intent_${slide.slideNumber}_${Date.now()}`,
      subject: slide.title,
      purpose,
      visualStyle,
      aspectRatio: '16:9',
      composition: 'پێکهاتەی ئەکادیمی هاوسەنگ لەگەڵ ڕووبەری سپی بۆ ڕوونی دەق',
      requiredElements: [slide.title, 'عنصری سەرەکی زانستی'],
      prohibitedElements: ['دەقی دروستکراو سەر وێنە', 'وێنەی ڕێکەوتیی نەپەیوەندیدار'],
      academicContext: `تایبەت بە تێگەیشتنی: ${topic || slide.title}`,
      imageRequired: true,
      accessibilityDescription: `وێنەی ڕوونکردنەوەیی بۆ سلایدی ${slide.title}`
    };
  }
}
