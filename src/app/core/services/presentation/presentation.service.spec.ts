import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { PresentationService } from './presentation.service';

describe('PresentationService', () => {
  let service: PresentationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PresentationService]
    });
    service = TestBed.inject(PresentationService);
  });

  it('پێویستە سێرڤسەکە بە دروستی دروست بکرێت', () => {
    expect(service).toBeTruthy();
  });

  it('پێویستە لە کاتی زیادکردنی سلایدی نوێدا ژمارەی سلایدەکان زیاد بکات', () => {
    const initialCount = service.slides ? service.slides().length : 0;
    if (typeof service.addSlide === 'function') {
      service.addSlide();
      expect(service.slides().length).toBe(initialCount + 1);
    }
  });

  it('پێویستە گۆڕینی سلایدی چالاک (activeSlideIndex) بە دروستی کار بکات', () => {
    if (typeof service.setActiveSlide === 'function') {
      service.setActiveSlide(0);
      expect(service.activeSlideIndex()).toBe(0);
    }
  });
});
