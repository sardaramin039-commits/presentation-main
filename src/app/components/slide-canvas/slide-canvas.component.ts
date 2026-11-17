import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PresentationData, SlideLayout } from '../../core/services/design/presentation-design-engine.service';

@Component({
  selector: 'app-slide-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slide-canvas.component.html'
})
export class SlideCanvasComponent implements OnChanges {
  @Input() presentationData: PresentationData | null = null;
  currentIndex = 0;
  currentSlide: SlideLayout | null = null;
  animationState = 'slide-transition';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['presentationData']) {
      this.currentIndex = 0;
      this.currentSlide = this.presentationData?.slides[0] ?? null;
      if (this.currentSlide) this.triggerTransition();
    }
  }

  nextSlide(): void {
    const slides = this.presentationData?.slides ?? [];
    if (this.currentIndex < slides.length - 1) {
      this.currentIndex++;
      this.triggerTransition();
    }
  }

  prevSlide(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.triggerTransition();
    }
  }

  private triggerTransition(): void {
    const slides = this.presentationData?.slides ?? [];
    this.currentSlide = slides[this.currentIndex] ?? null;
    this.animationState = '';
    setTimeout(() => {
      this.animationState = 'slide-transition';
    }, 10);
  }
}
