import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectWorkspaceService } from '../../core/services/workspace/project-workspace.service';
import { UserRole } from '../../core/models/project-workspace.model';

@Component({
  selector: 'app-academic-review-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './academic-review-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AcademicReviewPanelComponent {
  readonly workspaceService = inject(ProjectWorkspaceService);

  newCommentText = '';
  authorRole: UserRole = 'supervisor';

  updateStep(stepId: string, status: 'approved' | 'revision_requested'): void {
    const comments = status === 'approved' ? 'پەسەندکراوە لەلایەن سەرپەرشتیارەوە' : 'پێویستی بە چاکسازی هەیە';
    this.workspaceService.updateWorkflowStep(stepId, status, comments);
  }

  submitComment(): void {
    if (!this.newCommentText.trim()) return;
    this.workspaceService.addComment('بەشی گشتی', this.newCommentText.trim(), this.authorRole);
    this.newCommentText = '';
  }

  createSnapshot(): void {
    const label = `وەشانی ئەکادیمی ${new Date().toLocaleTimeString('ku-IQ')}`;
    this.workspaceService.createVersionSnapshot(label, 'پاشەکەوتکردنی دەستکاریکردنەکانی سیمینار');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'approved':
        return 'bg-emerald-100 text-emerald-800';
      case 'revision_requested':
        return 'bg-amber-100 text-amber-800';
      case 'in_review':
        return 'bg-indigo-100 text-indigo-800';
      case 'pending':
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approved':
        return 'پەسەندکراو ✓';
      case 'revision_requested':
        return 'چاکسازی داواکراوە ↺';
      case 'in_review':
        return 'لەژێر پێداچوونەوەدایە ◷';
      case 'pending':
      default:
        return 'چاوەڕوانکراو';
    }
  }
}
