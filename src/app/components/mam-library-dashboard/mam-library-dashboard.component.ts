import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresentationGeneratorService } from '../../core/services/presentation/presentation-generator.service';
import { SlideCanvasComponent } from '../slide-canvas/slide-canvas.component';
import { HeaderToolbarComponent } from '../header-toolbar/header-toolbar.component';

@Component({
  selector: 'app-mam-library-dashboard',
  standalone: true,
  imports: [CommonModule, SlideCanvasComponent, HeaderToolbarComponent],
  templateUrl: './mam-library-dashboard.component.html'
})
export class MamLibraryDashboardComponent {
  presentationData: any = null;
  isLoading = false;
  errorMessage = '';

  constructor(private generator: PresentationGeneratorService) {}

  generatePresentation(topic: string, level: string) {
    if (!topic || topic.trim() === '') {
      this.errorMessage = 'تکایە ناونیشانی بابەتەکە بنووسە';
      return;
    }
    this.isLoading = true;
    this.errorMessage = '';
    this.presentationData = null;

    this.generator.generate(topic, level).subscribe({
      next: (data) => {
        this.presentationData = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('[Dashboard Error]:', err);
        this.errorMessage = 'کێشەیەک ڕوویدا لە پەیوەندیکردن بە ڕاژەی زیرەکی دەستکردەوە. تکایە دووبارە تاقیبکەرەوە.';
        this.isLoading = false;
      }
    });
  }
}
