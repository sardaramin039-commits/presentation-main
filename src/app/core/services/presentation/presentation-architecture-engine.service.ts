import { Injectable, inject } from '@angular/core';
import {
  PresentationPlan,
  PresentationRequest,
  PresentationContext,
  AcademicLevel,
  VisualDesignPlan
} from '../../models/presentation.model';
import { PresentationAudienceService } from '../presentation-audience.service';
import { PresentationNarrativeService } from '../presentation-narrative.service';
import { PresentationAllocationService } from '../presentation-allocation.service';
import { PresentationVisualIntentService } from '../presentation-visual-intent.service';
import { PresentationValidationService } from '../presentation-validation.service';
import { SlideCompositionEngineService } from '../slide-composition-engine.service';
import { VisualStorytellingEngineService } from '../visual-storytelling-engine.service';
import { Slide } from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class PresentationArchitectureEngineService {
  private audienceService = inject(PresentationAudienceService);
  private narrativeService = inject(PresentationNarrativeService);
  private allocationService = inject(PresentationAllocationService);
  private visualIntentService = inject(PresentationVisualIntentService);
  private validationService = inject(PresentationValidationService);
  private compositionEngine = inject(SlideCompositionEngineService);
  private storytellingEngine = inject(VisualStorytellingEngineService);

  /**
   * Main entry point: Transforms verified academic research into an auditable Presentation Architecture Plan.
   */
  buildPresentationPlan(
    request: PresentationRequest,
    contextInput: Partial<PresentationContext> = {}
  ): PresentationPlan {
    const audienceProfile = this.audienceService.getAudienceProfile(
      request.targetAudience,
      request.academicLevel
    );

    const fullContext: PresentationContext = {
      request,
      audienceProfile,
      academicDocument: contextInput.academicDocument,
      claims: contextInput.claims || contextInput.academicDocument?.claims || [],
      evidenceList: contextInput.evidenceList || [],
      sources: contextInput.sources || contextInput.academicDocument?.sources || [],
      citations: contextInput.citations || contextInput.academicDocument?.citations || [],
      researchPlan: contextInput.researchPlan
    };

    // Step 1: Narrative Architecture
    const narrative = this.narrativeService.generateNarrative(request, fullContext);

    // Step 2: Content Allocation across slides
    const rawSlides = this.allocationService.allocateContentToSlides(narrative, fullContext, request);

    // Step 3: Apply Visual Intent Hints & Data Viz Types
    const slidesWithVisuals = this.visualIntentService.applyVisualIntents(rawSlides, fullContext);

    // Step 4: Validate Presentation & Run Academic Integrity Gate
    const { validation, integrityGate } = this.validationService.validatePresentation(
      slidesWithVisuals,
      narrative,
      fullContext
    );

    const planId = `plan_pres_${Date.now()}`;
    const title = fullContext.academicDocument?.title || request.topic || 'پێشکەشکردنی ئەکادیمی';

    const simpleSlides: Slide[] = slidesWithVisuals.map(s => ({
      slideNumber: s.slideNumber,
      title: s.title,
      points: s.contentPlan.blocks.map(b => b.text),
      speakerNotes: s.speakerNotes,
      visualSuggestion: s.dataVizDescription || s.imageDescription || `شێوازی visual: ${s.layoutIntent}`
    }));

    const visualStory = this.storytellingEngine.generateVisualStory(
      title,
      simpleSlides,
      fullContext.claims,
      fullContext.evidenceList,
      fullContext.citations,
      fullContext.sources
    );

    return {
      id: planId,
      title,
      request,
      context: fullContext,
      narrative,
      slides: slidesWithVisuals,
      validation,
      integrityGate,
      visualStory,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Builds a full Visual Design Plan using BATCH 13 composition engine.
   */
  buildVisualDesignPlan(presentationPlan: PresentationPlan): VisualDesignPlan {
    return this.compositionEngine.generateDesignPlan({
      topic: presentationPlan.request.topic,
      academicLevel: (presentationPlan.request.academicLevel as AcademicLevel) || 'bachelor',
      audienceProfile: presentationPlan.request.targetAudience,
      presentationPurpose: presentationPlan.request.presentationPurpose,
      slidePlans: presentationPlan.slides,
      aspectRatio: '16:9'
    });
  }
}

