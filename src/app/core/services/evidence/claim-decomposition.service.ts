import { Injectable } from '@angular/core';
import { Claim } from '../../models/research.model';
import { DecomposedAssertion } from '../../models/fact-check.model';

@Injectable({
  providedIn: 'root'
})
export class ClaimDecompositionService {
  /**
   * Decomposes complex claims into distinct atomic factual assertions.
   * E.g. "X was founded in 1990 and expanded in 2000" -> Assertion A (founded 1990), Assertion B (expanded 2000).
   */
  decomposeClaim(claim: Claim): DecomposedAssertion[] {
    const statement = claim.statement ? claim.statement.trim() : '';
    if (!statement) {
      return [];
    }

    // Split compound sentences by conjunctions ("and", "وە", ";", "و هەروەها")
    // Note: use unicode-safe boundary checking rather than ASCII-only \b
    const splitRegex = /(\band\b|;|(?:\s+|^)(?:وە|و هەروەها)(?:\s+|$))/i;
    const rawSplits = statement.split(splitRegex)
      .map(s => s.trim())
      .filter(s => s.length > 2 && !['and', 'وە', 'و هەروەها', ';'].includes(s.toLowerCase()));

    const clauses = rawSplits.length > 0 ? rawSplits : [statement];
    const assertions: DecomposedAssertion[] = [];

    clauses.forEach((clause, idx) => {
      const assertionType = this.detectAssertionType(clause);
      const { numericValue, unit } = this.extractNumericAndUnit(clause);
      const yearValue = this.extractYear(clause);

      assertions.push({
        id: `${claim.id}_ast_${idx + 1}`,
        originalClaimId: claim.id,
        statement: clause,
        assertionType,
        numericValue,
        unit,
        yearValue
      });
    });

    return assertions;
  }

  private detectAssertionType(text: string): 'date' | 'numerical' | 'fact' | 'attribution' | 'general' {
    if (this.extractYear(text) !== undefined) {
      return 'date';
    }
    if (this.extractNumericAndUnit(text).numericValue !== undefined) {
      return 'numerical';
    }
    if (/\b(according to|stated by|بەپێی|ئاماژەی داوە|وتوویەتی)\b/i.test(text)) {
      return 'attribution';
    }
    if (/\b(is|was|are|were|دەبێت|بوو|دەکات|دەکەن)\b/i.test(text)) {
      return 'fact';
    }
    return 'general';
  }

  /**
   * Extracts numerical values and their associated units (e.g., %, kg, lb, million, USD, IQD).
   */
  extractNumericAndUnit(text: string): { numericValue?: number; unit?: string } {
    // Match numbers with optional decimal, followed by units like %, kg, lb, km, m, USD, IQD, etc.
    const match = text.match(/(\d+(?:\.\d+)?)\s*(%|percent|kg|lb|km|m|USD|IQD|دۆلار|دینار|کگم|پاوەند)?/i);
    if (match && match[1]) {
      const numericValue = parseFloat(match[1]);
      // Avoid treating a 4-digit year as a generic numerical value if it looks like a year (1800-2099)
      if (numericValue >= 1800 && numericValue <= 2099 && !match[2]) {
        return {};
      }
      const rawUnit = match[2] ? match[2].toLowerCase() : undefined;
      let unit = rawUnit;
      if (rawUnit === 'percent') unit = '%';
      if (rawUnit === 'کگم') unit = 'kg';
      if (rawUnit === 'پاوەند') unit = 'lb';
      return { numericValue, unit };
    }
    return {};
  }

  /**
   * Extracts 4-digit years (e.g. 1990, 2023).
   */
  extractYear(text: string): number | undefined {
    const match = text.match(/\b(1[7-9]\d{2}|20\d{2})\b/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return undefined;
  }
}
