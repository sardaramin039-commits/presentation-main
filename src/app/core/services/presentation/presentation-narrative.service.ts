import { Injectable } from '@angular/core';
import {
  PresentationNarrative,
  PresentationRequest,
  PresentationContext,
  PresentationSection,
  PresentationPurpose
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class PresentationNarrativeService {
  /**
   * Generates a structural narrative architecture customized for document context, purpose, and target slide count.
   */
  generateNarrative(
    request: PresentationRequest,
    context: PresentationContext
  ): PresentationNarrative {
    const totalSlides = Math.max(3, request.slideCount || 10);
    const purpose = request.presentationPurpose || 'research_presentation';
    const title = context.academicDocument?.title || request.topic || 'تەوەرەی پێشکەشکردن';

    const sectionsDefinition = this.buildSectionList(purpose, totalSlides);
    const sections = this.allocateSlideIndices(sectionsDefinition, totalSlides);

    const coreThesis = this.extractCoreThesis(context, request.topic);
    const keyTakeaways = this.extractKeyTakeaways(context);

    return {
      id: `narrative_${Date.now()}`,
      title,
      audience: request.targetAudience,
      purpose,
      coreThesis,
      keyTakeaways,
      sections,
      totalTargetSlides: totalSlides
    };
  }

  /**
   * Assesses slide count appropriateness for duration and content complexity.
   */
  evaluateSlideCountIntelligence(
    request: PresentationRequest,
    totalClaims: number,
    totalEvidence: number
  ): {
    isOptimal: boolean;
    recommendedMinSlides: number;
    recommendedMaxSlides: number;
    warnings: string[];
    pacingNotes: string;
  } {
    const slides = Math.max(1, request.slideCount || 10);
    const durationMin = request.presentationDuration || 15;
    const warnings: string[] = [];

    // Rule of thumb: 1.5 - 2 minutes per slide for academic presentation
    const minTimeSlides = Math.max(3, Math.floor(durationMin / 2.5));
    const maxTimeSlides = Math.ceil(durationMin / 1.0);

    // Rule of thumb for content: ~1-2 claims per slide
    const contentMinSlides = Math.max(3, Math.ceil((totalClaims + totalEvidence) / 3));

    const recommendedMinSlides = Math.max(3, Math.min(minTimeSlides, contentMinSlides));
    const recommendedMaxSlides = Math.max(recommendedMinSlides + 2, maxTimeSlides);

    if (slides < recommendedMinSlides) {
      warnings.push(
        `ژمارەی سڵایدەکان (${slides}) کەمترە لە پێشنیارکراو (${recommendedMinSlides}). ئەگەری چڕیی لەڕادەبەدەری ناوەڕۆک هەیە.`
      );
    } else if (slides > recommendedMaxSlides) {
      warnings.push(
        `ژمارەی سڵایدەکان (${slides}) زیاترە لە کاتی دیاریکراو (${durationMin} خولەک). پێویستە ڕیتمی پێشکەشکردن خێرا بکرێت.`
      );
    }

    const isOptimal = warnings.length === 0;
    const pacingNotes = `کات: ${durationMin} خولەک | مامناوەندی کات بۆ هەر سڵایدێک: ${(durationMin / slides).toFixed(1)} خولەک`;

    return {
      isOptimal,
      recommendedMinSlides,
      recommendedMaxSlides,
      warnings,
      pacingNotes
    };
  }

  private buildSectionList(
    purpose: PresentationPurpose,
    totalSlides: number
  ): { id: string; title: string; purpose: string; weight: number }[] {
    const isThesisOrDefense = purpose === 'thesis_defense' || purpose === 'academic_briefing';
    const isShort = totalSlides <= 6;

    if (isShort) {
      return [
        { id: 'sec_intro', title: 'دەروازە و زەمینەسازی', purpose: 'ناساندنی کێشە و ئامانج', weight: 1 },
        { id: 'sec_method_evidence', title: 'میتۆد و بەڵگەکان', purpose: 'شێوازی توێژینەوە و بەڵگەکان', weight: 2 },
        { id: 'sec_findings', title: 'ئەنجامە سەرەکییەکان', purpose: 'خستنەڕووی دەرئەنجامەکان', weight: 2 },
        { id: 'sec_conclusion', title: 'کۆبەند و سەرچاوەکان', purpose: 'دەرئەنجامی کۆتایی و ئاماژەکان', weight: 1 }
      ];
    }

    if (isThesisOrDefense) {
      return [
        { id: 'sec_context', title: 'دەروازە و زەمینەی زانستی', purpose: 'ڕوونکردنەوەی پاشخانی توێژینەوە', weight: 1.5 },
        { id: 'sec_problem_rq', title: 'کێشەی توێژینەوە و پرسیارەکان', purpose: 'دیاریکردنی کەلەپۆڕی زانستی و ئامانج', weight: 1.5 },
        { id: 'sec_lit_review', title: 'پێشینەی ئەکادیمی', purpose: 'بەراوردی توێژینەوە پێشووەکان', weight: 2.0 },
        { id: 'sec_methodology', title: 'میتۆدۆلۆژی و دیزاین', purpose: 'ڕوونکردنەوەی ئامراز و داتا', weight: 2.0 },
        { id: 'sec_analysis_findings', title: 'شیکردنەوە و بەڵگەکان', purpose: 'پێشکەشکردنی تاقیکردنەوە و دەرئەنجام', weight: 3.0 },
        { id: 'sec_discussion', title: 'تاوتوێکردنی ئەکادیمی', purpose: 'بەراوردی ئەنجامەکان لەگەڵ ئەدەبیات', weight: 2.0 },
        { id: 'sec_conclusion_rec', title: 'دەرئەنجام و پێشنیازەکان', purpose: 'پوختەی کۆتایی و هەنگاوەکانی داهاتوو', weight: 1.5 },
        { id: 'sec_references', title: 'سەرچاوە سەرەکییەکان', purpose: 'لیستی سەرچاوە پشتڕاستکراوەکان', weight: 1.0 }
      ];
    }

    // Standard Academic Presentation
    return [
      { id: 'sec_intro', title: 'دەروازە و پێشەکی', purpose: 'ناساندنی تەوەر و زەمینەسازی', weight: 1 },
      { id: 'sec_problem', title: 'کێشە و پرسیاری توێژینەوە', purpose: 'دیاریکردنی کێشەی ئەکادیمی', weight: 1 },
      { id: 'sec_context', title: 'پێشینە و ئەدەبیات', purpose: 'خستنەڕووی بوار و ئاماژەکان', weight: 1.5 },
      { id: 'sec_method', title: 'میتۆدی توێژینەوە', purpose: 'شێوازی کۆکردنەوە و شیکردنەوەی داتا', weight: 1.5 },
      { id: 'sec_findings', title: 'دەستکەوت و ئەنجامەکان', purpose: 'خستنەڕووی بەڵگە و شیکارییەکان', weight: 2.5 },
      { id: 'sec_discussion', title: 'تاوتوێکردنی ئەنجامەکان', purpose: 'لێکدانەوەی زانستیی دەرئەنجامەکان', weight: 1.5 },
      { id: 'sec_conclusion', title: 'کۆبەند و سەرچاوەکان', purpose: 'کۆتایی و ئاماژە ئەکادیمییەکان', weight: 1 }
    ];
  }

  private allocateSlideIndices(
    sectionsDef: { id: string; title: string; purpose: string; weight: number }[],
    totalSlides: number
  ): PresentationSection[] {
    const totalWeight = sectionsDef.reduce((sum, s) => sum + s.weight, 0);
    let currentSlideIdx = 1;

    return sectionsDef.map((sec, i) => {
      const isLast = i === sectionsDef.length - 1;
      let count = Math.max(1, Math.round((sec.weight / totalWeight) * totalSlides));

      if (isLast) {
        count = Math.max(1, totalSlides - currentSlideIdx + 1);
      }

      const slideIndices: number[] = [];
      for (let s = 0; s < count && currentSlideIdx <= totalSlides; s++) {
        slideIndices.push(currentSlideIdx++);
      }

      return {
        id: sec.id,
        title: sec.title,
        purpose: sec.purpose,
        targetSlideCount: slideIndices.length,
        slideIndices
      };
    });
  }

  private extractCoreThesis(context: PresentationContext, topic: string): string {
    if (context.academicDocument?.sections?.length) {
      const pText = context.academicDocument.sections[0]?.paragraphs[0]?.text;
      if (pText) return pText.slice(0, 150) + '...';
    }
    if (context.researchPlan?.questions?.length) {
      return context.researchPlan.questions[0].question;
    }
    return `توێژینەوەی ئەکادیمی دەربارەی: ${topic}`;
  }

  private extractKeyTakeaways(context: PresentationContext): string[] {
    const takeaways: string[] = [];
    if (context.claims && context.claims.length > 0) {
      context.claims.slice(0, 3).forEach(c => takeaways.push(c.statement));
    } else if (context.academicDocument?.sections) {
      context.academicDocument.sections.slice(0, 3).forEach(s => {
        takeaways.push(`${s.sectionTitle}: پوختەی دەستکەوتی سەرەکی`);
      });
    }

    if (takeaways.length === 0) {
      takeaways.push('خستنەڕووی زانستی و بەڵگەدار بۆ تەوەرەکە');
      takeaways.push('شی کردنەوەی مەنتقیی دەرئەنجامەکان');
    }

    return takeaways;
  }
}
