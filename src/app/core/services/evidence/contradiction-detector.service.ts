import { Injectable, inject } from '@angular/core';
import { Source, Evidence, Claim } from '../../models/research.model';
import {
  Contradiction,
  DecomposedAssertion
} from '../../models/fact-check.model';
import { ClaimDecompositionService } from '../claim-decomposition.service';

@Injectable({
  providedIn: 'root'
})
export class ContradictionDetectorService {
  private decompositionService = inject(ClaimDecompositionService);

  /**
   * Detects contradictions between evidence statements and claim assertions or cross-source statements.
   */
  detectContradictions(
    claim: Claim,
    assertions: DecomposedAssertion[],
    evidences: Evidence[],
    sources: Source[]
  ): Contradiction[] {
    const contradictions: Contradiction[] = [];
    const sourceMap = new Map<string, Source>();
    sources.forEach(s => sourceMap.set(s.id, s));

    // 1. Cross-Evidence Pairwise Analysis
    for (let i = 0; i < evidences.length; i++) {
      for (let j = i + 1; j < evidences.length; j++) {
        const evA = evidences[i];
        const evB = evidences[j];

        // Skip if from the same source
        if (evA.sourceId === evB.sourceId) continue;

        const contradiction = this.compareEvidencePair(claim, evA, evB, sourceMap);
        if (contradiction) {
          contradictions.push(contradiction);
        }
      }
    }

    // 2. Assertion vs Evidence Analysis
    for (const assertion of assertions) {
      for (const ev of evidences) {
        const contradiction = this.compareAssertionWithEvidence(claim, assertion, ev, sourceMap);
        if (contradiction) {
          // Avoid exact duplicates
          const exists = contradictions.some(c =>
            c.claimId === claim.id &&
            c.statementA === assertion.statement &&
            c.statementB === ev.extractedSnippet
          );
          if (!exists) {
            contradictions.push(contradiction);
          }
        }
      }
    }

    return contradictions;
  }

  /**
   * Compares two evidence items from different sources for potential contradictions.
   */
  private compareEvidencePair(
    claim: Claim,
    evA: Evidence,
    evB: Evidence,
    sourceMap: Map<string, Source>
  ): Contradiction | null {
    const textA = evA.extractedSnippet;
    const textB = evB.extractedSnippet;
    const srcA = sourceMap.get(evA.sourceId);
    const srcB = sourceMap.get(evB.sourceId);

    // Extract dates and numbers from snippets
    const yearA = this.decompositionService.extractYear(textA);
    const yearB = this.decompositionService.extractYear(textB);
    const numA = this.decompositionService.extractNumericAndUnit(textA);
    const numB = this.decompositionService.extractNumericAndUnit(textB);

    // Date Contradiction Check
    if (yearA !== undefined && yearB !== undefined && yearA !== yearB) {
      // Check for semantic distinction (e.g., "founded" vs "registered")
      const actionA = this.extractMainAction(textA);
      const actionB = this.extractMainAction(textB);

      if (actionA && actionB && actionA !== actionB) {
        // Different actions (e.g., "founded" in 1990 vs "registered" in 1995) -> NOT a true conflict!
        return {
          id: `cnt_date_false_${evA.id}_${evB.id}`,
          claimId: claim.id,
          type: 'date',
          statementA: textA,
          statementB: textB,
          sourceA: srcA,
          sourceB: srcB,
          supportingEvidence: [evA],
          contradictingEvidence: [evB],
          contradictionConfidence: 20, // Low confidence in actual contradiction
          reasoning: `Distinction in semantic action ("${actionA}" vs "${actionB}") indicates these may describe separate milestones rather than a direct contradiction.`,
          resolutionStatus: 'not_a_true_conflict',
          resolutionNotes: 'Event actions differ; milestones are sequentially consistent.',
          needsHumanReview: false
        };
      }

      // True Date Contradiction
      return {
        id: `cnt_date_${evA.id}_${evB.id}`,
        claimId: claim.id,
        type: 'date',
        statementA: textA,
        statementB: textB,
        sourceA: srcA,
        sourceB: srcB,
        supportingEvidence: [evA],
        contradictingEvidence: [evB],
        contradictionConfidence: 85,
        reasoning: `Source A reports year ${yearA} while Source B reports year ${yearB} for the same event context.`,
        resolutionStatus: 'unresolved',
        needsHumanReview: true
      };
    }

    // Numerical Contradiction Check
    if (numA.numericValue !== undefined && numB.numericValue !== undefined) {
      if (numA.unit && numB.unit && numA.unit !== numB.unit) {
        // Different units (e.g. kg vs lb or % vs count) -> Scope / Unit Conflict, not direct numerical error
        return {
          id: `cnt_scope_unit_${evA.id}_${evB.id}`,
          claimId: claim.id,
          type: 'scope_conflict',
          statementA: textA,
          statementB: textB,
          sourceA: srcA,
          sourceB: srcB,
          supportingEvidence: [evA],
          contradictingEvidence: [evB],
          contradictionConfidence: 60,
          reasoning: `Unit mismatch detected (${numA.unit} vs ${numB.unit}). The numeric values cannot be directly compared without unit conversion.`,
          resolutionStatus: 'unresolved',
          needsHumanReview: true
        };
      }

      if (numA.numericValue !== numB.numericValue) {
        return {
          id: `cnt_num_${evA.id}_${evB.id}`,
          claimId: claim.id,
          type: 'numerical',
          statementA: textA,
          statementB: textB,
          sourceA: srcA,
          sourceB: srcB,
          supportingEvidence: [evA],
          contradictingEvidence: [evB],
          contradictionConfidence: 90,
          reasoning: `Numerical discrepancy: Source A states ${numA.numericValue}${numA.unit ? ' ' + numA.unit : ''} whereas Source B states ${numB.numericValue}${numB.unit ? ' ' + numB.unit : ''}.`,
          resolutionStatus: 'unresolved',
          needsHumanReview: true
        };
      }
    }

    // Direct Negation Check
    if (this.isDirectNegation(textA, textB)) {
      return {
        id: `cnt_direct_${evA.id}_${evB.id}`,
        claimId: claim.id,
        type: 'direct',
        statementA: textA,
        statementB: textB,
        sourceA: srcA,
        sourceB: srcB,
        supportingEvidence: [evA],
        contradictingEvidence: [evB],
        contradictionConfidence: 95,
        reasoning: 'Direct semantic negation detected between evidence snippets.',
        resolutionStatus: 'unresolved',
        needsHumanReview: true
      };
    }

    return null;
  }

