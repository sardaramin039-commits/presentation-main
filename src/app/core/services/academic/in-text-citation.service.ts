import { Injectable } from '@angular/core';
import { Citation } from '../../models/research.model';

export type InTextCitationMode = 'parenthetical' | 'narrative' | 'numeric' | 'footnote';

@Injectable({
  providedIn: 'root'
})
export class InTextCitationService {

  formatInText(citation: Citation, mode: InTextCitationMode = 'parenthetical'): string {
    switch (mode) {
      case 'parenthetical':
        return citation.inTextParenthetical || citation.formattedText || '';
      case 'narrative':
        return citation.inTextNarrative || citation.formattedText || '';
      case 'numeric':
        return citation.inTextNumeric || citation.inTextParenthetical || citation.formattedText || '';
      case 'footnote':
        return citation.footnoteText || citation.inTextParenthetical || citation.formattedText || '';
      default:
        return citation.inTextParenthetical || citation.formattedText || '';
    }
  }

  generateParenthetical(citation: Citation): string {
    return citation.inTextParenthetical || citation.formattedText || '';
  }

  generateNarrative(citation: Citation): string {
    return citation.inTextNarrative || citation.formattedText || '';
  }

  generateNumeric(citation: Citation): string {
    return citation.inTextNumeric || `[${citation.sourceId}]`;
  }

  generateFootnote(citation: Citation): string {
    return citation.footnoteText || citation.fullReferenceText || citation.formattedText || '';
  }
}
