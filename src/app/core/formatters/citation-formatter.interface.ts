import { CitationStyle, CitationContext } from '../models/research.model';

export interface CitationFormatter {
  readonly style: CitationStyle;

  formatReference(context: CitationContext): string;
  formatInTextParenthetical(context: CitationContext): string;
  formatInTextNarrative(context: CitationContext): string;
  formatInTextNumeric?(context: CitationContext): string;
  formatFootnote?(context: CitationContext): string;
  getSortKey(context: CitationContext): string;
}
