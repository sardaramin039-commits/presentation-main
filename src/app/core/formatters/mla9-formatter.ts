import { CitationFormatter } from './citation-formatter.interface';
import { CitationContext, CitationStyle } from '../models/research.model';
import { parseAuthorName, formatDoiOrUrl, extractPageFromLocator } from './formatter-utils';

export class MLA9Formatter implements CitationFormatter {
  readonly style: CitationStyle = 'MLA9';

  formatInTextParenthetical(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const page = extractPageFromLocator(context.locator) || (meta.pages ? meta.pages : '');

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

    const pageStr = page ? ` ${page}` : '';
    return `(${authorStr}${pageStr})`;
  }

  formatInTextNarrative(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
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

    const pageStr = page ? ` (p. ${page})` : '';
    return `${authorStr}${pageStr}`;
  }

  formatReference(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];

    let authorPart = '';
    if (authors.length === 1) {
      const p = parseAuthorName(authors[0]);
      authorPart = `${p.lastName}, ${p.firstName || p.initials || ''}.`.trim();
    } else if (authors.length === 2) {
      const p1 = parseAuthorName(authors[0]);
      const p2 = parseAuthorName(authors[1]);
      authorPart = `${p1.lastName}, ${p1.firstName || ''}, and ${p2.firstName || ''} ${p2.lastName}.`;
    } else if (authors.length >= 3) {
      const p1 = parseAuthorName(authors[0]);
      authorPart = `${p1.lastName}, ${p1.firstName || ''}, et al.`;
    }

    const titlePart = meta.sourceType === 'book'
      ? `*${meta.title}*.`
      : `"${meta.title}."`;

    let containerPart = '';
    if (meta.journal) {
      const vol = meta.volume ? `, vol. ${meta.volume}` : '';
      const issue = meta.issue ? `, no. ${meta.issue}` : '';
      const year = meta.publicationYear ? `, ${meta.publicationYear}` : '';
      const pages = meta.pages ? `, pp. ${meta.pages}` : '';
      containerPart = `*${meta.journal}*${vol}${issue}${year}${pages}.`;
    } else if (meta.publisher) {
      const year = meta.publicationYear ? `, ${meta.publicationYear}` : '';
      containerPart = `${meta.publisher}${year}.`;
    } else if (meta.publicationYear) {
      containerPart = `${meta.publicationYear}.`;
    }

    const link = formatDoiOrUrl(meta);
    const linkPart = link ? ` ${link}.` : '';

    return [authorPart, titlePart, containerPart, linkPart].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  getSortKey(context: CitationContext): string {
    const meta = context.source.metadata;
    const firstAuthor = meta.authors && meta.authors[0] ? parseAuthorName(meta.authors[0]).lastName : meta.title;
    return `${firstAuthor}_${meta.title}`.toLowerCase();
  }
}
