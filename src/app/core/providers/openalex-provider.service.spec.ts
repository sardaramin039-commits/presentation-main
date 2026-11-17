import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { OpenAlexProviderService } from './openalex-provider.service';
import { MetadataNormalizationService } from '../services/metadata-normalization.service';
import { IdentifierVerificationService } from '../services/identifier-verification.service';
import { OpenAlexResponse } from './openalex.dto';

describe('OpenAlexProviderService', () => {
  let service: OpenAlexProviderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        OpenAlexProviderService,
        MetadataNormalizationService,
        IdentifierVerificationService
      ]
    });
    service = TestBed.inject(OpenAlexProviderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should decode inverted index abstract correctly', () => {
    const invertedIndex = {
      'This': [0],
      'is': [1],
      'a': [2],
      'test': [3],
      'abstract.': [4]
    };

    const decoded = service.decodeAbstractInvertedIndex(invertedIndex);
    expect(decoded).toBe('This is a test abstract.');
  });

  it('should search OpenAlex and map response DTO to internal Source model', async () => {
    const mockResponse: OpenAlexResponse = {
      meta: { count: 1, page: 1, per_page: 10 },
      results: [
        {
          id: 'https://openalex.org/W2741809807',
          doi: 'https://doi.org/10.1038/s41586-020-2003-7',
          title: 'Quantum Advantage with Photons',
          publication_year: 2020,
          authorships: [
            { author: { display_name: 'Jian-Wei Pan' } }
          ],
          primary_location: {
            landing_page_url: 'https://nature.com/articles/s41586-020-2003-7',
            source: { display_name: 'Nature', publisher: 'Springer Nature' }
          },
          type: 'article',
          abstract_inverted_index: {
            'Quantum': [0],
            'computational': [1],
            'advantage': [2]
          }
        }
      ]
    };

    const promise = service.search('Quantum', { limit: 5 });

    const req = httpMock.expectOne(request => request.url === 'https://api.openalex.org/works');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);

    const sources = await promise;
    expect(sources.length).toBe(1);
    expect(sources[0].metadata.title).toBe('Quantum Advantage with Photons');
    expect(sources[0].metadata.doi).toBe('10.1038/s41586-020-2003-7');
    expect(sources[0].metadata.abstract).toBe('Quantum computational advantage');
    expect(sources[0].provenance.sourceProvider).toBe('OpenAlex');
  });
});
