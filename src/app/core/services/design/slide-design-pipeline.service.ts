import { Injectable, inject } from '@angular/core';
import { PresentationPlan } from '../../models/presentation.model';
import {
  ExportSpecification,
  SlideDesignSpec,
  ThemeSpec,
  QualityGateSuiteResult
} from '../../models/slide-design.model';
import { ResponsiveSlideComposerService } from '../responsive-slide-composer.service';
import { AutoRepairEngineService } from '../auto-repair-engine.service';
import { QualityGatesEngineService } from '../quality-gates-engine.service';
import { DesignConsistencyEngineService } from '../design-consistency-engine.service';
import { PptxExportFidelityService, ExportFidelityReport } from '../pptx-export-fidelity.service';

@Injectable({
  providedIn: 'root'
})
export class SlideDesignPipelineService {
  private composerService = inject(ResponsiveSlideComposerService);
  private autoRepairService = inject(AutoRepairEngineService);
  private qualityGatesService = inject(QualityGatesEngineService);
  private consistencyService = inject(DesignConsistencyEngineService);
  private exportFidelityService = inject(PptxExportFidelityService);

  /**
   * Main Pipeline Orchestration for BATCH 15.
   * Converts PresentationPlan -> ExportSpecification -> Quality Gates -> PPTX Export.
   */
  async processAndExportPresentation(
    plan: PresentationPlan,
    themeVariant: 'academic' | 'corporate' | 'creative' | 'light' | 'dark' = 'academic'
  ): Promise<{
    exportSpec: ExportSpecification;
    qualityGates: QualityGateSuiteResult;
    exportReport?: ExportFidelityReport;
  }> {
    const theme: ThemeSpec = this.getThemeSpec(themeVariant);

    // 1. Compose Slide Design Specs
    let rawSlideSpecs: SlideDesignSpec[] = plan.slides.map(slide =>
      this.composerService.composeSlide(slide, theme)
    );

    // 2. Normalize Consistency Across Presentation
    const consistencyRes = this.consistencyService.normalizePresentationDesign(rawSlideSpecs, theme);
    rawSlideSpecs = consistencyRes.slides;

    // 3. Run Auto-Repair for layout issues
    const repairedSlideSpecs: SlideDesignSpec[] = rawSlideSpecs.map(slide => {
      const repairRes = this.autoRepairService.repairSlideDesign(slide);
      return repairRes.repairedSpec;
    });

    // 4. Build Export Specification
    const exportSpec: ExportSpecification = {
      presentationId: plan.id || `pres_${Date.now()}`,
      title: plan.title || 'پێشکەشکردنی ئەکادیمی',
      aspectRatio: '16:9',
      slides: repairedSlideSpecs,
      theme,
      totalSlides: repairedSlideSpecs.length,
      isEditable: true,
      language: plan.request.language || 'ckb',
      metadata: {
        createdAt: new Date().toISOString(),
        academicLevel: plan.request.academicLevel,
        author: plan.request.institutionalContext?.presenterName || 'تیمی زانستی پرێزێنتەیشن',
        provenancePreserved: true
      }
    };

    // 5. Evaluate Quality Gates
    const qualityGates = this.qualityGatesService.evaluateQualityGates(exportSpec);

    // 6. Export to PPTX if quality gates passed
    let exportReport: ExportFidelityReport | undefined;
    if (qualityGates.canExport) {
      exportReport = await this.exportFidelityService.exportToPPTX(exportSpec);
    }

    return {
      exportSpec,
      qualityGates,
      exportReport
    };
  }

  private getThemeSpec(variant: string): ThemeSpec {
    return {
      id: `theme_${variant}`,
      name: variant.toUpperCase(),
      variant: variant as ThemeSpec['variant'],
      primaryColor: { name: 'Slate Dark', hex: '#1E293B', usage: 'primary' },
      secondaryColor: { name: 'Indigo', hex: '#4F46E5', usage: 'secondary' },
      accentColor: { name: 'Burgundy', hex: '#991B1B', usage: 'accent' },
      backgroundColor: { name: 'Cream Light', hex: '#FFFDF9', usage: 'background' },
      surfaceColor: { name: 'White', hex: '#FFFFFF', usage: 'surface' },
      textColor: { name: 'Dark Slate', hex: '#0F172A', usage: 'text' },
      mutedTextColor: { name: 'Muted Slate', hex: '#64748B', usage: 'mutedText' },
      borderColor: { name: 'Border Light', hex: '#E2E8F0', usage: 'border' },
      fontFamilyTitle: 'Vazirmatn',
      fontFamilyBody: 'Vazirmatn'
    };
  }
}
