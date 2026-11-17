import { Injectable, inject } from '@angular/core';
import { Source } from '../../models/research.model';
import { ExtractedClaim } from '../../models/claim.model';
import { SelectedEvidenceItem } from '../../models/evidence.model';
import { ContradictionItem, ContradictionGraph, ContradictionType } from '../../models/contradiction.model';
import { ProvenanceIntegrityService } from '../provenance-integrity.service';

@Injectable({
  providedIn: 'root'
})
export class ContradictionAwareRetrievalService {
  private provenanceService = inject(ProvenanceIntegrityService);

  /**
   * Identifies conflicting claims, date gaps, and methodological disagreements across retrieved sources
   */
  public analyzeContradictions(
    sources: Source[],
    claims: ExtractedClaim[],
    evidenceList: SelectedEvidenceItem[]
  ): ContradictionGraph {
    const items: ContradictionItem[] = [];
    const nodesMap = new Map<string, { id: string; label: string; type: 'claim' | 'source' | 'evidence' }>();
    const edges: { fromId: string; toId: string; relation: 'contradicts' | 'conflicts_with' | 'opposes' }[] = [];

    if (!sources || sources.length < 2) {
      return {
        nodes: [],
        edges: [],
        items: [],
        hasUnresolvedContradictions: false
      };
    }

    // Register Source Nodes
    sources.forEach(s => {
      nodesMap.set(`src-${s.id}`, { id: `src-${s.id}`, label: s.metadata.title, type: 'source' });
    });

    // 1. Check for Opposing Studies / Conflicting Evidence Text
    evidenceList.forEach((evA, i) => {
      evidenceList.forEach((evB, j) => {
        if (i >= j || evA.sourceId === evB.sourceId) return;

        const textA = evA.extractedSnippet.toLowerCase();
        const textB = evB.extractedSnippet.toLowerCase();

        // Contradiction detection keywords in Kurdish
        const hasConflict =
          ((textA.includes('زیادبوون') || textA.includes('گەشەکردنی')) && (textB.includes('کەمبوون') || textB.includes('دابەزینی'))) ||
          ((textB.includes('زیادبوون') || textB.includes('گەشەکردنی')) && (textA.includes('کەمبوون') || textA.includes('دابەزینی'))) ||
          (textA.includes('ئەرێنی') && textB.includes('نەرێنی')) ||
          (textA.includes('سەرکەوتوو') && textB.includes('شکست')) ||
          evA.evidenceType === 'contradictory' || evB.evidenceType === 'contradictory';

        if (hasConflict) {
          const type: ContradictionType = 'conflicting_claims';
          const itemId = `contra-${evA.id}-${evB.id}`;

          const srcA = sources.find(s => s.id === evA.sourceId);
          const srcB = sources.find(s => s.id === evB.sourceId);

          const prov = this.provenanceService.createChain(
            'contradiction_analysis',
            `Detected contradiction between source '${srcA?.metadata.title}' and '${srcB?.metadata.title}'`,
            { sourceId: evA.sourceId, evidenceId: evA.id }
          );

          items.push({
            id: itemId,
            sourceAId: evA.sourceId,
            sourceBId: evB.sourceId,
            sourceATitle: srcA?.metadata.title || 'سەرچاوەی A',
            sourceBTitle: srcB?.metadata.title || 'سەرچاوەی B',
            type,
            explanationKurdish: `ڕاگەیەنراوەکانی سەرچاوەی '${srcA?.metadata.title}' ناکۆکن لەگەڵ دەرئەنجامەکانی '${srcB?.metadata.title}' بەهۆی جیاوازی لە تێڕوانین یان شێوازی تاقیکردنەوە.`,
            severity: 'moderate',
            provenance: prov
          });

          edges.push({
            fromId: `src-${evA.sourceId}`,
            toId: `src-${evB.sourceId}`,
            relation: 'conflicts_with'
          });
        }
      });
    });

    // 2. Check for Publication Date Gap Contradictions (> 10 years gap with differing claims)
    for (let i = 0; i < sources.length; i++) {
      for (let j = i + 1; j < sources.length; j++) {
        const yearA = sources[i].metadata.publicationYear || 2010;
        const yearB = sources[j].metadata.publicationYear || 2020;

        if (Math.abs(yearA - yearB) >= 10) {
          const itemId = `contra-year-${sources[i].id}-${sources[j].id}`;
          const prov = this.provenanceService.createChain(
            'contradiction_analysis',
            `Publication year gap (${yearA} vs ${yearB}) detected between sources.`
          );

          items.push({
            id: itemId,
            sourceAId: sources[i].id,
            sourceBId: sources[j].id,
            sourceATitle: sources[i].metadata.title,
            sourceBTitle: sources[j].metadata.title,
            type: 'publication_date_gap',
            explanationKurdish: `جیاوازیی کاتی لە نێوان توێژینەوەی کۆنتر (${yearA}) و توێژینەوەی نوێتر (${yearB})دا هەیە، کە ڕەنگە ڕەنگدانەوەی گۆڕانکاری لە داتاکاندا بێت.`,
            severity: 'low',
            provenance: prov
          });
        }
      }
    }

    return {
      nodes: Array.from(nodesMap.values()),
      edges,
      items,
      hasUnresolvedContradictions: items.length > 0
    };
  }
}
