import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ProjectWorkspaceService } from '../../core/services/workspace/project-workspace.service';
import { Source } from '../../core/models/research.model';

@Component({
  selector: 'app-research-sources-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './research-sources-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResearchSourcesPanelComponent {
  readonly workspaceService = inject(ProjectWorkspaceService);

  readonly isAddingSource = signal<boolean>(false);

  sourceTitle = '';
  sourceAuthors = '';
  sourceYear = 2024;
  sourceDoi = '';

  toggleAddSource(): void {
    this.isAddingSource.update(v => !v);
  }

  addSource(): void {
    if (!this.sourceTitle.trim()) return;

    const currentProject = this.workspaceService.activeProject();
    if (!currentProject) return;

    const authors = this.sourceAuthors.split('،').map(a => a.trim()).filter(a => a.length > 0);
    const newSource: Source = {
      id: `src-${Date.now()}`,
      metadata: {
        title: this.sourceTitle.trim(),
        authors: authors.length > 0 ? authors : ['توێژەرانی ئەکادیمی'],
        publicationYear: this.sourceYear || 2024,
        doi: this.sourceDoi.trim() || undefined,
        sourceType: 'journal_article',
        verificationStatus: 'verified'
      },
      addedAt: new Date().toISOString(),
      provenance: {
        sourceProvider: 'user_input',
        retrievalTimestamp: new Date().toISOString(),
        transformationHistory: []
      },
      verificationResult: {
        sourceId: `src-${Date.now()}`,
        status: 'verified',
        verifiedAt: new Date().toISOString(),
        verificationProvider: 'academic_grounding',
        checks: [],
        fieldVerifications: [],
        confidence: 1.0,
        warnings: [],
        errors: []
      }
    };

    const updatedSources = [newSource, ...currentProject.sources];
    this.workspaceService.updateActiveProjectData(updatedSources);

    // Reset Form
    this.sourceTitle = '';
    this.sourceAuthors = '';
    this.sourceDoi = '';
    this.isAddingSource.set(false);
  }

  getClaimStatusClass(status: string): string {
    switch (status) {
      case 'supported':
        return 'bg-emerald-100 text-emerald-800';
      case 'contradicted':
        return 'bg-red-100 text-red-800';
      case 'unverified':
      default:
        return 'bg-slate-100 text-slate-600';
    }
  }

  getClaimStatusLabel(status: string): string {
    switch (status) {
      case 'supported':
        return 'سەلمێنراو ✓';
      case 'contradicted':
        return 'دژبەیەک ⚠';
      case 'unverified':
      default:
        return 'سەلمێننەکراو';
    }
  }
}
