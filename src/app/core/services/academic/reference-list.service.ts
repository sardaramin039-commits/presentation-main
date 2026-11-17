import { Injectable, inject } from '@angular/core';
import { Citation, CitationStyle, Reference, Source } from '../../models/research.model';
import { CitationGeneratorService } from '../citation-generator.service';

@Injectable({
  providedIn: 'root'
})
export class ReferenceListService {
  private generator = inject(CitationGeneratorService);

  buildReferenceList(
    citations: Citation[],
    sources: Source[],
    style: CitationStyle
  ): Reference[] {
    const sourceMap = new Map<string, Source>();
    for (const src of sources) {
      sourceMap.set(src.id, src);
    }

    // Group citations by sourceId (deduplication)
    const citationsBySource = new Map<string, Citation[]>();
    for (const cit of citations) {
      const existing = citationsBySource.get(cit.sourceId) || [];
      existing.push(cit);
      citationsBySource.set(cit.sourceId, existing);
    }

    const references: Reference[] = [];
    let numberIndex = 1;

    // Process sources in stable deterministic order
    for (const [sourceId, sourceCitations] of citationsBySource.entries()) {
      const source = sourceMap.get(sourceId);
      if (!source) continue;

      // Ensure no rejected sources are included in final reference list
      if (source.metadata.verificationStatus === 'rejected') continue;

      const citationIds = sourceCitations.map(c => c.citationId);

      // Generate reference formatted text for this source
      const formatter = this.generator.getFormatter(style);

      const context = {
        source,
        citationNumber: numberIndex++,
        locator: sourceCitations[0]?.locator
      };

      const formattedText = formatter.formatReference(context);
      const sortKey = formatter.getSortKey(context);

      references.push({
        referenceId: `ref_${sourceId}_${style}`,
        sourceId,
        style,
        citationIds,
        formattedBibliographicEntry: formattedText,
        formattedText,
        authorYearKey: sortKey,
        sortKey,
        doi: source.metadata.doi,
        url: source.metadata.url
      });
    }

    // Sort references deterministically according to style rules
    return this.sortReferences(references, style);
  }

  private sortReferences(references: Reference[], style: CitationStyle): Reference[] {
    if (style === 'IEEE') {
      // Numerical order as assigned
      return [...references];
    }

    // Alphabetical / Stable sort by sortKey
    return [...references].sort((a, b) => (a.sortKey || '').localeCompare(b.sortKey || ''));
  }
}
