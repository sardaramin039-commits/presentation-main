import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresentationGeneratorService } from '../../core/services/presentation/presentation-generator.service';
import { PresentationData } from '../../core/services/design/presentation-design-engine.service';
import { SlideCanvasComponent } from '../slide-canvas/slide-canvas.component';
import { HeaderToolbarComponent } from '../header-toolbar/header-toolbar.component';
import { AuthService } from '../../core/services/workspace/auth.service';

@Component({
  selector: 'app-mam-library-dashboard',
  standalone: true,
  imports: [CommonModule, SlideCanvasComponent, HeaderToolbarComponent],
  templateUrl: './mam-library-dashboard.component.html'
})
export class MamLibraryDashboardComponent {
  presentationData: PresentationData | null = null;
  isLoading = false;
  errorMessage = '';
  private readonly generator = inject(PresentationGeneratorService);
  readonly authService = inject(AuthService);

  generatePresentation(topic: string, level: string): void {
    if (!this.authService.isAuthenticated()) {
      this.errorMessage = 'بۆ دروستکردنی پرێزێنتەیشن تکایە سەرەتا بە Google بچۆ ژوورەوە.';
      return;
    }
    const cleanTopic = topic.trim();
    if (!cleanTopic) {
      this.errorMessage = 'تکایە ناونیشانی بابەتەکە بنووسە';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.presentationData = null;
    this.generator.generate(cleanTopic, level).subscribe({
      next: (data) => {
        this.presentationData = data;
        this.isLoading = false;
      },
      error: (err: unknown) => {
        console.error('[Dashboard Error]:', err);
        this.errorMessage = 'کێشەیەک ڕوویدا لە پەیوەندیکردن بە ڕاژەی زیرەکی دەستکردەوە. تکایە دووبارە تاقیبکەرەوە.';
        this.isLoading = false;
      }
    });
  }
}
