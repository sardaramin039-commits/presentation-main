import { Injectable } from '@angular/core';
import {
  SlidePlan,
  ImagePlacementSpec,
  ImageRole
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class ImagePlacementService {
  /**
   * Generates a specification for image placement on a slide without generating fake image files.
   */
  generateImageSpec(slide: SlidePlan): ImagePlacementSpec {
    const imageRequired = slide.imageRequired;
    const role = this.determineImageRole(slide);
    const placementZoneId = 'visual_zone';
    const aspectRatio = this.determineAspectRatio(role, slide.layoutIntent);
    const cropMode = role === 'background' ? 'cover' : 'contain';
    const priority = imageRequired ? 'high' : 'medium';
    const prompt = slide.imageDescription || `وێنەی ڕوونکردنەوەیی بۆ سڵایدی: ${slide.title}`;

    return {
      imageRequired,
      imageRole: role,
      placementZoneId,
      aspectRatio,
      cropMode,
      visualPriority: priority,
      promptOrDescription: prompt,
      hasRealAsset: false,
      assetUrl: undefined
    };
  }

  private determineImageRole(slide: SlidePlan): ImageRole {
    if (slide.imagePurpose === 'scientific_illustration' || slide.imagePurpose === 'artifact') {
      return 'evidence';
    }
    if (slide.imagePurpose === 'historical_context' || slide.imagePurpose === 'geographic_context') {
      return 'contextual';
    }
    if (slide.imagePurpose === 'person' || slide.imagePurpose === 'location') {
      return 'explanatory';
    }
    if (slide.slideType === 'title') {
      return 'background';
    }
    return 'conceptual';
  }

  private determineAspectRatio(role: ImageRole, layoutIntent: string): '16:9' | '4:3' | '1:1' | '3:2' | 'custom' {
    if (role === 'background' || layoutIntent === 'title_hero') return '16:9';
    if (role === 'evidence') return '4:3';
    return '1:1';
  }
}
