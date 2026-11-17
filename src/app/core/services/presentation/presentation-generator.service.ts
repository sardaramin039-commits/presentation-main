import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { PresentationDesignEngineService, PresentationData } from '../design/presentation-design-engine.service';
import { AcademicReviewEngineService } from '../academic/academic-review-engine.service';

@Injectable({ providedIn: 'root' })
export class PresentationGeneratorService {
  constructor(
    private http: HttpClient,
    private designEngine: PresentationDesignEngineService,
    private academicReview: AcademicReviewEngineService
  ) {}

  generate(topic: string, academicLevel: string = 'university'): Observable<PresentationData> {
    // گۆڕینی بەستەرەکە بۆ /api/generate-presentation
    return this.http.post<{success: boolean, data: PresentationData}>('/api/generate-presentation', {
      topic,
      academicLevel
    }).pipe(
      map(response => {
        if (!response.success || !response.data) {
          throw new Error('کێشە لە وەرگرتنی داتای پرێزێنتەیشنەکەدا هەیە');
        }
        
        const reviewReport = this.academicReview.evaluateContent(response.data.slides);
        
        if (!reviewReport.isAcademicallyRigorous && response.data.slides.length > 0) {
           response.data.slides[0].speakerNotes = 
             '⚠️ تێبینییەکانی سیستەمی پێداچوونەوەی ئەکادیمی:\n' + 
             reviewReport.warnings.join('\n') + 
             '\n\n' + (response.data.slides[0].speakerNotes || '');
        }

        return this.designEngine.enforceAcademicDesignStandards(response.data);
      })
    );
  }
}
