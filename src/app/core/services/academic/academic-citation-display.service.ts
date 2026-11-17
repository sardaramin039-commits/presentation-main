import { Injectable } from '@angular/core';
import { CitationElement } from '../../models/slide-design.model';
import { SlidePlan } from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class AcademicCitationDisplayService {
  /**
   * Formats and binds citations to slides ensuring readability and traceability.
   * Strictly avoids inventing fake citations.
   */
  generateCitationElements(slide: SlidePlan): CitationElement[] {
    if (!slide.citationMaps || slide.citationMaps.length === 0) {
      return [];
    }

    return slide.citationMaps.map((citeMap, index) => {
      const inText = citeMap.inText || `(${citeMap.author || 'سەرچاوە'}, ${citeMap.year || 'نادیار'})`;
      const fullReference = citeMap.fullReference || `${citeMap.author || 'نادیار'} (${citeMap.year || 'نادیار'}). ${citeMap.sourceId}.`;

      return {
        id: `citation_el_${slide.slideNumber}_${index}`,
        citationId: citeMap.citationId || `cite_${index}`,
        inTextCitation: inText,
        fullReference,
        sourceId: citeMap.sourceId || 'src_unknown',
        bounds: {
          xPct: 5,
          yPct: 88 + index * 4,
          wPct: 90,
          hPct: 4
        },
        isReferenceSlide: slide.slideType === 'reference'
      };
    });
  }

  /**
   * Constructs a dedicated References slide layout from citation engine items.
   */
  generateReferencesSlideData(allCitations: SlidePlan['citationMaps']): {
    title: string;
    formattedReferences: string[];
  } {
    const referenceMap = new Map<string, string>();

    for (const c of allCitations || []) {
      if (c && c.fullReference) {
        referenceMap.set(c.sourceId || c.citationId, c.fullReference);
      }
    }

    const formattedReferences = Array.from(referenceMap.values());

    return {
      title: 'سەرچاوە زانستییەکان (References & Citations)',
      formattedReferences: formattedReferences.length > 0
        ? formattedReferences
        : ['هیچ سەرچاوەیەکی دۆکیۆمێنتکراو بەردەست نییە.']
    };
  }
}
