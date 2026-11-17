import { Injectable } from '@angular/core';
import { AnimationSpec, TransitionSpec } from '../../models/slide-design.model';
import { SlidePlan } from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class AnimationTransitionEngineService {
  /**
   * Generates animation and transition specifications while reporting PPTX export support status accurately.
   */
  getAnimationAndTransition(
    slide: SlidePlan,
    academicLevel = 'bachelor',
    presentationPurpose = 'research_presentation'
  ): { animations: AnimationSpec[]; transition: TransitionSpec } {
    let transitionType: TransitionSpec['type'] = 'fade';
    let durationMs = 500;

    // Academic levels prefer subtle non-distracting transitions
    if (academicLevel === 'postgrad' || academicLevel === 'doctoral' || presentationPurpose === 'thesis_defense') {
      transitionType = 'fade';
      durationMs = 300;
    } else if (academicLevel === 'qutabxana' || academicLevel === 'school') {
      transitionType = 'slide';
      durationMs = 600;
    }

    const transition: TransitionSpec = {
      type: transitionType,
      durationMs,
      isSupportedInExport: true,
      unsupportedReason: undefined
    };

    // Animation specs per element
    const animations: AnimationSpec[] = [
      {
        elementId: `slide_text_${slide.slideNumber}`,
        type: 'fade',
        trigger: 'onClick',
        durationMs: 400,
        isSupportedInExport: true
      }
    ];

    // Check if user requested complex morph or 3D animations that pptxgenjs/PowerPoint API limits
    if (slide.visualIntentHints?.includes('conceptual_diagram')) {
      animations.push({
        elementId: `complex_morph_${slide.slideNumber}`,
        type: 'none',
        trigger: 'onClick',
        durationMs: 0,
        isSupportedInExport: false,
        unsupportedReason: 'ئەنیمەیشنی ئاڵۆزی Morph یان 3D لە ئاستی داونلۆدی بێبەرامبەری PPTX هەمان کات بەشێوەی ئۆتۆماتیک ڕادەگیرێت تا خێرایی بپارێزێت.'
      });
    }

    return { animations, transition };
  }
}
