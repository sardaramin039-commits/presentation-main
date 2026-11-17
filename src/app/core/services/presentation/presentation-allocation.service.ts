import { Injectable } from '@angular/core';
import {
  Claim,
  Evidence,
  Citation,
  Source
} from '../../models/research.model';
import {
  AcademicDocument,
  AcademicParagraph
} from '../../models/academic-writing.model';
import {
  PresentationNarrative,
  PresentationContext,
  PresentationRequest,
  SlidePlan,
  SlidePurpose,
  SlideType,
  ContentBlock,
  ContentPriority,
  SlideEvidenceMap,
  SlideCitationMap,
  SlideContentPlan,
  PresentationSection
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class PresentationAllocationService {
  /**
   * Prioritizes claims and evidence into Essential, Important, Supporting, and Optional tiers.
   */
  prioritizeContent(
    claims: Claim[] = [],
    evidenceList: Evidence[] = []
  ): { id: string; priority: ContentPriority; reason: string }[] {
    const results: { id: string; priority: ContentPriority; reason: string }[] = [];

    claims.forEach((claim, idx) => {
      const hasEv = evidenceList.some(e => e.claimId === claim.id);
      if (idx === 0 || claim.status === 'supported') {
        results.push({
          id: claim.id,
          priority: 'essential',
          reason: 'بانگەشەی بنچینەیی پشتڕاستکراو بە بەڵگەی زانستی'
        });
      } else if (hasEv) {
        results.push({
          id: claim.id,
          priority: 'important',
          reason: 'بانگەشەی پشتیوانیکراو بە بەڵگە'
        });
      } else if (claim.status === 'partially_supported') {
        results.push({
          id: claim.id,
          priority: 'supporting',
          reason: 'بانگەشەی بەشێک پشتڕاستکراو'
        });
      } else {
        results.push({
          id: claim.id,
          priority: 'optional',
          reason: 'بانگەشەی نەسەلمێنراو یان بێ بەڵگە'
        });
      }
    });

    return results;
  }


  /**
   * Allocates document sections, claims, evidence, and citations across slides.
   */
  allocateContentToSlides(
    narrative: PresentationNarrative,
    context: PresentationContext,
    request: PresentationRequest
  ): SlidePlan[] {
    const totalSlides = narrative.totalTargetSlides;
    const slides: SlidePlan[] = [];

    const claims = context.claims || [];
    const evidenceList = context.evidenceList || [];
    const sources = context.sources || [];
    const citations = context.citations || [];
    const doc = context.academicDocument;

    const allParagraphs: AcademicParagraph[] = [];
    if (doc?.sections) {
      doc.sections.forEach(sec => {
        (sec.paragraphs || []).forEach(p => allParagraphs.push(p));
      });
    }

    let claimCursor = 0;

    narrative.sections.forEach(sec => {
      sec.slideIndices.forEach(slideNum => {
        const slideType = this.determineSlideType(slideNum, totalSlides, sec);
        const purpose = this.mapSlidePurpose(slideType);

        // Pick claim(s) for this slide
        const currentClaim = claims[claimCursor] || null;
        if (currentClaim && (slideType === 'evidence' || slideType === 'finding' || slideType === 'analysis')) {
          claimCursor++;
        }

        const supportingClaims: Claim[] = [];
        if (currentClaim && claims[claimCursor]) {
          supportingClaims.push(claims[claimCursor]);
        }

        // Map relevant evidence
        const relEvidence = currentClaim
          ? evidenceList.filter(e => e.claimId === currentClaim.id)
          : evidenceList.slice(0, 2);

        // Map citations
        const relCitations = this.filterCitationsForSlide(relEvidence, citations);

        // Build content blocks
        const blocks = this.buildContentBlocks(
          slideNum,
          sec,
          slideType,
          currentClaim,
          relEvidence,
          relCitations,
          doc,
          request
        );

        // Build Evidence Maps
        const evidenceMaps = this.buildEvidenceMaps(slideNum, currentClaim, relEvidence, sources, relCitations);

        // Build Citation Maps
        const citationMaps = this.buildCitationMaps(slideNum, relCitations, sources, request.citationStyle);

        // Content plan
        const contentPlan: SlideContentPlan = {
          primaryClaim: currentClaim || undefined,
          supportingClaims,
          evidence: relEvidence,
          citations: relCitations,
          keyTerms: this.extractKeyTerms(sec.title, currentClaim?.statement),
          explanation: this.buildSlideExplanation(sec, currentClaim),
          takeaway: this.buildSlideTakeaway(sec, currentClaim),
          blocks
        };

        const speakerNotes = this.generateSpeakerNotes(
          slideNum,
          sec,
          purpose,
          currentClaim,
          relEvidence,
          relCitations
        );

        const traceabilityPath = this.buildTraceabilityPath(
          slideNum,
          sec,
          currentClaim,
          relEvidence[0],
          sources[0]
        );

        slides.push({
          slideNumber: slideNum,
          title: this.generateSlideTitle(slideNum, totalSlides, sec, currentClaim, slideType),
          purpose,
          slideType,
          layoutIntent: this.determineLayoutIntent(slideType, relEvidence),
          contentPlan,
          evidenceMaps,
          citationMaps,
          densityStatus: 'optimal',
          speakerNotes,
          visualIntentHints: [],
          dataVizType: 'none',
          imageRequired: false,
          traceabilityPath
        });
      });
    });

    return slides;
  }

  private determineSlideType(slideNum: number, totalSlides: number, sec: PresentationSection): SlideType {
    if (slideNum === 1) return 'title';
    if (slideNum === 2) return 'agenda';
    if (slideNum === totalSlides) return 'reference';
    if (slideNum === totalSlides - 1) return 'conclusion';

    const titleLower = sec.title.toLowerCase();
    if (titleLower.includes('میتۆد') || titleLower.includes('method')) return 'methodology';
    if (titleLower.includes('ئەنجام') || titleLower.includes('finding')) return 'finding';
    if (titleLower.includes('شیکاری') || titleLower.includes('analysis')) return 'analysis';
    if (titleLower.includes('تاوتوێ') || titleLower.includes('discussion')) return 'discussion';
    if (titleLower.includes('پێشینە') || titleLower.includes('literature')) return 'literature_review';
    if (titleLower.includes('پرسیار') || titleLower.includes('کێشە')) return 'research_question';

    return 'evidence';
  }

  private mapSlidePurpose(slideType: SlideType): SlidePurpose {
    switch (slideType) {
      case 'title': return 'introduce';
      case 'agenda': return 'contextualize';
      case 'definition': return 'define';
      case 'comparison': return 'compare';
      case 'methodology': return 'explain';
      case 'analysis': return 'analyze';
      case 'evidence': return 'presentEvidence';
      case 'finding': return 'presentFinding';
      case 'discussion': return 'synthesize';
      case 'conclusion': return 'conclude';
      case 'recommendation': return 'recommend';
      case 'reference': return 'citeSources';
      default: return 'explain';
    }
  }

  private buildContentBlocks(
    slideNum: number,
    sec: PresentationSection,
    slideType: SlideType,
    claim: Claim | null,
    evidenceList: Evidence[],
    citations: Citation[],
    doc?: AcademicDocument,
    request?: PresentationRequest
  ): ContentBlock[] {
    const blocks: ContentBlock[] = [];

    if (slideType === 'title') {
      blocks.push({
        id: `blk_${slideNum}_title`,
        text: doc?.title || request?.topic || sec.title || 'ناونیشانی پێشکەشکردنی ئەکادیمی',
        priority: 'essential',
        type: 'heading'
      });
      blocks.push({
        id: `blk_${slideNum}_presenter`,
        text: 'پێشکەشکار: لێکۆڵەری ئەکادیمی',
        priority: 'essential',
        type: 'bullet'
      });
      if (request?.institutionalContext?.universityName) {
        blocks.push({
          id: `blk_${slideNum}_univ`,
          text: `${request.institutionalContext.universityName} - ${request.institutionalContext.department || 'بەشی زانستی'}`,
          priority: 'important',
          type: 'bullet'
        });
      }
      blocks.push({
        id: `blk_${slideNum}_date`,
        text: `بەروار: ${new Date().toLocaleDateString('ku-IQ')}`,
        priority: 'supporting',
        type: 'bullet'
      });
      return blocks;
    }

    if (slideType === 'agenda') {
      blocks.push({
        id: `blk_${slideNum}_agenda_h`,
        text: 'نەخشەڕێگای پێشکەشکردن و تەوەری بەشەکان (Roadmap)',
        priority: 'essential',
        type: 'heading'
      });
      const roadmapItems = [
        '١. پێشەکی، زەمینەسازی و پرسیاری سەرەکی',
        '٢. پێشینەی ئەکادیمی و چەمکە سەرەکییەکان',
        '٣. میتۆدۆلۆژی و شێوازی کۆکردنەوەی داتا',
        '٤. شیکاریی بەڵگە زانستییەکان و دۆزینەوەکان',
        '٥. پوختەی خاڵە سەرەکییەکان (Key Takeaways) و پرسیار و وەڵام (Q&A)'
      ];
      roadmapItems.forEach((item, idx) => {
        blocks.push({
          id: `blk_${slideNum}_road_${idx}`,
          text: item,
          priority: 'essential',
          type: 'bullet'
        });
      });
      return blocks;
    }

    if (slideType === 'conclusion') {
      blocks.push({
        id: `blk_${slideNum}_takeaways_h`,
        text: 'پوختە و خاڵە سەرەکییەکان (Key Takeaways)',
        priority: 'essential',
        type: 'heading'
      });
      const takeaways = [
        '١. بایەخی تیۆری: گرێدانی پێشینەی ئەکادیمی بە بەڵگە نوێیەکان.',
        '٢. ئەنجامی مەیدانی: بەدەستهێنانی داتای پشتڕاستکراو لە سەرچاوەی متمانەپێکراو.',
        '٣. دەستکەوتی سەرەکی: سەلماندنی گریمانەکان لەسەر بنەمای پێوەری زانستی.',
        '٤. دیدگای داهاتوو: پێشنیارکردنی ڕێکاری نوێ بۆ توێژینەوەی بەردەوام.'
      ];
      takeaways.forEach((t, idx) => {
        blocks.push({
          id: `blk_${slideNum}_takeaway_${idx}`,
          text: t,
          priority: 'essential',
          type: 'bullet'
        });
      });
      return blocks;
    }

    if (sec.title.includes('پرسیار') || sec.title.includes('Q&A') || sec.title.includes('گفتوگۆ')) {
      blocks.push({
        id: `blk_${slideNum}_qa_h`,
        text: 'پرسیار و وەڵام',
        priority: 'essential',
        type: 'heading'
      });
      blocks.push({
        id: `blk_${slideNum}_qa_1`,
        text: 'دەرگای پرسیار، سەرنج و گفتوگۆی ئامادەبووان کراوەیە.',
        priority: 'essential',
        type: 'bullet'
      });
      blocks.push({
        id: `blk_${slideNum}_qa_2`,
        text: 'تکایە بە خۆشحاڵییەوە پرسیارەکانتان ئاراستە بکەن سەبارەت بە هەر بەشێکی پێشکەشکردنەکە.',
        priority: 'important',
        type: 'bullet'
      });
      blocks.push({
        id: `blk_${slideNum}_qa_3`,
        text: 'سوپاس بۆ کات، سەرنج و بەشداریکردنی بەڕێزتان.',
        priority: 'supporting',
        type: 'bullet'
      });
      return blocks;
    }

    if (slideType === 'reference' || sec.title.includes('سەرچاوە')) {
      blocks.push({
        id: `blk_${slideNum}_ref_title`,
        text: 'سەرچاوەکان',
        priority: 'essential',
        type: 'heading'
      });
      citations.forEach((c, idx) => {
        blocks.push({
          id: `blk_${slideNum}_ref_${idx}`,
          text: c.fullReferenceText || `${c.inTextParenthetical} - سەرچاوەی ئەکادیمی`,
          priority: 'essential',
          type: 'bullet',
          citationId: c.citationId
        });
      });
      return blocks;
    }

    // Standard Slide
    if (claim) {
      blocks.push({
        id: `blk_${slideNum}_claim`,
        text: claim.statement,
        priority: 'essential',
        type: 'claim_statement',
        claimId: claim.id
      });
    } else {
      blocks.push({
        id: `blk_${slideNum}_sec`,
        text: `${sec.title}: ${sec.purpose}`,
        priority: 'essential',
        type: 'explanation'
      });
    }

    evidenceList.forEach((ev, idx) => {
      blocks.push({
        id: `blk_${slideNum}_ev_${idx}`,
        text: `بەڵگە: "${ev.extractedSnippet}"`,
        priority: 'important',
        type: 'evidence_quote',
        evidenceId: ev.id
      });
    });

    return blocks;
  }

  private buildEvidenceMaps(
    slideNum: number,
    claim: Claim | null,
    evidenceList: Evidence[],
    sources: Source[],
    citations: Citation[]
  ): SlideEvidenceMap[] {
    if (!claim) return [];

    const maps: SlideEvidenceMap[] = [];
    const relEv = evidenceList.filter(e => e.claimId === claim.id);

    if (relEv.length > 0) {
      relEv.forEach(ev => {
        const source = sources.find(s => s.id === ev.sourceId);
        const citation = citations.find(c => c.sourceId === ev.sourceId);

        maps.push({
          slideNumber: slideNum,
          claimId: claim.id,
          claimStatement: claim.statement,
          verificationStatus: claim.status, // NEVER modify verification status!
          evidenceId: ev.id,
          evidenceSnippet: ev.extractedSnippet,
          sourceId: source?.id,
          sourceTitle: source?.metadata?.title,
          citationId: citation?.citationId,
          formattedCitation: citation?.inTextParenthetical
        });
      });
    } else {
      maps.push({
        slideNumber: slideNum,
        claimId: claim.id,
        claimStatement: claim.statement,
        verificationStatus: claim.status || 'unverified'
      });
    }

    return maps;
  }

  private buildCitationMaps(
    slideNum: number,
    citations: Citation[],
    sources: Source[],
    citationStyle = 'APA'
  ): SlideCitationMap[] {
    return citations.map(c => {
      const src = sources.find(s => s.id === c.sourceId);
      const authors = src?.metadata?.authors;
      const authorStr = authors && authors.length > 0 ? authors[0] : 'Unknown';
      const year = src?.metadata?.publicationYear;
      const title = src?.metadata?.title || 'Unknown Title';

      return {
        slideNumber: slideNum,
        citationId: c.citationId,
        style: c.style || citationStyle,
        inText: c.inTextParenthetical || `(${authorStr}, ${year || 'n.d.'})`,
        referenceId: c.sourceId,
        fullReference: c.fullReferenceText || `${authors?.join(', ') || authorStr} (${year || 'n.d.'}). ${title}.`,
        author: authorStr,
        year,
        sourceId: c.sourceId
      };
    });
  }

  private filterCitationsForSlide(evidenceList: Evidence[], citations: Citation[]): Citation[] {
    const sourceIds = new Set(evidenceList.map(e => e.sourceId).filter(Boolean));
    if (sourceIds.size === 0) return citations.slice(0, 2);
    return citations.filter(c => sourceIds.has(c.sourceId));
  }

  private determineLayoutIntent(
    slideType: SlideType,
    evidenceList: Evidence[]
  ): 'title_hero' | 'bullet_summary' | 'two_column' | 'three_column' | 'quote_highlight' | 'data_viz' | 'timeline' | 'process_steps' | 'matrix' | 'reference_list' {
    if (slideType === 'title') return 'title_hero';
    if (slideType === 'discussion') return 'quote_highlight';
    if (slideType === 'agenda') return 'process_steps';
    if (slideType === 'reference') return 'reference_list';
    if (evidenceList.length >= 2) return 'two_column';
    if (slideType === 'comparison') return 'matrix';
    if (slideType === 'methodology') return 'process_steps';
    return 'bullet_summary';
  }

  private generateSlideTitle(
    slideNum: number,
    totalSlides: number,
    sec: PresentationSection,
    claim: Claim | null,
    slideType: SlideType
  ): string {
    if (slideType === 'title') return sec.title || 'ناونیشانی پێشکەشکردن';
    if (slideType === 'agenda') return 'نەخشەڕێگای پێشکەشکردن (Roadmap & Agenda)';
    if (slideType === 'conclusion') return 'پوختە و خاڵە سەرەکییەکان (Key Takeaways)';
    if (sec.title.includes('پرسیار') || sec.title.includes('Q&A') || sec.title.includes('گفتوگۆ') || slideNum === totalSlides) {
      return 'پرسیار و وەڵام';
    }
    if (slideType === 'reference' || sec.title.includes('سەرچاوە')) return 'سەرچاوەکان';
    if (claim) return claim.statement.length > 50 ? claim.statement.slice(0, 47) + '...' : claim.statement;
    return sec.title;
  }

  private extractKeyTerms(secTitle: string, statement?: string): string[] {
    const terms = [secTitle];
    if (statement) {
      const words = statement.split(' ').filter(w => w.length > 4);
      terms.push(...words.slice(0, 2));
    }
    return terms;
  }

  private buildSlideExplanation(sec: PresentationSection, claim: Claim | null): string {
    if (claim) {
      return `شیکردنەوەی ئەکادیمی بۆ بانگەشەی: "${claim.statement}" لە چوارچێوەی ${sec.title}.`;
    }
    return `ڕوونکردنەوەی بەشی ${sec.title} بەپێی ئامانجی ${sec.purpose}.`;
  }

  private buildSlideTakeaway(sec: PresentationSection, claim: Claim | null): string {
    if (claim) {
      return `دەرئەنجامی سەرەکی: ${claim.statement}`;
    }
    return `تێبینی سەرەکی: داپۆشینی بەشی ${sec.title}.`;
  }

  private generateSpeakerNotes(
    slideNum: number,
    sec: PresentationSection,
    purpose: SlidePurpose,
    claim: Claim | null,
    evidenceList: Evidence[],
    citations: Citation[]
  ): string {
    if (sec.title.includes('پێڕست') || sec.title.includes('نەخشەڕێگا') || slideNum === 2) {
      return `ڕێز و سڵاو بۆ ئامادەبووانی بەڕێز. لەم سڵایدەدا نەخشەڕێگای گشتی و زنجیرەبەندیی تەوەرەکانی پێشکەشکردنەکە (Presentation Roadmap) دەخەینەڕوو تا ئاگاداری قۆناغە یەک لە دوای یەکەکانی ئەم توێژینەوەیە بن. بەرچاوڕوونی لە پێڕستی بابەتەکان یارمەتیدەر دەبێت لە تێگەیشتنی باشتر لە بونیادی لۆجیکی بابەتەکە لە دەستپێکەوە تا دەرئەنجامە کۆتاییەکان.`;
    }

    if (slideNum === 1) {
      return `بەخێرهاتنی گەرمی هەموو ئامادەبووان و مامۆستایانی بەڕێز دەکەم. من وەک پێشکەشکاری ئەم توێژینەوەیە خۆشحاڵم کە ئەمڕۆ لە خزمەتتاندا ئەم بابەتە زانستییە دەخەمەڕوو کە یەکێکە لە تەوەرە گرنگ و هاوچەرخەکان. لەم پێشکەشکردنەدا تیشک دەخەینە سەر پرسیارە سەرەکییەکان و بەڵگە زانستییەکان بە شێوەیەکی سیستماتیک.`;
    }

    if (sec.title.includes('کۆتایی') || sec.title.includes('Takeaways') || sec.title.includes('پوختە')) {
      return `لەم سڵایدەدا تیشک دەخەینە سەر گرنگترین ٣ بۆ ٥ خاڵی سەرەکی و دەستکەوتی توێژینەوەکە (Key Takeaways). بایەخی ئەم خاڵانە لەوەدایە کە ڕەنگدانەوەی ڕاستەوخۆی وەڵامی پرسیارە بنەڕەتییەکانن و بنەمایەک دادەمەزرێنن بۆ گەشەپێدانی زانستی و بڕیاردانی ئەکادیمیی دروست لەم بوارەدا. هەر یەکێک لەم خاڵانە دەبێتە سەرمایەیەکی زانستیی گرنگ لە زەینی بینەراندا.`;
    }

    if (sec.title.includes('پرسیار') || sec.title.includes('Q&A') || sec.title.includes('گفتوگۆ') || purpose === 'synthesize') {
      return `ئێستا گەیشتووینەتە بڕگەی پرسیار و وەڵام (Questions & Answers). وەک پێشکەشکار، بە تەواوی ئامادەم بۆ وەڵامدانەوەی پرسیارەکانتان سەبارەت بە تەواوی بابەتەکانی پێشکەشکردنەکە و بە گەرمی داوا لە ئامادەبووانی بەڕێز دەکەم تا پرسیار لەسەر دەستنیشانکراوترین تەوەرەکان یان هەر لایەنێکی دیاریکراوی پێشکەشکردنەکە ببن بپرسن تا گفتوگۆیەکی دەوڵەمەند و بەرهەمدار پێکبهێنین.`;
    }

    if (purpose === 'citeSources' || sec.title.includes('سەرچاوە') || sec.title.includes('پەراوێز')) {
      return `ئەم سڵایدە تەرخانکراوە بۆ خستنەڕووی سەرچاوە و پەراوێزە زانستییەکانی ئەم توێژینەوەیە (Sources & References). لە گوتاری ئەکادیمیدا، ئاماژەدان و بەکارهێنانی سەرچاوەی متمانەپێکراو بنەمای سەرەکیی پاراستنی ڕاستگۆیی زانستی (Academic Integrity) و بەهای تیۆریی بابەتەکەیە. هانی ئامادەبووانی بەڕێز دەدەم بۆ بەدواداچوونی زیاتر سەردانی ئەم سەرچاوانە بپکۆڵنەوە تا زانیاریی قووڵتر و وردتریان دەستبکەوێت.`;
    }

    const topicText = sec.title;
    const claimText = claim ? claim.statement : 'تەوەرەی سەرەکیی ئەم بەشە و شی کردنەوەی زانستیی دەرئەنجامەکان';
    const evidenceSummary = evidenceList.length > 0
      ? evidenceList.map(e => e.extractedSnippet).join('، ')
      : 'بەڵگەی زانستی و شیکاریی مێژوویی و تیۆریی پشتڕاستکراو';
    const citationText = citations.length > 0
      ? citations.map(c => c.inTextParenthetical || c.fullReferenceText).join('؛ ')
      : 'سەرچاوە ئەکادیمییە متمانەپێکراوەکان';

    return `ڕێز و سڵاو بۆ ئامادەبووانی بەڕێز و مامۆستایانی بەڕێز. لەم سڵایدەدا (سڵایدی ${slideNum})، سەرنجتان ڕادەکێشم بۆ تەوەری "${topicText}" کە یەکێکە لە ستوونە سەرەکی و بڕبڕەی پشتی ئەم توێژینەوە ئەکادیمییە. ئامانجی سەرەکی لە خستنەڕووی ئەم تەوەرەیە، ${sec.purpose}یە تاوەکو وێنەیەکی روون لە چوارچێوەی لۆجیکیی بابەتەکە دروست بێت. وەک لە زانیارییە زانستییەکاندا بە ڕوونی دەردەکەوێت، بانگەشەی سەرەکیی تەوەرەکە بریتییە لەوەی کە: ${claimText}. بۆ بونیادنانی ئەم تێزە بە شێوەیەکی زانستیی بەڵگەدار، سوود لە کۆمەڵێک داتا و ئاماری ڕاستەقینە وەرگیراوە، لەوانە: ${evidenceSummary}. ئەم بەڵگانە لەسەر بنەمای پێوەرە ئەکادیمییەکان پشکنینیان بۆ کراوە و لە توێژینەوەکانی ${citationText} دەرهێنراون. وەک پێشکەشکار، پێویستە جەخت لەوە بکەمەوە کە لەبەرچاوگرتنی ئەم دەرئەنجامانە بڕیارێکی ستراتیژییە لە تێگەیشتن لە ئامانجە گشتییەکەی توێژینەوەکە و زەمینەیەکی بەهێز بۆ بەشەکانی داهاتووی پێشکەشکردنەکە دەسازێنێت. ئەگەر سەرنج بدەن، بەراوردکردنی ئەم ڕاستییانە بە پێشینەی مێژوویی نیشانی دەدات کە چۆن گۆڕانکارییەکان کارپێکراون. لە کۆتاییدا، تکایە ئەگەر تێبینی یان پرسیارێکتان لەسەر ئەم شیکارییە هەیە، لە بەشی دیالۆگ و پرسیار و وەڵامدا تاوتوێی دەکەین. ئێستاش بەردەوام دەبین بۆ پەڕینەوە بەرەو سڵایدی داهاتوو تاوەکو زنجیرەی لۆجیکیی باسوخاستەکە بەردەوام بێت.`;
  }

  private buildTraceabilityPath(
    slideNum: number,
    sec: PresentationSection,
    claim: Claim | null,
    evidence?: Evidence,
    source?: Source
  ): string {
    const parts = [`Slide#${slideNum}`, `Sec:${sec.id}`];
    if (claim) parts.push(`Claim:${claim.id}`);
    if (evidence) parts.push(`Evidence:${evidence.id}`);
    if (source) parts.push(`Source:${source.id}`);
    return parts.join(' -> ');
  }
}
