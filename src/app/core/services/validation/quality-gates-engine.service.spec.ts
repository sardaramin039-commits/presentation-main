import { TestBed } from '@angular/core/testing';
import { QualityGatesEngineService } from '../quality-gates-engine.service';
import { ExportSpecification } from '../../models/slide-design.model';

describe('QualityGatesEngineService (BATCH 15)', () => {
  let service: QualityGatesEngineService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(QualityGatesEngineService);
  });

  it('should pass quality gates when export specification is fully valid and traceable', () => {
    const mockSpec: ExportSpecification = {
      presentationId: 'pres_123',
      title: 'توێژینەوەی ئەکادیمی',
      aspectRatio: '16:9',
      totalSlides: 1,
      isEditable: true,
      language: 'ckb',
      theme: {
        id: 'academic',
        name: 'Academic',
        variant: 'academic',
        primaryColor: { name: 'Dark', hex: '#1E293B', usage: 'primary' },
        secondaryColor: { name: 'Indigo', hex: '#4F46E5', usage: 'secondary' },
        accentColor: { name: 'Red', hex: '#991B1B', usage: 'accent' },
        backgroundColor: { name: 'White', hex: '#FFFFFF', usage: 'background' },
        surfaceColor: { name: 'Surface', hex: '#F8FAFC', usage: 'surface' },
        textColor: { name: 'Black', hex: '#0F172A', usage: 'text' },
        mutedTextColor: { name: 'Gray', hex: '#64748B', usage: 'mutedText' },
        borderColor: { name: 'Border', hex: '#E2E8F0', usage: 'border' },
        fontFamilyTitle: 'Vazirmatn',
        fontFamilyBody: 'Vazirmatn'
      },
      metadata: {
        createdAt: new Date().toISOString(),
        academicLevel: 'postgrad',
        author: 'مامۆستای زانکۆ',
        provenancePreserved: true
      },
      slides: [
        {
          slideNumber: 1,
          title: 'ناساندنی توێژینەوەکە',
          layout: { layoutCategory: 'title', name: 'TITLE', explanation: '', columnCount: 1, rtl: true, zones: [] },
          elements: [
            {
              kind: 'text',
              data: {
                id: 'txt_1',
                type: 'title',
                text: 'ناساندنی توێژینەوەکە',
                direction: 'rtl',
                fontPt: 28,
                fontWeight: 'bold',
                colorHex: '#0F172A',
                align: 'right',
                bounds: { xPct: 5, yPct: 5, wPct: 90, hPct: 15 }
              }
            }
          ],
          speakerNotes: { slideNumber: 1, notes: 'تێبینی' },
          animations: [],
          transition: { type: 'fade', durationMs: 300, isSupportedInExport: true },
          theme: {} as unknown as ExportSpecification['theme'],
          typography: {} as unknown as ExportSpecification['slides'][0]['typography'],
          spacing: {} as unknown as ExportSpecification['slides'][0]['spacing'],
          densityScore: 50,
          densityStatus: 'optimal',
          validation: { slideNumber: 1, passed: true, hasCriticalFailures: false, hasWarnings: false, findings: [], repairedFindings: [] }
        }
      ]
    };

    const result = service.evaluateQualityGates(mockSpec);
    expect(result.overallPassed).toBeTrue();
    expect(result.canExport).toBeTrue();
    expect(result.gates.length).toBe(6);
  });

  it('should block export when provenance is compromised in Academic Integrity Gate', () => {
    const mockSpec: ExportSpecification = {
      presentationId: 'pres_456',
      title: 'تست',
      aspectRatio: '16:9',
      totalSlides: 1,
      isEditable: true,
      language: 'ckb',
      theme: {} as unknown as ExportSpecification['theme'],
      metadata: {
        createdAt: new Date().toISOString(),
        academicLevel: 'bachelor',
        author: 'Unverified',
        provenancePreserved: false // COMPROMISED PROVENANCE
      },
      slides: []
    };

    const result = service.evaluateQualityGates(mockSpec);
    expect(result.overallPassed).toBeFalse();
    expect(result.canExport).toBeFalse();
    expect(result.criticalFailuresCount).toBeGreaterThan(0);
  });
});
