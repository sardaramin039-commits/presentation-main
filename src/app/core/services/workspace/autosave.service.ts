import { Injectable, OnDestroy } from '@angular/core';
import { AutosaveState, ExportTheme, Presentation, SlideTheme, TransitionStyle } from '../../models/presentation.model';
import { STORAGE_KEYS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class AutosaveService implements OnDestroy {
  private autoSaveInterval: ReturnType<typeof setInterval> | null = null;

  startAutoSave(callback: () => void, intervalMs = 10000) {
    this.stopAutoSave();
    this.autoSaveInterval = setInterval(() => {
      callback();
    }, intervalMs);
  }

  stopAutoSave() {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = null;
    }
  }

  private getStorageKey(userId?: string | null): string {
    return userId ? `${STORAGE_KEYS.AUTOSAVE}_${userId}` : `${STORAGE_KEYS.AUTOSAVE}_guest`;
  }

  saveDraft(
    presentation: Presentation,
    slideTheme: SlideTheme,
    exportTheme: ExportTheme,
    transitionStyle: TransitionStyle,
    userId?: string | null
  ): string {
    if (typeof window === 'undefined') return '';
    try {
      const state: AutosaveState = {
        presentation,
        slideTheme,
        exportTheme,
        transitionStyle
      };
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(state));
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    } catch (e) {
      console.error('Failed to autosave draft:', e);
      return '';
    }
  }

  loadDraft(userId?: string | null): AutosaveState | null {
    if (typeof window === 'undefined') return null;
    try {
      const key = this.getStorageKey(userId);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as AutosaveState;
      }
    } catch (e) {
      console.error('Failed to parse autosave data:', e);
    }
    return null;
  }

  ngOnDestroy() {
    this.stopAutoSave();
  }
}
