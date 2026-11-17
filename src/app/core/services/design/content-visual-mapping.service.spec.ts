import { ContentVisualMappingService } from '../content-visual-mapping.service';
import { SlidePlan } from '../../models/presentation.model';

describe('ContentVisualMappingService', () => {
  let service: ContentVisualMappingService;

  beforeEach(() => {
    service = new ContentVisualMappingService();
  });

  const mockSlidePlan: SlidePlan = {
    slideNumber: 2,
    title: 'میتۆدۆلۆژی توێژینەوە',
    purpose: 'explain',
    slideType: 'methodology',
    layoutIntent: 'process_steps',
    contentPlan: {
      supportingClaims: [],
      evidence: [],
      citations: [],
      keyTerms: ['میتۆد'],
      explanation: 'هەنگاوەکانی پرۆسەکە',
      takeaway: 'کارایی میتۆد',
      blocks: [
        { id: 'b1', text: 'قۆناغی یەکەم: کۆکردنەوەی داتا', priority: 'essential', type: 'bullet' }
      ]
    },
    evidenceMaps: [],
    citationMaps: [],
    densityStatus: 'optimal',
    speakerNotes: '',
    visualIntentHints: ['process'],
    dataVizType: 'none',
    imageRequired: false,
    traceabilityPath: 'methodology'
  };

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should map methodology process block to process_flow', () => {
    const mappings = service.generateMappings(mockSlidePlan);
    expect(mappings.length).toBeGreaterThan(0);
    expect(mappings[0].suggestedVisualForm).toBe('process_flow');
  });
});
