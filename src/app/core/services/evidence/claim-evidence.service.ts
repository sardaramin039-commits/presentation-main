import { Injectable, inject } from '@angular/core';
import {
  Claim,
  ClaimStatus,
  Evidence,
  EvidenceType,
  SourceVerificationStatus,
  ClaimEvidenceLink,
  Source,
  Citation,
  CitationStyle
} from '../../models/research.model';
import { CitationGeneratorService } from '../citation-generator.service';

export interface ClaimWithEvidence {
  claim: Claim;
  evidenceLinks: {
    link: ClaimEvidenceLink;
    evidence: Evidence;
    source: Source;
    citation?: Citation;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ClaimEvidenceService {
  private citationGenerator = inject(CitationGeneratorService);

  createClaim(statement: string, notes?: string): Claim {

    return {
      id: `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      statement: statement.trim(),
      status: 'unverified',
      notes
    };
  }

  createEvidence(
    sourceId: string,
    extractedSnippet: string,
    evidenceType: EvidenceType = 'direct',
    pageOrSection?: string,
    quotedText?: string,
    contextNote?: string,
    confidenceScore = 0.8,
    verificationStatus: SourceVerificationStatus = 'unverified'
  ): Evidence {
    const page = pageOrSection && pageOrSection.trim() ? pageOrSection.trim() : 'unknown';

    return {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sourceId,
      evidenceType,
      extractedSnippet: extractedSnippet.trim(),
      quotedText: quotedText?.trim(),
      location: { page },
      contextNote: contextNote?.trim(),
      confidenceScore: Math.max(0, Math.min(1.0, confidenceScore)),
      verificationStatus,
      provenance: {
        sourceProvider: 'ClaimEvidenceService',
        retrievalTimestamp: new Date().toISOString(),
        transformationHistory: [
          {
            timestamp: new Date().toISOString(),
            action: 'EVIDENCE_CREATED',
            actor: 'ClaimEvidenceService',
            details: `Page: ${page}, Type: ${evidenceType}`
          }
        ]
      }
    };
  }

  linkEvidenceToClaim(
    claimId: string,
    evidenceId: string,
    relevanceScore: number,
    explanation: string
  ): ClaimEvidenceLink {
    return {
      id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      claimId,
      evidenceId,
      relevanceScore: Math.max(0, Math.min(1.0, relevanceScore)),
      explanation: explanation.trim()
    };
  }

  evaluateClaimStatus(claimId: string, links: ClaimEvidenceLink[], evidenceItems: Evidence[], sources: Source[]): ClaimStatus {
    const claimLinks = links.filter(l => l.claimId === claimId);

    if (claimLinks.length === 0) {
      return 'unverified';
    }

    const linkedEvidence = claimLinks
      .map(link => {
        const ev = evidenceItems.find(e => e.id === link.evidenceId);
        if (!ev) return null;
        const src = sources.find(s => s.id === ev.sourceId);
        if (!src) return null;
        return { link, evidence: ev, source: src };
      })
      .filter((item): item is { link: ClaimEvidenceLink; evidence: Evidence; source: Source } => item !== null);

    if (linkedEvidence.length === 0) {
      return 'unverified';
    }

    // Check if all evidence is from rejected sources
    const allRejected = linkedEvidence.every(item => item.source.metadata.verificationStatus === 'rejected' || item.evidence.verificationStatus === 'rejected');
    if (allRejected) {
      return 'unsupported';
    }

    const validItems = linkedEvidence.filter(item => item.source.metadata.verificationStatus !== 'rejected' && item.evidence.verificationStatus !== 'rejected');
    if (validItems.length === 0) {
      return 'unsupported';
    }

    const strongVerifiedItems = validItems.filter(
      item => item.link.relevanceScore >= 0.7 &&
              (item.source.metadata.verificationStatus === 'verified' || item.evidence.verificationStatus === 'verified')
    );

    if (strongVerifiedItems.length >= 1) {
      return 'supported';
    }

    const partiallySupportedItems = validItems.filter(item => item.link.relevanceScore >= 0.5);
    if (partiallySupportedItems.length >= 1) {
      return 'partially_supported';
    }

    return 'unverified';
  }

  getClaimWithEvidenceTree(
    claim: Claim,
    links: ClaimEvidenceLink[],
    evidenceItems: Evidence[],
    sources: Source[],
    style: CitationStyle = 'APA7'
  ): ClaimWithEvidence {
    const claimLinks = links.filter(l => l.claimId === claim.id);
    const mappedLinks: ClaimWithEvidence['evidenceLinks'] = [];

    for (const link of claimLinks) {
      const ev = evidenceItems.find(e => e.id === link.evidenceId);
      if (!ev) continue;
      const src = sources.find(s => s.id === ev.sourceId);
      if (!src) continue;

      let citation: Citation | undefined;
      if (src.metadata.verificationStatus !== 'rejected') {
        citation = this.citationGenerator.generateCitation({
          source: src,
          claim,
          evidence: ev,
          style
        });
      }

      mappedLinks.push({
        link,
        evidence: ev,
        source: src,
        citation
      });
    }

    return {
      claim: {
        ...claim,
        status: this.evaluateClaimStatus(claim.id, links, evidenceItems, sources)
      },
      evidenceLinks: mappedLinks
    };
  }

}
