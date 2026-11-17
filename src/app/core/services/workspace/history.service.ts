import { Injectable } from '@angular/core';
import { Presentation } from '../../models/presentation.model';
import { STORAGE_KEYS } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  
  private getStorageKey(userId?: string | null): string {
    return userId ? `${STORAGE_KEYS.HISTORY}_${userId}` : `${STORAGE_KEYS.HISTORY}_guest`;
  }

  loadHistory(userId?: string | null): Presentation[] {
    if (typeof window === 'undefined') return [];
    try {
      const key = this.getStorageKey(userId);
      const stored = localStorage.getItem(key);
      if (stored) {
        return JSON.parse(stored) as Presentation[];
      }
    } catch (e) {
      console.error('Failed to parse history from localStorage', e);
    }
    return [];
  }

  saveToHistory(history: Presentation[], pres: Presentation, userId?: string | null): Presentation[] {
    const updatedHistory = [pres, ...history.filter(h => h.id !== pres.id)].slice(0, 10);
    this.persistHistory(updatedHistory, userId);
    return updatedHistory;
  }

  updateInHistory(history: Presentation[], updatedPres: Presentation, userId?: string | null): Presentation[] {
    const idx = history.findIndex(h => h.id === updatedPres.id);
    let updatedHistory: Presentation[];
    if (idx !== -1) {
      updatedHistory = [...history];
      updatedHistory[idx] = JSON.parse(JSON.stringify(updatedPres)) as Presentation;
    } else {
      updatedHistory = [updatedPres, ...history];
    }
    this.persistHistory(updatedHistory, userId);
    return updatedHistory;
  }

  deleteFromHistory(history: Presentation[], id: string, userId?: string | null): Presentation[] {
    const updatedHistory = history.filter(h => h.id !== id);
    this.persistHistory(updatedHistory, userId);
    return updatedHistory;
  }

  private persistHistory(history: Presentation[], userId?: string | null) {
    if (typeof window === 'undefined') return;
    try {
      const key = this.getStorageKey(userId);
      localStorage.setItem(key, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to persist history to localStorage', e);
    }
  }
}
