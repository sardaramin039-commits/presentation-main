import { Injectable } from '@angular/core';

export interface SlideLayout {
  title: string;
  bullets: string[];
  visualType: 'text' | 'chart' | 'image' | 'table';
  citation: string;
  speakerNotes: string;
}

export interface PresentationData {
  title: string;
  slides: SlideLayout[];
}

@Injectable({ providedIn: 'root' })
export class PresentationDesignEngineService {
  
  /**
   * مەرجە ئەکادیمی و دیزاینەکان بەسەر داتاکەدا دەسەپێنێت پێش نیشاندانی
   */
  enforceAcademicDesignStandards(presentation: PresentationData): PresentationData {
    const refinedSlides = presentation.slides.map(slide => {
      // یاسای یەکەم: پاراستنی بۆشایی و ڕێگریکردن لە قەرەباڵغی
      if (slide.bullets.length > 4) {
        const overflow = slide.bullets.splice(4);
        slide.speakerNotes += '\n\nزانیاری زیاتر بۆ کاتی پێشکەشکردن:\n' + overflow.join('\n');
      }

      // یاسای دووەم: پشکنینی سەرچاوە
      if (!slide.citation || slide.citation.trim() === '') {
        slide.citation = '[پێویستە سەرچاوە پشتڕاست بکرێتەوە]';
      }

      return slide;
    });

    return {
      title: presentation.title,
      slides: refinedSlides
    };
  }
}
