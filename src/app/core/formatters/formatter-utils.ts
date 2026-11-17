import { SourceMetadata, CitationLocator } from '../models/research.model';

export interface ParsedAuthorName {
  firstName?: string;
  lastName: string;
  initials?: string;
}

export function parseAuthorName(fullName: string): ParsedAuthorName {
  const clean = fullName.trim();
  if (!clean) return { lastName: 'Unknown' };

  if (clean.includes(',')) {
    const parts = clean.split(',').map(p => p.trim());
    const lastName = parts[0] || 'Unknown';
    const firstPart = parts[1] || '';
    const initials = firstPart
      .split(/\s+/)
      .map(p => (p[0] ? `${p[0].toUpperCase()}.` : ''))
      .join('');
    return { firstName: firstPart, lastName, initials };
  }

  const parts = clean.split(/\s+/);
  if (parts.length === 1) {
    return { lastName: parts[0] };
  }

  const lastName = parts[parts.length - 1];
  const firstNames = parts.slice(0, parts.length - 1);
  const firstName = firstNames.join(' ');
  const initials = firstNames
    .map(p => (p[0] ? `${p[0].toUpperCase()}.` : ''))
    .join('');

  return { firstName, lastName, initials };
}

export function formatYearOrNd(year?: number): string {
  return year ? year.toString() : 'n.d.';
}

export function formatDoiOrUrl(meta: SourceMetadata): string {
  if (meta.doi) {
    const cleanDoi = meta.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    return `https://doi.org/${cleanDoi}`;
  }
  return meta.url ? meta.url : '';
}

export function extractPageFromLocator(locator?: CitationLocator): string | undefined {
  if (!locator) return undefined;
  if (locator.pageRange && locator.pageRange !== 'unknown') return locator.pageRange;
  if (locator.page && locator.page !== 'unknown') return locator.page;
  return undefined;
}