  /**
   * Compares a decomposed assertion against a piece of evidence.
   */
  private compareAssertionWithEvidence(
    claim: Claim,
    assertion: DecomposedAssertion,
    ev: Evidence,
    sourceMap: Map<string, Source>
  ): Contradiction | null {
    const src = sourceMap.get(ev.sourceId);
    const evYear = this.decompositionService.extractYear(ev.extractedSnippet);
    const evNum = this.decompositionService.extractNumericAndUnit(ev.extractedSnippet);

    if (assertion.assertionType === 'date' && assertion.yearValue !== undefined && evYear !== undefined) {
      if (assertion.yearValue !== evYear) {
        return {
          id: `cnt_ast_date_${assertion.id}_${ev.id}`,
          claimId: claim.id,
          type: 'date',
          statementA: assertion.statement,
          statementB: ev.extractedSnippet,
          sourceB: src,
          supportingEvidence: [],
          contradictingEvidence: [ev],
          contradictionConfidence: 80,
          reasoning: `Claim assertion states year ${assertion.yearValue}, but evidence from "${src?.metadata.title || 'Source'}" states year ${evYear}.`,
          resolutionStatus: 'unresolved',
          needsHumanReview: true
        };
      }
    }

    if (assertion.assertionType === 'numerical' && assertion.numericValue !== undefined && evNum.numericValue !== undefined) {
      if (assertion.unit && evNum.unit && assertion.unit !== evNum.unit) {
        return {
          id: `cnt_ast_unit_${assertion.id}_${ev.id}`,
          claimId: claim.id,
          type: 'scope_conflict',
          statementA: assertion.statement,
          statementB: ev.extractedSnippet,
          sourceB: src,
          supportingEvidence: [],
          contradictingEvidence: [ev],
          contradictionConfidence: 65,
          reasoning: `Assertion uses unit (${assertion.unit}) while evidence uses (${evNum.unit}). Scope conversion or clarification required.`,
          resolutionStatus: 'unresolved',
          needsHumanReview: true
        };
      }

      if (assertion.numericValue !== evNum.numericValue) {
        return {
          id: `cnt_ast_num_${assertion.id}_${ev.id}`,
          claimId: claim.id,
          type: 'numerical',
          statementA: assertion.statement,
          statementB: ev.extractedSnippet,
          sourceB: src,
          supportingEvidence: [],
          contradictingEvidence: [ev],
          contradictionConfidence: 85,
          reasoning: `Assertion claims value ${assertion.numericValue}, but evidence states ${evNum.numericValue}.`,
          resolutionStatus: 'unresolved',
          needsHumanReview: true
        };
      }
    }

    return null;
  }

  private isDirectNegation(textA: string, textB: string): boolean {
    const aNorm = textA.toLowerCase();
    const bNorm = textB.toLowerCase();

    const negationPairs = [
      ['is effective', 'is ineffective'],
      ['was proven', 'was disproven'],
      ['increases', 'decreases'],
      ['causes', 'does not cause'],
      ['سەلمێنراوە', 'نەسەلمێنراوە'],
      ['زیاد دەکات', 'کەم دەکات']
    ];

    for (const [pos, neg] of negationPairs) {
      if ((aNorm.includes(pos) && bNorm.includes(neg)) || (aNorm.includes(neg) && bNorm.includes(pos))) {
        return true;
      }
    }

    return false;
  }

  private extractMainAction(text: string): string | null {
    const lower = text.toLowerCase();
    if (lower.includes('founded') || lower.includes('دامەزرا')) return 'founded';
    if (lower.includes('registered') || lower.includes('تۆمارکرا')) return 'registered';
    if (lower.includes('published') || lower.includes('بڵاوکرایەوە')) return 'published';
    if (lower.includes('established') || lower.includes('دەمەزراوە')) return 'established';
    return null;
  }
}
