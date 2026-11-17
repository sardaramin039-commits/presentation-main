import { CitationFormatter } from './citation-formatter.interface';
import { CitationContext, CitationStyle } from '../models/research.model';
import { parseAuthorName, extractPageFromLocator, formatDoiOrUrl } from './formatter-utils';

export class IEEEFormatter implements CitationFormatter {
  readonly style: CitationStyle = 'IEEE';

  formatInTextNumeric(context: CitationContext): string {
    const num = context.citationNumber || 1;
    const page = extractPageFromLocator(context.locator);
    return page ? `[${num}, p. ${page}]` : `[${num}]`;
  }

  formatInTextParenthetical(context: CitationContext): string {
    return this.formatInTextNumeric(context);
  }

  formatInTextNarrative(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const num = context.citationNumber || 1;

    let authorStr = '';
    if (authors.length === 1) {
      const p = parseAuthorName(authors[0]);
      authorStr = `${p.initials || p.firstName || ''} ${p.lastName}`.trim();
    } else if (authors.length === 2) {
      const p1 = parseAuthorName(authors[0]);
      const p2 = parseAuthorName(authors[1]);
      authorStr = `${p1.lastName} and ${p2.lastName}`;
    } else if (authors.length > 2) {
      authorStr = `${parseAuthorName(authors[0]).lastName} et al.`;
    }

    return authorStr ? `${authorStr} [${num}]` : `[${num}]`;
  }

  formatReference(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const num = context.citationNumber || 1;

    let authorPart = '';
    if (authors.length > 0) {
      const formatted = authors.map(a => {
        const p = parseAuthorName(a);
        return `${p.initials || p.firstName || ''} ${p.lastName}`.trim();
      });
      if (formatted.length === 1) {
        authorPart = `${formatted[0]}, `;
      } else if (formatted.length === 2) {
        authorPart = `${formatted[0]} and ${formatted[1]}, `;
      } else {
        authorPart = `${formatted[0]} et al., `;
      }
    }

    const titlePart = `"${meta.title},"`;

    let containerPart = '';
    if (meta.journal) {
      const vol = meta.volume ? `, vol. ${meta.volume}` : '';
      const issue = meta.issue ? `, no. ${meta.issue}` : '';
      const pages = meta.pages ? `, pp. ${meta.pages}` : '';
      const year = meta.publicationYear ? `, ${meta.publicationYear}` : '';
      containerPart = ` *${meta.journal}*${vol}${issue}${pages}${year}.`;
    } else if (meta.publisher) {
      const year = meta.publicationYear ? `, ${meta.publicationYear}` : '';
      containerPart = ` ${meta.publisher}${year}.`;
    } else if (meta.publicationYear) {
      containerPart = ` ${meta.publicationYear}.`;
    }

    const link = formatDoiOrUrl(meta);
    const linkPart = link ? ` doi: ${link.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')}.` : '';

    return `[${num}] ${authorPart}${titlePart}${containerPart}${linkPart}`.replace(/\s+/g, ' ').trim();
  }

  getSortKey(context: CitationContext): string {
    const num = context.citationNumber || 999999;
    return num.toString().padStart(8, '0');
  }
}
