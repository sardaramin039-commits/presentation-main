import { CitationFormatter } from './citation-formatter.interface';
import { CitationContext, CitationStyle } from '../models/research.model';
import { parseAuthorName, formatDoiOrUrl, extractPageFromLocator } from './formatter-utils';

export class ChicagoNotesFormatter implements CitationFormatter {
  readonly style: CitationStyle = 'ChicagoNotes';

  formatInTextParenthetical(context: CitationContext): string {
    const num = context.citationNumber || 1;
    return `[${num}]`;
  }

  formatInTextNarrative(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const num = context.citationNumber || 1;

    let authorStr = '';
    if (authors.length === 0) {
      authorStr = `"${meta.title}"`;
    } else if (authors.length === 1) {
      authorStr = parseAuthorName(authors[0]).lastName;
    } else {
      authorStr = `${parseAuthorName(authors[0]).lastName} et al.`;
    }

    return `${authorStr} [${num}]`;
  }

  formatFootnote(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];
    const num = context.citationNumber || 1;
    const page = extractPageFromLocator(context.locator) || meta.pages;

    let authorPart = '';
    if (authors.length > 0) {
      const formatted = authors.map(a => {
        const p = parseAuthorName(a);
        return `${p.firstName || p.initials || ''} ${p.lastName}`.trim();
      });
      if (formatted.length === 1) {
        authorPart = `${formatted[0]}, `;
      } else if (formatted.length === 2) {
        authorPart = `${formatted[0]} and ${formatted[1]}, `;
      } else {
        authorPart = `${formatted[0]} et al., `;
      }
    }

    const titlePart = meta.sourceType === 'book' ? `*${meta.title}*` : `"${meta.title},"`;

    let containerPart = '';
    if (meta.journal) {
      const volIssue = meta.volume
        ? ` ${meta.volume}${meta.issue ? `, no. ${meta.issue}` : ''}`
        : '';
      const yearStr = meta.publicationYear ? ` (${meta.publicationYear})` : '';
      const pageStr = page ? `: ${page}` : '';
      containerPart = ` *${meta.journal}*${volIssue}${yearStr}${pageStr}`;
    } else if (meta.publisher) {
      const yearStr = meta.publicationYear ? `, ${meta.publicationYear}` : '';
      const pageStr = page ? `, ${page}` : '';
      containerPart = ` (${meta.publisher}${yearStr})${pageStr}`;
    } else if (meta.publicationYear) {
      containerPart = ` (${meta.publicationYear})`;
    }

    const link = formatDoiOrUrl(meta);
    const linkPart = link ? `, ${link}` : '';

    return `${num}. ${authorPart}${titlePart}${containerPart}${linkPart}.`.replace(/\s+/g, ' ').trim();
  }

  formatReference(context: CitationContext): string {
    const meta = context.source.metadata;
    const authors = meta.authors || [];

    let authorPart = '';
    if (authors.length === 0) {
      authorPart = `${meta.title}.`;
    } else {
      const first = parseAuthorName(authors[0]);
      const firstStr = `${first.lastName}, ${first.firstName || first.initials || ''}`.trim();

      if (authors.length === 1) {
        authorPart = `${firstStr}.`;
      } else {
        const others = authors.slice(1).map(a => {
          const p = parseAuthorName(a);
          return `${p.firstName || p.initials || ''} ${p.lastName}`.trim();
        });
        authorPart = `${firstStr}, and ${others.join(', ')}.`;
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
      const yearStr = meta.publicationYear ? ` (${meta.publicationYear})` : '';
      const pages = meta.pages ? `: ${meta.pages}` : '';
      containerPart = `*${meta.journal}*${volIssue}${yearStr}${pages}.`;
    } else if (meta.publisher) {
      const yearStr = meta.publicationYear ? `, ${meta.publicationYear}` : '';
      containerPart = `${meta.publisher}${yearStr}.`;
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
