import { Injectable, inject } from '@angular/core';
import { ImageElement } from '../../models/slide-design.model';
import { SlidePlan } from '../../models/presentation.model';
import { ImageProvenanceService } from '../image-provenance.service';

@Injectable({
  providedIn: 'root'
})
export class AutomaticImagePlacementService {
  private provenanceService = inject(ImageProvenanceService);

  /**
   * Evaluates slide intent and places images only when there is a clear semantic purpose.
   * Avoids adding purely decorative filler images.
   */
  determineImagePlacement(slide: SlidePlan): ImageElement | null {
    const visualSuggestion = (slide as { visualSuggestion?: string }).visualSuggestion;
    if (!slide.imageRequired && !slide.imageDescription && !visualSuggestion) {
      return null;
    }

    let semanticPurpose: 'hero' | 'supporting' | 'comparison' | 'diagram' | 'illustration' = 'supporting';

    if (slide.slideType === 'title' || slide.purpose === 'introduce') {
      semanticPurpose = 'hero';
    } else if (slide.slideType === 'comparison' || slide.purpose === 'compare') {
      semanticPurpose = 'comparison';
    } else if (slide.visualIntentHints.includes('process') || slide.visualIntentHints.includes('hierarchy')) {
      semanticPurpose = 'diagram';
    } else if (slide.imagePurpose === 'scientific_illustration' || slide.imagePurpose === 'historical_context') {
      semanticPurpose = 'illustration';
    }

    const description = slide.imageDescription || visualSuggestion || slide.title;

    return this.provenanceService.createVerifiedImageElement({
      id: `img_element_${slide.slideNumber}_${Date.now()}`,
      imageId: `img_slide_${slide.slideNumber}`,
      source: 'unknown', // Default until actual verified image is attached
      sourceType: 'unknown',
      altText: `وێنەی زانستی بۆ: ${description}`,
      semanticPurpose,
      bounds: { xPct: 5, yPct: 22, wPct: 38, hPct: 62 },
      aspectRatio: '16:9'
    });
  }
}
