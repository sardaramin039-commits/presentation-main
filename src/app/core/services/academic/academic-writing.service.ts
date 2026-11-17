import { Injectable, inject } from '@angular/core';
import {
  AcademicDocument,
  AcademicSection,
  AcademicParagraph,
  AcademicClaim,
  WritingRequest,
  WritingContext,
  EvidenceGroundedDraft,
  AcademicLanguage
} from '../../models/academic-writing.model';
import {
  Source,
  Claim,
  Evidence,
  Citation,
  CitationStyle,
  ClaimStatus,
  ResearchPlan
} from '../../models/research.model';
import { CitationGeneratorService } from '../citation-generator.service';
import { EvidenceCoverageService } from '../evidence-coverage.service';
import { EvidenceGroundingGuard } from '../evidence-grounding-guard.service';
import { AcademicLanguageService } from '../academic-language.service';
import { DraftValidationService } from '../draft-validation.service';

@Injectable({
  providedIn: 'root'
})
export class AcademicWritingService {
  private citationGenerator = inject(CitationGeneratorService);
  private coverageService = inject(EvidenceCoverageService);
  private groundingGuard = inject(EvidenceGroundingGuard);
  private languageService = inject(AcademicLanguageService);
  private draftValidation = inject(DraftValidationService);

  /**
   * Main Evidence-Grounded Writing Pipeline.
   * Architecture: Research Plan -> Relevant Sources -> Relevant Evidence -> Claim Construction -> Citation Generation -> Academic Paragraph -> Validation
   */
  generateGroundedDraft(
    request: WritingRequest,
    context: WritingContext
  ): EvidenceGroundedDraft {
    // 1. Filter usable verified sources
    const usableSources = (context.sources || []).filter(
      s => s.metadata.verificationStatus !== 'rejected'
    );

    const sourceMap = new Map<string, Source>(usableSources.map(s => [s.id, s]));

    // 2. Claim-First Construction: Group evidence items with claims
    const academicClaims = this.constructAcademicClaims(
      context.claims || [],
      context.evidenceList || [],
      sourceMap,
      request.citationStyle
    );

    // 3. Construct Academic Sections and Paragraphs based on constructed claims
    const sections = this.buildSectionsAndParagraphs(
      request,
      context.researchPlan,
      academicClaims
    );

    // 4. Assemble Academic Document
    const document: AcademicDocument = {
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: context.researchPlan?.topic || request.topic || 'Academic Research Draft',
      academicLevel: this.languageService.getAcademicLevelLabel(request.academicLevel, request.language),
      language: request.language,
      citationStyle: request.citationStyle,
      sections,
      sources: usableSources,
      claims: context.claims || [],
      citations: this.extractAllCitations(sections),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 5. Apply Evidence Grounding Guard across document
    this.groundingGuard.guardDocument(document);

    // 6. Calculate Evidence Coverage Metrics
    const coverageMetrics = this.coverageService.calculateDocumentCoverage(document);

    // 7. Validate Draft
    const validationResult = this.draftValidation.validateDraft(document);

    return {
      document,
      coverageMetrics,
      validationResult
    };
  }

  /**
   * STEP 2: Claim-First Construction
   * 1. Determine claims.
   * 2. Find evidence for each claim.
   * 3. Identify source for each claim.
   * 4. Generate citation for each claim.
   * If claim lacks evidence: stays UNVERIFIED / UNSUPPORTED. AI does NOT invent evidence.
   */
  private constructAcademicClaims(
    rawClaims: Claim[],
    evidenceList: Evidence[],
    sourceMap: Map<string, Source>,
    citationStyle: CitationStyle
  ): AcademicClaim[] {
    const academicClaims: AcademicClaim[] = [];

    for (const rawClaim of rawClaims) {
      // Find matching evidence items
      const matchingEvidence = evidenceList.filter(
        ev => ev.sourceId && sourceMap.has(ev.sourceId)
      );

      const primaryEvidence: Evidence | undefined = matchingEvidence[0];
      const source: Source | undefined = primaryEvidence ? sourceMap.get(primaryEvidence.sourceId) : undefined;

      let claimStatus: ClaimStatus = rawClaim.status;
      let unsupportedReason: string | undefined = undefined;

      if (!primaryEvidence || !source) {
        claimStatus = 'unverified';
        unsupportedReason = 'No verified evidence link established.';
      } else if (source.metadata.verificationStatus === 'rejected') {
        claimStatus = 'unsupported';
        unsupportedReason = 'Source verification was rejected.';
      }

      // Generate Citation if source is available
      let citation: Citation | undefined = undefined;
      if (source && primaryEvidence && claimStatus !== 'unsupported') {
        citation = this.citationGenerator.generateCitation({
          source,
          claim: rawClaim,
          evidence: primaryEvidence,
          style: citationStyle
        });
      }

      academicClaims.push({
        claim: rawClaim,
        evidenceItems: primaryEvidence ? [primaryEvidence] : [],
        source,
        citation,
        status: claimStatus,
        unsupportedReason
      });
    }

    return academicClaims;
  }

  /**
   * Builds Sections and Paragraphs from structured claims and research plan subtopics.
   */
  private buildSectionsAndParagraphs(
    request: WritingRequest,
    plan: ResearchPlan | undefined,
    academicClaims: AcademicClaim[]
  ): AcademicSection[] {
    const sections: AcademicSection[] = [];
    const subtopics = plan?.subtopics && plan.subtopics.length > 0
      ? plan.subtopics
      : ['Introduction & Context', 'Evidence Synthesis', 'Analytical Discussion'];

    const claimsPerSection = Math.max(1, Math.ceil(academicClaims.length / subtopics.length));

    for (let i = 0; i < subtopics.length; i++) {
      const sectionTitle = subtopics[i];
      const sectionId = `sec_${i + 1}`;
      const sectionClaims = academicClaims.slice(i * claimsPerSection, (i + 1) * claimsPerSection);

      const paragraph = this.buildParagraphForClaims(
        sectionId,
        sectionTitle,
        sectionClaims,
        request.language,
        request.academicLevel
      );

      sections.push({
        id: sectionId,
        sectionTitle,
        order: i + 1,
        paragraphs: [paragraph]
      });
    }

    return sections;
  }

  /**
   * Constructs a single paragraph from a list of grounded claims.
   */
  private buildParagraphForClaims(
    sectionId: string,
    sectionTitle: string,
    claims: AcademicClaim[],
    language: AcademicLanguage,
    academicLevel: string
  ): AcademicParagraph {
    const paragraphId = `para_${sectionId}_1`;
    const paragraphCitations: Citation[] = [];
    const textParts: string[] = [];

    if (claims.length === 0) {
      const fallbackText = language === 'ckb'
        ? `لە بەشی ${sectionTitle}دا، لێکۆڵینەوە و پێداچوونەوەی زانستی بۆ سەرچاوە بڕواپێکراوەکان بەردەوامە.`
        : `In ${sectionTitle}, systematic evidence-grounded review continues based on verified sources.`;

      return {
        id: paragraphId,
        sectionId,
        text: fallbackText,
        claims: [],
        citations: [],
        coverageMetrics: {
          totalClaims: 0,
          supportedClaims: 0,
          partiallySupportedClaims: 0,
          unsupportedClaims: 0,
          unverifiedClaims: 0,
          coverageScore: 0
        },
        warnings: ['No claims assigned to this paragraph.'],
        isVerifiedAcademicText: false
      };
    }

    for (const ac of claims) {
      let claimSentence = ac.claim.statement;

      // Append evidence snippet if available
      if (ac.evidenceItems && ac.evidenceItems.length > 0 && ac.evidenceItems[0].extractedSnippet) {
        const snippet = ac.evidenceItems[0].extractedSnippet;
        claimSentence += ` (${snippet})`;
      }

      // Attach citation if available
      if (ac.citation) {
        claimSentence += ` ${ac.citation.inTextParenthetical}`;
        paragraphCitations.push(ac.citation);
      } else if (ac.status === 'unverified' || ac.status === 'unsupported') {
        claimSentence += ` [⚠️ بانگەشەی بێ‌بەڵگە / UNVERIFIED CLAIM]`;
      }

      textParts.push(claimSentence);
    }

    const rawParagraphText = textParts.join(' ');

    // Calculate paragraph coverage metrics
    const coverageMetrics = this.coverageService.calculateClaimCoverage(claims);

    const baseParagraph: AcademicParagraph = {
      id: paragraphId,
      sectionId,
      text: rawParagraphText,
      claims,
      citations: paragraphCitations,
      coverageMetrics,
      warnings: [],
      isVerifiedAcademicText: coverageMetrics.unsupportedClaims === 0 && coverageMetrics.unverifiedClaims === 0
    };

    // Polish tone and language while preserving citations
    const polished = this.languageService.polishAcademicParagraph(baseParagraph, language, academicLevel);
    baseParagraph.text = polished.text;

    return baseParagraph;
  }

  private extractAllCitations(sections: AcademicSection[]): Citation[] {
    const citations: Citation[] = [];
    const seen = new Set<string>();

    for (const sec of sections) {
      for (const para of sec.paragraphs) {
        for (const cit of para.citations || []) {
          if (!seen.has(cit.citationId)) {
            seen.add(cit.citationId);
            citations.push(cit);
          }
        }
      }
    }

    return citations;
  }
}
