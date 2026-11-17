import { Component, ChangeDetectionStrategy, inject, input, output, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PresentationService } from '../../core/services/presentation/presentation.service';
import { ProjectWorkspaceService } from '../../core/services/workspace/project-workspace.service';
import { ExportService } from '../../core/services/workspace/export.service';
import { AuthService } from '../../core/services/workspace/auth.service';

@Component({
  selector: 'app-header-toolbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './header-toolbar.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeaderToolbarComponent {
  readonly presentationService = inject(PresentationService);
  readonly workspaceService = inject(ProjectWorkspaceService);
  readonly exportService = inject(ExportService);
  readonly authService = inject(AuthService);
  authError = '';

  // Both activeTab and activeRightTab inputs for flexibility
  readonly activeTab = input<'design' | 'research' | 'review' | null>(null);
  readonly activeRightTab = input<'design' | 'research' | 'review' | null>(null);
  readonly currentDir = input<'rtl' | 'ltr'>('rtl');

  readonly currentTab = computed(() => {
    return this.activeTab() ?? this.activeRightTab() ?? 'design';
  });

  readonly toggleDirection = output<void>();
  readonly tabToggle = output<'design' | 'research' | 'review'>();
  readonly openModal = output<string>();
  readonly openOutline = output<void>();
  readonly openTeleprompter = output<void>();
  readonly triggerExportPPTX = output<void>();
  readonly navigateToDashboard = output<void>();

  async signIn(): Promise<void> {
    this.authError = '';
    try {
      await this.authService.signInWithGoogle();
    } catch (error: unknown) {
      const code = typeof error === 'object' && error !== null && 'code' in error
        ? String((error as { code?: unknown }).code)
        : '';
      this.authError = code === 'auth/popup-closed-by-user'
        ? 'پەنجەرەی چوونەژوورەوە داخرا.'
        : 'چوونەژوورەوە سەرکەوتوو نەبوو. تکایە دووبارە هەوڵ بدەرەوە.';
    }
  }

  async signOut(): Promise<void> {
    this.authError = '';
    await this.authService.signOutUser();
  }

  triggerOpenModal(type: string): void {
    if (type === 'outline') this.openOutline.emit();
    if (type === 'teleprompter') this.openTeleprompter.emit();
    this.openModal.emit(type);
  }

  async onExportPPTX(): Promise<void> {
    this.triggerExportPPTX.emit();
    const pres = this.presentationService.currentPresentation();
    if (pres) {
      try {
        const summary = this.presentationService.getAssociatedSummary(pres.id);
        await this.exportService.exportToPptx(pres, this.presentationService.exportTheme(), summary);
      } catch (e) {
        console.error('HeaderToolbar PPTX export failed:', e);
      }
    }
  }
}
