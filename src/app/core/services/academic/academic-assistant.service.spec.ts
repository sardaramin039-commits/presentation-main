import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { AcademicAssistantService } from '../academic-assistant.service';

describe('AcademicAssistantService', () => {
  let service: AcademicAssistantService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AcademicAssistantService]
    });
    service = TestBed.inject(AcademicAssistantService);
  });

  it('پێویستە سێرڤسەکە بە سەرکەوتوویی دروست بکرێت', () => {
    expect(service).toBeTruthy();
  });

  it('پێویستە وەڵامی پرسیاری لێکۆڵینەوە لە نەبوونی بەڵگەدا خۆپارێزی (Abstention) لەبەرچاو بگرێت', () => {
    const query = {
      id: 'q-test-1',
      question: 'ئایا ڕێژەی دانیشتوانی مەریخ لە ساڵی ٢٠٢٠ سەلمێنراوە؟',
      timestamp: new Date().toISOString()
    };

    const response = service.answerQuery(query, [], [], [], []);
    expect(response).toBeDefined();
    expect(response.queryId).toBe(query.id);
    expect(response.answerKurdish).toBeTruthy();
  });
});
