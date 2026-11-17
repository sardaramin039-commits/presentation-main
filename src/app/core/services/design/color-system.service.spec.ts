import { ColorSystemService } from '../color-system.service';

describe('ColorSystemService', () => {
  let service: ColorSystemService;

  beforeEach(() => {
    service = new ColorSystemService();
  });

  it('should generate emerald theme palette with high contrast and academic appropriateness', () => {
    const palette = service.getPaletteForTheme('emerald');
    expect(palette.theme).toBe('emerald');
    expect(palette.primary).toBeDefined();
    expect(palette.contrastRatioScore).toBeGreaterThanOrEqual(90);
  });

  it('should generate charcoal theme palette', () => {
    const palette = service.getPaletteForTheme('charcoal');
    expect(palette.theme).toBe('charcoal');
    expect(palette.text).toBe('#020617');
  });
});
