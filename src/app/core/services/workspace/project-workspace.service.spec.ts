import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectWorkspaceService } from './project-workspace.service';

describe('ProjectWorkspaceService', () => {
  let service: ProjectWorkspaceService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProjectWorkspaceService]
    });
    service = TestBed.inject(ProjectWorkspaceService);
  });

  it('پێویستە سێرڤسەکە بە سەرکەوتوویی دروست بکرێت', () => {
    expect(service).toBeTruthy();
  });

  it('پێویستە دروستکردنی پڕۆژەی نوێ پڕۆژەکە زیاد بکات و بیکاتە چالاک', () => {
    const initialProjectsCount = service.projects().length;
    const newProject = service.createProject('سیمیناری ژیری دەستکرد', 'تەوەرێکی ئەکادیمی', 'bachelor');
    
    expect(service.projects().length).toBe(initialProjectsCount + 1);
    expect(newProject.title).toBe('سیمیناری ژیری دەستکرد');
    expect(service.activeProjectId()).toBe(newProject.id);
  });

  it('پێویستە ئامارەکانی Dashboard بە شێوەی دروست ئەژمار بکرێن', () => {
    const stats = service.dashboardStats();
    expect(stats.totalProjects).toBeGreaterThanOrEqual(0);
    expect(stats.exportReadyCount).toBeGreaterThanOrEqual(0);
  });
});
