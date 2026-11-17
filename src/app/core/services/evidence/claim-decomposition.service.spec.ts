import { ClaimDecompositionService } from '../claim-decomposition.service';
import { Claim } from '../../models/research.model';

describe('ClaimDecompositionService', () => {
  let service: ClaimDecompositionService;

  beforeEach(() => {
    service = new ClaimDecompositionService();
  });

  it('should decompose compound claims into atomic assertions', () => {
    const claim: Claim = {
      id: 'c1',
      statement: 'X was founded in 1990 and expanded rapidly in 2000',
      status: 'unverified'
    };

    const assertions = service.decomposeClaim(claim);
    expect(assertions.length).toBe(2);
    expect(assertions[0].statement).toContain('founded in 1990');
    expect(assertions[0].yearValue).toBe(1990);
    expect(assertions[1].statement).toContain('expanded rapidly in 2000');
    expect(assertions[1].yearValue).toBe(2000);
  });

  it('should extract numerical values and units accurately', () => {
    const claim: Claim = {
      id: 'c2',
      statement: 'Growth reached 25% in the region',
      status: 'unverified'
    };

    const assertions = service.decomposeClaim(claim);
    expect(assertions.length).toBe(1);
    expect(assertions[0].numericValue).toBe(25);
    expect(assertions[0].unit).toBe('%');
  });

  it('should handle Sorani Kurdish compound conjunctions', () => {
    const claim: Claim = {
      id: 'c3',
      statement: 'زانکۆیەکە لە ساڵی 1995 دامەزرا وە لە ساڵی 2005 گەشەی کرد',
      status: 'unverified'
    };

    const assertions = service.decomposeClaim(claim);
    expect(assertions.length).toBe(2);
    expect(assertions[0].yearValue).toBe(1995);
    expect(assertions[1].yearValue).toBe(2005);
  });
});
