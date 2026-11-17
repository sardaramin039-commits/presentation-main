import { TestBed } from '@angular/core/testing';
import { ReferenceListService } from '../reference-list.service';
import { CitationGeneratorService } from '../citation-generator.service';
import { CitationValidationService } from '../citation-validation.service';
import { Source, Citation } from '../../models/research.model';

describe('ReferenceListService', () => {
  let service: ReferenceListService;
  let generator: CitationGeneratorService;

  beforeEach(() => {
    TestBed.runInInjectionContext(() => {
      const validator = new CitationValidationService();
      generator = new CitationGeneratorService(validator);
      service = new ReferenceListService(generator);
    });
  });

  const sourceA: Source = {
    id: 'src_a',
    addedAt: new Date().toISOString(),
    metadata: {
      title: 'Zebra Behavior in Savanna',
      authors: ['Zack Zebra'],
      publicationYear: 2021,
      sourceType: 'journal_article',
      verificationStatus: 'verified'
    },
    provenance: {
      sourceProvider: 'Crossref',
      retrievalTimestamp: new Date().toISOString(),
      transformationHistory: []
    }
  };

  const sourceB: Source = {
    id: 'src_b',
    addedAt: new Date().toISOString(),
    metadata: {
      title: 'Ant Intelligence',
      authors: ['Alice Ant'],
      publicationYear: 2020,
      sourceType: 'journal_article',
      verificationStatus: 'verified'
    },
    provenance: {
      sourceProvider: 'OpenAlex',
      retrievalTimestamp: new Date().toISOString(),
      transformationHistory: []
    }
  };

  it('should deduplicate multiple citations for the same source and sort alphabetically for APA7', () => {
    const cit1 = generator.generateCitation({ source: sourceA, style: 'APA7' });
    const cit2 = generator.generateCitation({ source: sourceA, style: 'APA7' });
    const cit3 = generator.generateCitation({ source: sourceB, style: 'APA7' });

    const citations: Citation[] = [cit1, cit2, cit3];
    const sources: Source[] = [sourceA, sourceB];

    const refList = service.buildReferenceList(citations, sources, 'APA7');

    expect(refList.length).toBe(2);
    // Alice Ant (sourceB) should come before Zack Zebra (sourceA)
    expect(refList[0].sourceId).toBe('src_b');
    expect(refList[1].sourceId).toBe('src_a');
    expect(refList[1].citationIds?.length).toBe(2); // cit1 and cit2 grouped
  });

  it('should exclude rejected sources from final reference list', () => {
    const rejectedSource: Source = {
      ...sourceA,
      id: 'src_rej',
      metadata: { ...sourceA.metadata, verificationStatus: 'rejected' }
    };

    const citRej = generator.generateCitation({ source: rejectedSource, style: 'APA7' });
    const refList = service.buildReferenceList([citRej], [rejectedSource], 'APA7');

    expect(refList.length).toBe(0);
  });
});
