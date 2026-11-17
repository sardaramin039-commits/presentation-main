import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { SlideCanvasComponent } from './slide-canvas.component';
import { PresentationService } from '../../core/services/presentation/presentation.service';
import { Slide } from '../../core/models/presentation.model';

describe('SlideCanvasComponent', () => {
  let component: SlideCanvasComponent;
  let presentationService: PresentationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    presentationService = TestBed.inject(PresentationService);
    
    // Set a mock presentation with slides
    const mockSlide: Slide = {
      slideNumber: 1,
      title: 'بونیادی لێکۆڵینەوە',
      points: ['خاڵی سەرەکی دەستپێک', 'شیکردنەوەی تیۆری'],
      speakerNotes: 'تێبینی بۆ پێشکەشکار',
      visualSuggestion: 'چارت'
    };

    presentationService.setPresentation({
      id: 'test-pres',
      title: 'پێشکەشکردنی تاقیکاری',
      topic: 'تەوەری سەرەکی',
      academicLevel: 'bachelor',
      slides: [mockSlide],
      createdAt: new Date().toISOString()
    });

    TestBed.runInInjectionContext(() => {
      component = new SlideCanvasComponent();
    });
  });

  it('should be created and compute active slide', () => {
    expect(component).toBeDefined();
    const active = component.activeSlide();
    expect(active).toBeDefined();
    expect(active?.title).toBe('بونیادی لێکۆڵینەوە');
    expect(active?.bulletPoints?.length).toBe(2);
  });

  it('should cycle layout from bento-grid to hero-split-image', () => {
    const active = component.activeSlide()!;
    component.cycleLayout(active);

    const updated = component.activeSlide()!;
    expect(updated.visualData?.layout).toBe('hero-split-image');
  });

  it('should regenerate visuals with stats and image', () => {
    const active = component.activeSlide()!;
    component.regenerateVisuals(active);

    const updated = component.activeSlide()!;
    expect(updated.visualData?.stats?.length).toBeGreaterThan(0);
    expect(updated.visualData?.image?.url).toContain('picsum.photos');
  });

  it('should enhance slide content with AI polish', () => {
    const active = component.activeSlide()!;
    component.enhanceWithAI(active);

    const updated = component.activeSlide()!;
    expect(updated.title).toContain('شیکاری:');
  });
});
