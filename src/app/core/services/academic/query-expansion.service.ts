import { Injectable, inject } from '@angular/core';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';
import { ProvenanceChain } from '../../models/provenance.model';

export interface ExpandedQuerySet {
  rawUserQuery: string;
  detectedIntent: 'definition' | 'causal_relationship' | 'comparative' | 'methodological' | 'general';
  keyConcepts: string[];
  expandedQueries: string[];
  provenance: ProvenanceChain;
}

@Injectable({
  providedIn: 'root'
})
export class QueryExpansionService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Expands Sorani Kurdish queries into academic synonyms, transliterations, and domain terms
   */
  public expandQuery(rawQuery: string): ExpandedQuerySet {
    const trimmed = (rawQuery || '').trim();
    if (!trimmed) {
      const prov = this.provenanceService.createChain('query_expansion', 'Empty query expansion');
      return {
        rawUserQuery: '',
        detectedIntent: 'general',
        keyConcepts: [],
        expandedQueries: [],
        provenance: prov
      };
    }

    // 1. Intent Detection
    let detectedIntent: 'definition' | 'causal_relationship' | 'comparative' | 'methodological' | 'general' = 'general';
    if (/\b(چییە|چییە؟|پێناسە|دەستواژەی)\b/i.test(trimmed)) {
      detectedIntent = 'definition';
    } else if (/\b(کاریگەری|هۆکار|کاریگەرییەکانی|بەرەنجام)\b/i.test(trimmed)) {
      detectedIntent = 'causal_relationship';
    } else if (/\b(بەراورد|جیاوازی|پەیوەندی|نێوان)\b/i.test(trimmed)) {
      detectedIntent = 'comparative';
    } else if (/\b(میتۆد|ڕێگە|شێواز|تاقیکردنەوە)\b/i.test(trimmed)) {
      detectedIntent = 'methodological';
    }

    // 2. Key Concept Extraction
    const stopWords = ['لە', 'بە', 'بۆ', 'لەگەڵ', 'سەر', 'دەربارەی', 'ئەم', 'ئەو', 'چۆن', 'چی'];
    const words = trimmed.split(/\s+/).filter(w => w.length > 2 && !stopWords.includes(w));
    const keyConcepts = Array.from(new Set(words));

    // 3. Synonym & Terminology Expansion (Sorani, English, Arabic/Persian borrowings, Spelling variants)
    const expandedSet = new Set<string>();
    expandedSet.add(trimmed); // Original query is strictly preserved

    // Dictionary mappings for Kurdish Academic domain
    const academicDictionary: Record<string, string[]> = {
      'ژیری': ['ژیریی دەستکرد', 'Artificial Intelligence', 'AI', 'الذكاء الاصطناعي'],
      'دەستکرد': ['ژیریی دەستکرد', 'Artificial Intelligence', 'Machine Learning'],
      'خوێندن': ['پەروەردە', 'پەرەسەندنی ئەکادیمی', 'Higher Education', 'Academic Progress'],
      'پەروەردە': ['فێرکاری', 'خوێندنی باڵا', 'Education System'],
      'تەندروستی': ['پزیشکی', 'تەندروستی گشتی', 'Public Health', 'Healthcare'],
      'ئابووری': ['گەشەی ئابووری', 'بازرگانی', 'Economy', 'Financial Impact'],
      'تەکنەلۆژیا': ['بەکارهێنانی تەکنەلۆژیا', 'فێربوونی دیجیتاڵی', 'Technology', 'Digital Learning'],
      'ژینگە': ['گۆڕانی کەشوهەوا', 'سەوزایی', 'Environment', 'Climate Change'],
      'بەڵگە': ['بەڵگەی زانستی', 'تۆماری ئەکادیمی', 'Empirical Evidence', 'Academic Proof']
    };

    keyConcepts.forEach(concept => {
      // Check spelling variations (e.g., e / ە / ێ)
      if (concept.includes('ێ')) {
        expandedSet.add(concept.replace(/ێ/g, 'ی'));
      }
      if (concept.includes('ە')) {
        expandedSet.add(concept.replace(/ە/g, 'ه'));
      }

      // Check dictionary matches
      Object.keys(academicDictionary).forEach(key => {
        if (concept.includes(key)) {
          academicDictionary[key].forEach(syn => {
            expandedSet.add(`${trimmed} (${syn})`);
            expandedSet.add(syn);
          });
        }
      });
    });

    const expandedQueries = Array.from(expandedSet);
    const provenance = this.provenanceService.createChain(
      'query_expansion',
      `Expanded raw query '${trimmed}' into ${expandedQueries.length} academic variants.`
    );

    return {
      rawUserQuery: trimmed,
      detectedIntent,
      keyConcepts,
      expandedQueries,
      provenance
    };
  }
}
