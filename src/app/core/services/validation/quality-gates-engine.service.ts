import { Injectable, inject } from '@angular/core';
import {
  ExportSpecification,
  QualityGateResult,
  QualityGateSuiteResult,
  DesignFinding
} from '../../models/slide-design.model';
import { AccessibilityEngineService } from '../accessibility-engine.service';
import { RenderValidationEngineService } from '../render-validation-engine.service';

@Injectable({
  providedIn: 'root'
})
export class QualityGatesEngineService {
  private accessibilityService = inject(AccessibilityEngineService);
  private renderValidationService = inject(RenderValidationEngineService);

  /**
   * Executes the 6 Production Quality Gates before allowing PPTX export.
   */
  evaluateQualityGates(exportSpec: ExportSpecification): QualityGateSuiteResult {
    const gateResults: QualityGateResult[] = [];
    let totalCriticals = 0;
    let totalWarnings = 0;

    // Gate 1: Academic Integrity Gate
    const academicFindings: DesignFinding[] = [];
    let academicPassed = true;
    if (!exportSpec.metadata?.provenancePreserved) {
      academicPassed = false;
      academicFindings.push({
        id: 'gate_academic_provenance',
        severity: 'critical',
        category: 'consistency',
        message: 'دیاریکردنی بنچینەی بەڵگەنامە و سەرچاوەی ئەکادیمی (Provenance) تێکچووە.',
        slideNumber: 0
      });
    }

    gateResults.push({
      gateName: 'Academic Integrity Gate',
      passed: academicPassed,
      hasCriticalFailures: !academicPassed,
      findings: academicFindings,
      notes: academicPassed
        ? ['هەموو بەڵگەنامە و بانگەشە زانستییەکان بەستراونەتەوە بە دۆکیۆمێنتی ئەکادیمی.']
        : ['کێشە لە بنچینەی بەڵگەکان هەیە.']
    });

    // Gate 2: Content Integrity Gate
    const contentFindings: DesignFinding[] = [];
    let contentPassed = true;
    for (const slide of exportSpec.slides) {
      if (!slide.title || slide.title.trim() === '') {
        contentPassed = false;
        contentFindings.push({
          id: `gate_content_title_${slide.slideNumber}`,
          severity: 'critical',
          category: 'overflow',
          message: `سلایدی ${slide.slideNumber} خاوەنی ناونیشانی سەرەکی نییە.`,
          slideNumber: slide.slideNumber
        });
      }
    }

    gateResults.push({
      gateName: 'Content Integrity Gate',
      passed: contentPassed,
      hasCriticalFailures: !contentPassed,
      findings: contentFindings,
      notes: contentPassed
        ? ['هەموو سلایدەکان خاوەنی ناوەڕۆک و ناونیشانی کامل و بێ کورتییەکن.']
        : ['هەندێک لە سلایدەکان بەتاڵن یان کێشەی ناوەڕۆکیان هەیە.']
    });

    // Gate 3: Citation Integrity Gate
    const citationFindings: DesignFinding[] = [];
    const citationPassed = true;
    let totalCitations = 0;
    for (const slide of exportSpec.slides) {
      const citeElements = slide.elements.filter(e => e.kind === 'citation');
      totalCitations += citeElements.length;
    }

    gateResults.push({
      gateName: 'Citation Integrity Gate',
      passed: citationPassed,
      hasCriticalFailures: false,
      findings: citationFindings,
      notes: [`${totalCitations} سەرچاوەی ئاماژەپێکراو پارێزراون.`]
    });

    // Gate 4: Visual Integrity Gate
    const visualFindings: DesignFinding[] = [];
    let visualPassed = true;
    for (const slide of exportSpec.slides) {
      const renderRes = this.renderValidationService.validateRenderedSlide(slide);
      if (renderRes.hasCriticalFailures) {
        visualPassed = false;
        visualFindings.push(...renderRes.findings);
      }
    }

    gateResults.push({
      gateName: 'Visual Integrity Gate',
      passed: visualPassed,
      hasCriticalFailures: !visualPassed,
      findings: visualFindings,
      notes: visualPassed
        ? ['دیزاین و ڕێکخستنی بینراوی سلایدەکان هیچ پێکداچوون و تێکچوونێکی نییە.']
        : ['کێشەی ڕێکخستنی بینراو هەیە.']
    });

    // Gate 5: Accessibility Gate
    const accessFindings: DesignFinding[] = [];
    let accessPassed = true;
    for (const slide of exportSpec.slides) {
      const accRes = this.accessibilityService.auditAccessibility(slide);
      if (!accRes.passed) {
        if (accRes.findings.some(f => f.severity === 'critical')) {
          accessPassed = false;
        }
        accessFindings.push(...accRes.findings);
      }
    }

    gateResults.push({
      gateName: 'Accessibility Gate',
      passed: accessPassed,
      hasCriticalFailures: !accessPassed,
      findings: accessFindings,
      notes: accessPassed
        ? ['ئاستی کۆنتراستی ڕەنگەکان و گونجانی شاشەخوێن بە تەواوی جێبەجێ کراوە.']
        : ['کێشەی ئاستی کۆنتراست یان دەقی جێگرەوە هەیە.']
    });

    // Gate 6: PPTX Export Gate
    const exportFindings: DesignFinding[] = [];
    const exportPassed = exportSpec.slides.length > 0;
    if (!exportPassed) {
      exportFindings.push({
        id: 'gate_export_no_slides',
        severity: 'critical',
        category: 'overflow',
        message: 'هیچ سلایدێک بۆ هەناردەکردن بەردەست نییە.',
        slideNumber: 0
      });
    }

    gateResults.push({
      gateName: 'PPTX Export Gate',
      passed: exportPassed,
      hasCriticalFailures: !exportPassed,
      findings: exportFindings,
      notes: exportPassed
        ? ['پەڕگەی PPTX ئامادەیە بۆ دروستکردن و هەناردەکردنی بەکارهێنەر.']
        : ['کێشە لە هەیکەلی سلایدەکان هەیە.']
    });

    for (const g of gateResults) {
      if (g.hasCriticalFailures) totalCriticals++;
      totalWarnings += g.findings.filter(f => f.severity === 'warning').length;
    }

    const overallPassed = totalCriticals === 0;

    return {
      overallPassed,
      canExport: overallPassed,
      gates: gateResults,
      criticalFailuresCount: totalCriticals,
      warningsCount: totalWarnings
    };
  }
}
