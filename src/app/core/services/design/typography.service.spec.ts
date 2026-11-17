import { TypographyService, TypographyEngineService } from '../typography.service';
import { PresentationRequest } from '../../models/presentation.model';

describe('TypographyService', () => {
  let service: TypographyService;

  beforeEach(() => {
    service = new TypographyService();
  });

  const mockRequest: PresentationRequest = {
    topic: 'تەکنەلۆژیا',
    academicLevel: 'bachelor',
    language: 'ckb',
    targetAudience: 'undergraduate',
    presentationPurpose: 'seminar',
    slideCount: 8,
    presentationDuration: 15
  };

  it('should generate Kurdish Vazirmatn typography spec', () => {
    const spec = service.generateTypographySpec(mockRequest, true);
    expect(spec.direction).toBe('rtl');
    expect(spec.slideTitle.fontFamily).toContain('Vazirmatn');
    expect(spec.overflowProtected).toBe(true);
  });

  it('should scale down font sizes when density requires reduction', () => {
    const spec = service.generateTypographySpec(mockRequest, true);
    const scaled = service.getScaledTypography(spec, 0.2);
    expect(scaled.slideTitle.fontSizePx).toBeLessThan(spec.slideTitle.fontSizePx);
  });

  it('should detect RTL direction for Kurdish Sorani text', () => {
    const direction = service.detectDirection('ئەمە دەقێکی کوردیی سۆرانی ستانداردە');
    expect(direction).toBe('rtl');
  });

  it('should detect LTR direction for English text', () => {
    const direction = service.detectDirection('This is a research title');
    expect(direction).toBe('ltr');
  });

  it('should evaluate text overflow correctly and calculate reduced font size', () => {
    const longText = 'دەقێکی زۆر درێژ '.repeat(50);
    const evalRes = service.evaluateTextOverflow(longText, 24, 40, 20);

    expect(evalRes.isOverflow).toBe(true);
    expect(evalRes.recommendedFontPt).toBeLessThan(24);
  });

  it('should verify TypographyEngineService alias points to TypographyService', () => {
    expect(TypographyEngineService).toBe(TypographyService);
  });
});
