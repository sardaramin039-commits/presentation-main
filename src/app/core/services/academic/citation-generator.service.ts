import { Inject, Injectable } from '@angular/core';
import { Citation, CitationContext, CitationStyle, Claim, Evidence, Source } from '../../models/research.model';
import { CitationValidationService } from './citation-validation.service';

export interface ReferenceData {
  author?: string;
  year?: string;
  title?: string;
  publisher?: string;
  url?: string;
}

interface StructuredCitationInput {
  source: Source;
  style: CitationStyle;
  claim?: Claim;
  evidence?: Evidence;
  citationNumber?: number;
}

export interface CitationFormatter {
  formatReference: (context: CitationContext) => string;
  getSortKey: (context: CitationContext) => string;
}

@Injectable({ providedIn: 'root' })
export class CitationGeneratorService {
  private readonly validator: CitationValidationService;

  // Kept as an explicit constructor token for backwards-compatible unit tests.
  // eslint-disable-next-line @angular-eslint/prefer-inject
  constructor(@Inject(CitationValidationService) validator: CitationValidationService) {
    this.validator = validator;
  }

  generateCitation(input: StructuredCitationInput): Citation;
  generateCitation(data: ReferenceData): string;
  generateCitation(input: StructuredCitationInput | ReferenceData): Citation | string {
    if (!('source' in input)) return this.generateAPACitation(input);

    const { source, style, claim, evidence, citationNumber } = input;
    const authors = source.metadata.authors ?? [];
    const year = source.metadata.publicationYear?.toString() ?? 'n.d.';
    const locator = evidence?.location?.page;
    const authorText = authors.length > 0 ? authors.join(' & ') : 'Unknown author';
    const fullReferenceText = style === 'IEEE'
      ? `${citationNumber ? `[${citationNumber}] ` : ''}${authors.join(', ')}. ${source.metadata.title}. ${source.metadata.journal ?? source.metadata.publisher ?? ''}, ${year}.`
      : `${authorText} (${year}). ${source.metadata.title}.${source.metadata.publisher ? ` ${source.metadata.publisher}.` : ''}`;
    const citationId = `citation_${source.id}_${claim?.id ?? 'source'}_${style}`;
    const citation: Citation = {
      citationId,
      sourceId: source.id,
      claimId: claim?.id,
      evidenceId: evidence?.id,
      style,
      citationType: style === 'IEEE' ? 'numeric' : 'parenthetical',
      inTextParenthetical: style === 'IEEE'
        ? `[${citationNumber ?? 1}${locator ? `, p. ${locator}` : ''}]`
        : `(${authors[0]?.split(' ').pop() ?? 'Unknown'}, ${year}${locator ? `, p. ${locator}` : ''})`,
      inTextNarrative: `${authors[0]?.split(' ').pop() ?? 'Unknown'} (${year})`,
      inTextNumeric: style === 'IEEE' ? `[${citationNumber ?? 1}${locator ? `, p. ${locator}` : ''}]` : undefined,
      fullReferenceText,
      formattedText: fullReferenceText,
      createdFromStructuredDataOnly: true,
      provenance: {
        sourceId: source.id,
        citationStyle: style,
        generatedAt: new Date().toISOString(),
        formatterVersion: '1.0.0',
        evidenceId: evidence?.id,
        claimId: claim?.id
      }
    };
    const validation = this.validator.validateCitation(citation, source, claim, evidence);
    citation.validationResult = validation;
    citation.validationStatus = validation.status;
    return citation;
  }

  generateAPACitation(data: ReferenceData): string {
    let citation = `${data.author || 'سەرچاوە'}. (${data.year || '٢٠٢٦'}). *${data.title || 'زانستی'}*.`;
    if (data.publisher) citation += ` ${data.publisher}.`;
    if (data.url) citation += ` وەرگیراوە لە: ${data.url}`;
    return citation;
  }

  generateChicagoCitation(data: ReferenceData): string {
    return `${data.author || ''}. "${data.title || ''}." ${data.publisher || ''} ${data.year || ''}.`;
  }

  getFormatter(style: string): CitationFormatter {
    void style;
    return {
      formatReference: (context: CitationContext) => this.generateAPACitation({
        author: context.source?.metadata.authors?.join(' & '),
        year: context.source?.metadata.publicationYear?.toString(),
        title: context.source?.metadata.title,
        publisher: context.source?.metadata.publisher,
        url: context.source?.metadata.url
      }),
      getSortKey: (context: CitationContext) => {
        void context;
        return '1';
      }
    };
  }
}
