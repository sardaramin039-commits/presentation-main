import { CitationFormatter } from './citation-formatter.interface';
import { CitationContext, CitationStyle } from '../models/research.model';
import { parseAuthorName, formatDoiOrUrl, extractPageFromLocator, formatYearOrNd } from './formatter-utils';

export class ChicagoAuthorDateFormatter implements CitationFormatter {
  readonly style: CitationStyle = 'ChicagoAuthorDate';

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
    } else if (authors.length <= 3) {
      const names = authors.map(a => parseAuthorName(a).lastName);
      authorStr = `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    } else {
      authorStr = `${parseAuthorName(authors[0]).lastName} et al.`;
    }

    const pageStr = page ? `, ${page}` : '';
    return `(${authorStr} ${yearStr}${pageStr})`;
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
    } else if (authors.length <= 3) {
      const names = authors.map(a => parseAuthorName(a).lastName);
      authorStr = `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
    } else {
      authorStr = `${parseAuthorName(authors[0]).lastName} et al.`;
    }

    const pageStr = page ? `, ${page}` : '';
    return `${authorStr} (${yearStr}${pageStr})`;
  }

  formatReference(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const yearStr = meta.publicationYear ? `${meta.publicationYear}.` : 'n.d.';

    let authorPart = '';
    if (authors.length === 0) {
      authorPart = `${meta.title}. ${yearStr}`;
    } else {
      const first = parseAuthorName(authors[0]);
      const firstStr = `${first.lastName}, ${first.firstName || first.initials || ''}`.trim();

      if (authors.length === 1) {
        authorPart = `${firstStr}. ${yearStr}`;
      } else {
        const others = authors.slice(1).map(a => {
          const p = parseAuthorName(a);
          return `${p.firstName || p.initials || ''} ${p.lastName}`.trim();
        });
        authorPart = `${firstStr}, and ${others.join(', ')}. ${yearStr}`;
      }
    }

    const titlePart = meta.authors && meta.authors.length > 0
      ? (meta.sourceType === 'book' ? `*${meta.title}*.` : `"${meta.title}."`)
      : '';

    let containerPart = '';
    if (meta.journal) {
      const volIssue = meta.volume
        ? ` ${meta.volume}${meta.issue ? `, no. ${meta.issue}` : ''}`
        : '';
      const pages = meta.pages ? `: ${meta.pages}` : '';
      containerPart = `*${meta.journal}*${volIssue}${pages}.`;
    } else if (meta.publisher) {
      containerPart = `${meta.publisher}.`;
    }

    const link = formatDoiOrUrl(meta);
    const linkPart = link ? ` ${link}.` : '';

    return [authorPart, titlePart, containerPart, linkPart].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
  }

  getSortKey(context: CitationContext): string {
    const meta = context.source.metadata;
    const firstAuthor = meta.authors && meta.authors[0] ? parseAuthorName(meta.authors[0]).lastName : meta.title;
    return `${firstAuthor}_${meta.publicationYear || 0}_${meta.title}`.toLowerCase();
  }
}
