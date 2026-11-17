import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PresentationService } from '../../core/services/presentation/presentation.service';

@Component({
  selector: 'app-slide-thumbnails',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './slide-thumbnails.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SlideThumbnailsComponent {
  readonly presentationService = inject(PresentationService);
}
