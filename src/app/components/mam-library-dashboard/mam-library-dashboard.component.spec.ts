import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { MamLibraryDashboardComponent } from './mam-library-dashboard.component';
import { AcademicLevel } from '../../core/models/presentation.model';

describe('MamLibraryDashboardComponent', () => {
  let component: MamLibraryDashboardComponent;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      component = new MamLibraryDashboardComponent();
    });
  });

  it('should be defined with initial state', () => {
    expect(component).toBeDefined();
    expect(component.activeTab()).toBe('home');
    expect(component.navItems.length).toBe(4);
    expect(component.articles.length).toBeGreaterThan(0);
  });

  it('should filter articles by search query correctly', () => {
    component.searchQuery.set('پزیشکی');
    const filtered = component.filteredArticles();
    expect(filtered.length).toBe(1);
    expect(filtered[0].title).toContain('پزیشکی');
  });

  it('should filter articles by academic level', () => {
    component.selectedLevel.set('postgrad');
    const filtered = component.filteredArticles();
    expect(filtered.every(a => a.academicLevel === 'postgrad')).toBe(true);
  });

  it('should format citations for APA7 and IEEE correctly', () => {
    component.citationStyle.set('APA7');
    expect(component.formattedCitation()).toContain('گۆڤاری ئەکادیمیای کوردی');
    
    component.citationStyle.set('IEEE');
    expect(component.formattedCitation()).toContain('[1]');
  });

  it('should step through Canva slides accurately', () => {
    expect(component.currentCanvaSlideIndex()).toBe(0);
    component.nextCanvaSlide();
    expect(component.currentCanvaSlideIndex()).toBe(1);
    component.prevCanvaSlide();
    expect(component.currentCanvaSlideIndex()).toBe(0);
  });

  it('should emit openEditor with article topic and level', () => {
    let emitted: { topic?: string; level?: AcademicLevel } | null = null;
    component.openEditor.subscribe(val => {
      emitted = val;
    });

    const article = component.articles[0];
    component.createPresentationFromArticle(article);
    expect(emitted).toBeDefined();
    expect(emitted.topic).toBe(article.suggestedSlideTopic);
    expect(emitted.level).toBe(article.academicLevel);
  });
});
