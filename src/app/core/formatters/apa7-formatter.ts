import { CitationFormatter } from './citation-formatter.interface';
import { CitationContext, CitationStyle } from '../models/research.model';
import { parseAuthorName, formatYearOrNd, formatDoiOrUrl, extractPageFromLocator } from './formatter-utils';

export class APA7Formatter implements CitationFormatter {
  readonly style: CitationStyle = 'APA7';

  formatInTextParenthetical(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const yearStr = formatYearOrNd(meta.publicationYear);
    const page = extractPageFromLocator(context.locator);

    let authorStr = '';
    if (authors.length === 0) {
      authorStr = `"${meta.title}"`;
    } else if (authors.length === 1) {
      authorStr = parseAuthorName(authors[0]).lastName;
    } else if (authors.length === 2) {
      authorStr = `${parseAuthorName(authors[0]).lastName} & ${parseAuthorName(authors[1]).lastName}`;
    } else {
      authorStr = `${parseAuthorName(authors[0]).lastName} et al.`;
    }

    const pageStr = page ? `, p. ${page}` : '';
    return `(${authorStr}, ${yearStr}${pageStr})`;
  }

  formatInTextNarrative(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const yearStr = formatYearOrNd(meta.publicationYear);
    const page = extractPageFromLocator(context.locator);

    let authorStr = '';
    if (authors.length === 0) {
      authorStr = `"${meta.title}"`;
    } else if (authors.length === 1) {
      authorStr = parseAuthorName(authors[0]).lastName;
    } else if (authors.length === 2) {
      authorStr = `${parseAuthorName(authors[0]).lastName} and ${parseAuthorName(authors[1]).lastName}`;
    } else {
      authorStr = `${parseAuthorName(authors[0]).lastName} et al.`;
    }

    const pageStr = page ? `, p. ${page}` : '';
    return `${authorStr} (${yearStr}${pageStr})`;
  }

  formatReference(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const yearStr = meta.publicationYear ? `(${meta.publicationYear}).` : '(n.d.).';

    let authorPart = '';
    if (authors.length === 0) {
      authorPart = `${meta.title}. ${yearStr}`;
    } else {
      const formattedAuthors = authors.map((a, idx) => {
        const parsed = parseAuthorName(a);
        const nameStr = `${parsed.lastName}, ${parsed.initials || parsed.firstName || ''}`.trim();
        if (idx === authors.length - 1 && authors.length > 1) {
          return `& ${nameStr}`;
        }
        return nameStr;
      });
      authorPart = `${formattedAuthors.join(', ')} ${yearStr}`;
    }

    let titlePart = '';
    if (authors.length > 0) {
      titlePart = meta.sourceType === 'book' ? `*${meta.title}*.` : `${meta.title}.`;
    }

    let containerPart = '';
    if (meta.journal) {
      const volIssue = meta.volume
        ? `, *${meta.volume}*${meta.issue ? `(${meta.issue})` : ''}`
        : '';
      const pages = meta.pages ? `, ${meta.pages}` : '';
      containerPart = `*${meta.journal}*${volIssue}${pages}.`;
    } else if (meta.publisher) {
      containerPart = `${meta.publisher}.`;
    }

    const link = formatDoiOrUrl(meta);
    const linkPart = link ? ` ${link}` : '';

    return [authorPart, titlePart, containerPart, linkPart].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  getSortKey(context: CitationContext): string {
    const meta = context.source.metadata;
    const firstAuthor = meta.authors && meta.authors[0] ? parseAuthorName(meta.authors[0]).lastName : meta.title;
    return `${firstAuthor}_${meta.publicationYear || 0}_${meta.title}`.toLowerCase();
  }
}
