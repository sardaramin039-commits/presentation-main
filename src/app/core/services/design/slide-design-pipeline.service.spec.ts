import { TestBed } from '@angular/core/testing';
import { SlideDesignPipelineService } from '../slide-design-pipeline.service';
import { PresentationPlan } from '../../models/presentation.model';

describe('SlideDesignPipelineService (BATCH 15 Integration)', () => {
  let service: SlideDesignPipelineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SlideDesignPipelineService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should orchestrate full BATCH 1 -> BATCH 15 presentation pipeline smoothly', async () => {
    const mockPlan: PresentationPlan = {
      id: 'plan_test_15',
      title: 'کاریگەری ژیریی دەستکرد لەسەر زانستی پزیشکی',
      createdAt: new Date().toISOString(),
      request: {
        topic: 'ژیریی دەستکرد لە پزیشکیدا',
        academicLevel: 'postgrad',
        targetAudience: 'doctoral',
        presentationPurpose: 'research_presentation',
        slideCount: 2,
        presentationDuration: 20,
        language: 'ckb'
      },
      context: {
        request: {} as unknown as PresentationPlan['context']['request'],
        audienceProfile: {} as unknown as PresentationPlan['context']['audienceProfile']
      },
      narrative: {} as unknown as PresentationPlan['narrative'],
      slides: [
        {
          slideNumber: 1,
          title: 'دەروازەیەک بۆ ژیریی دەستکرد لە پزیشکیدا',
          purpose: 'introduce',
          slideType: 'title',
          layoutIntent: 'title_hero',
          densityStatus: 'optimal',
          speakerNotes: 'بەخێرهاتنی بەشداربووان',
          visualIntentHints: [],
          dataVizType: 'none',
          imageRequired: false,
          traceabilityPath: 'claim_1',
          contentPlan: {
            blocks: [
              { id: 'b1', text: 'ژیریی دەستکرد شۆڕشێکی نوێیە لە دەستنیشانکردنی نەخۆشییەکان', priority: 'essential', type: 'heading' }
            ]
          } as unknown as PresentationPlan['slides'][0]['contentPlan'],
          evidenceMaps: [],
          citationMaps: []
        },
        {
          slideNumber: 2,
          title: 'ئاماری پێشکەوتنی دەستنیشانکردن',
          purpose: 'presentFinding',
          slideType: 'finding',
          layoutIntent: 'data_viz',
          densityStatus: 'optimal',
          speakerNotes: 'ڕوونکردنەوەی چارتی داتا',
          visualIntentHints: ['quantitative_data'],
          dataVizType: 'bar_chart',
          imageRequired: false,
          traceabilityPath: 'claim_2',
          contentPlan: {
            blocks: [
              { id: 'b2', text: 'زیادبوونی وردیی دەستنیشانکردن بۆ 94%', priority: 'essential', type: 'statistic' }
            ]
          } as unknown as PresentationPlan['slides'][0]['contentPlan'],
          evidenceMaps: [
            {
              slideNumber: 2,
              claimId: 'c2',
              claimStatement: 'پێشکەوتنی دەستنیشانکردن بۆ 94%',
              verificationStatus: 'verified',
              sourceTitle: 'گۆڤاری پزیشکی 2025'
            }
          ],
          citationMaps: [
            {
              slideNumber: 2,
              citationId: 'cite_2',
              style: 'APA',
              inText: '(ئەحمەد و ئەوانی تر، 2025)',
              referenceId: 'ref_2',
              fullReference: 'ئەحمەد، ک. (2025). ژیریی دەستکرد لە پزیشکیدا. گۆڤاری زانستی.',
              sourceId: 'src_2'
            }
          ]
        }
      ],
      validation: { isValid: true } as unknown as PresentationPlan['validation'],
      integrityGate: { isPassed: true } as unknown as PresentationPlan['integrityGate']
    };

    const res = await service.processAndExportPresentation(mockPlan, 'academic');

    expect(res.exportSpec).toBeDefined();
    expect(res.exportSpec.slides.length).toBe(2);
    expect(res.qualityGates).toBeDefined();
    expect(res.qualityGates.overallPassed).toBeTrue();
    expect(res.exportReport).toBeDefined();
    expect(res.exportReport?.success).toBeTrue();
    expect(res.exportReport?.preservedCitationsCount).toBeGreaterThan(0);
  });
});
