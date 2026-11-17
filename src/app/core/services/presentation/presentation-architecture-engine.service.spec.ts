import { TestBed } from '@angular/core/testing';
import { PresentationArchitectureEngineService } from '../presentation-architecture-engine.service';
import { PresentationRequest } from '../../models/presentation.model';

describe('PresentationArchitectureEngineService', () => {
  let service: PresentationArchitectureEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresentationArchitectureEngineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should orchestrate full presentation plan generation', () => {
    const request: PresentationRequest = {
      topic: 'زیرەکیی دەستکرد لە پزیشکیدا',
      academicLevel: '🧠 ماستەر و دکتۆرا',
      targetAudience: 'doctoral',
      presentationPurpose: 'thesis_defense',
      slideCount: 8,
      presentationDuration: 20
    };

    const plan = service.buildPresentationPlan(request, {
      claims: [
        { id: 'c1', statement: 'زیرەکی دەستکرد دۆزینەوەی نەخۆشی خێراتر دەکات', status: 'supported' }
      ],
      evidenceList: [
        { id: 'e1', claimId: 'c1', sourceId: 's1', extractedSnippet: 'توێژینەوەی پزیشکی 2024' }
      ]
    });

    expect(plan).toBeTruthy();
    expect(plan.slides.length).toBe(8);
    expect(plan.integrityGate).toBeTruthy();
    expect(plan.integrityGate.isPassed).toBeTrue();
  });
});
