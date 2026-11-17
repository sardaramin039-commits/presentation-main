import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CrossrefProviderService } from './crossref-provider.service';
import { MetadataNormalizationService } from '../services/metadata-normalization.service';
import { IdentifierVerificationService } from '../services/identifier-verification.service';
import { CrossrefResponse } from './crossref.dto';

describe('CrossrefProviderService', () => {
  let service: CrossrefProviderService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CrossrefProviderService,
        MetadataNormalizationService,
        IdentifierVerificationService
      ]
    });
    service = TestBed.inject(CrossrefProviderService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should search Crossref and map response DTO to internal Source model', async () => {
    const query = 'Machine Learning';
    const mockResponse: CrossrefResponse = {
      status: 'ok',
      'message-type': 'work-list',
      'message-version': '1.0.0',
      message: {
        'total-results': 1,
        items: [
          {
            DOI: '10.1000/182',
            title: ['Deep Learning Applications'],
            author: [{ given: 'Yann', family: 'LeCun' }],
            issued: { 'date-parts': [[2015, 5, 28]] },
            publisher: 'Nature Publishing Group',
            'container-title': ['Nature'],
            type: 'journal-article',
            URL: 'https://doi.org/10.1000/182'
          }
        ]
      }
    };

    const promise = service.search(query, { limit: 5 });

    const req = httpMock.expectOne(request => request.url === 'https://api.crossref.org/works');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('query')).toBe('Machine Learning');
    req.flush(mockResponse);

    const sources = await promise;
    expect(sources.length).toBe(1);
    expect(sources[0].metadata.title).toBe('Deep Learning Applications');
    expect(sources[0].metadata.doi).toBe('10.1000/182');
    expect(sources[0].metadata.authors).toEqual(['Yann LeCun']);
    expect(sources[0].metadata.publicationYear).toBe(2015);
    expect(sources[0].provenance.sourceProvider).toBe('Crossref');
  });

  it('should handle search error gracefully and return empty array', async () => {
    const promise = service.search('Error Query');

    const req = httpMock.expectOne(request => request.url === 'https://api.crossref.org/works');
    req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

    const sources = await promise;
    expect(sources).toEqual([]);
  });
});
