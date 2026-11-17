import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, map, switchMap } from 'rxjs';
import { PresentationDesignEngineService, PresentationData } from '../design/presentation-design-engine.service';
import { AcademicReviewEngineService } from '../academic/academic-review-engine.service';
import { AuthService } from '../workspace/auth.service';

@Injectable({ providedIn: 'root' })
export class PresentationGeneratorService {
  private readonly http = inject(HttpClient);
  private readonly designEngine = inject(PresentationDesignEngineService);
  private readonly academicReview = inject(AcademicReviewEngineService);
  private readonly authService = inject(AuthService);

  generate(topic: string, academicLevel = 'bachelor'): Observable<PresentationData> {
    // گۆڕینی بەستەرەکە بۆ /api/generate-presentation
    return from(this.authService.getFirebaseIdToken()).pipe(
      switchMap(token => this.http.post<{success: boolean, data: PresentationData}>('/api/generate-presentation', {
        topic,
        academicLevel
      }, token ? { headers: { Authorization: `Bearer ${token}` } } : {})),
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
