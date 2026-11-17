import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-slide-canvas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './slide-canvas.component.html'
})
export class SlideCanvasComponent implements OnChanges {
  @Input() presentationData: any = null;
  
  currentIndex = 0;
  currentSlide: any = null;
  animationState = 'slide-transition';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['presentationData'] && this.presentationData?.slides?.length > 0) {
      this.currentIndex = 0;
      this.triggerTransition();
    }
  }

  nextSlide() {
    if (this.presentationData && this.currentIndex < this.presentationData.slides.length - 1) {
      this.currentIndex++;
      this.triggerTransition();
    }
  }

  prevSlide() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.triggerTransition();
    }
  }

  private triggerTransition() {
    this.currentSlide = this.presentationData.slides[this.currentIndex];
    this.animationState = '';
    setTimeout(() => {
      this.animationState = 'slide-transition';
    }, 10);
  }
}
