import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { ResearchEngineService } from '../research-engine.service';

describe('ResearchEngineService', () => {
  let service: ResearchEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ResearchEngineService]
    });
    service = TestBed.inject(ResearchEngineService);
  });

  it('پێویستە سێرڤسەکە بە سەرکەوتوویی دروست بکرێت', () => {
    expect(service).toBeTruthy();
  });

  it('پێویستە دروستکردنی پڕۆژەی لێکۆڵینەوە نەخشەی گونجاو دابین بکات', () => {
    const project = service.createProject('ژیری دەستکرد لە پزیشکیدا', 'postgrad');
    expect(project).toBeDefined();
    expect(project.plan).toBeDefined();
    expect(project.plan.topic).toBe('ژیری دەستکرد لە پزیشکیدا');
    expect(project.plan.academicLevel).toBe('postgrad');
  });
});
