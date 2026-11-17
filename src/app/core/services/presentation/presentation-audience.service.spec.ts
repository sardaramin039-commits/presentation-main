import { TestBed } from '@angular/core/testing';
import { PresentationAudienceService } from '../presentation-audience.service';

describe('PresentationAudienceService', () => {
  let service: PresentationAudienceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PresentationAudienceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate audience profile for school level', () => {
    const profile = service.getAudienceProfile('school', '🎒 قوتابخانە');
    expect(profile.audience).toBe('school');
    expect(profile.terminologyStyle).toBe('simplified');
    expect(profile.citationDensity).toBe('minimal');
  });

  it('should generate audience profile for postgraduate / doctoral level', () => {
    const profile = service.getAudienceProfile('doctoral', '🧠 ماستەر و دکتۆرا');
    expect(profile.terminologyStyle).toBe('specialized_academic');
    expect(profile.citationDensity).toBe('heavy_academic');
    expect(profile.explanationDepth).toBe('exhaustive');
  });

  it('should generate directives for thesis defense', () => {
    const profile = service.getAudienceProfile('thesis_defense', '🧠 ماستەر و دکتۆرا');
    const directives = service.getPurposeDirectives('thesis_defense', profile);
    expect(directives.narrativeEmphasis.length).toBeGreaterThan(0);
    expect(directives.evidenceRequirement).toBeDefined();
  });
});

