import { Injectable } from '@angular/core';
import {
  EvidenceGraph,
  EvidenceGraphNode,
  EvidenceGraphEdge
} from '../../models/project-workspace.model';
import { Claim, Evidence, Citation, Source } from '../../models/research.model';

@Injectable({
  providedIn: 'root'
})
export class EvidenceGraphService {

  /**
   * Constructs an Advanced Evidence Graph with complete Provenance Tracking
   */
  public buildEvidenceGraph(
    claims: Claim[] = [],
    evidenceList: Evidence[] = [],
    sources: Source[] = [],
    citations: Citation[] = []
  ): EvidenceGraph {
    const nodes: EvidenceGraphNode[] = [];
    const edges: EvidenceGraphEdge[] = [];

    // 1. Add Source & DOI Nodes
    sources.forEach((src) => {
      const srcNodeId = `node-src-${src.id}`;
      const srcConfidence = src.verificationResult?.confidence
        ? Math.round(src.verificationResult.confidence * (src.verificationResult.confidence <= 1 ? 100 : 1))
        : (src.metadata.doi ? 85 : 60);

      nodes.push({
        id: srcNodeId,
        type: 'source',
        label: src.metadata.title,
        subText: src.metadata.authors.join(', ') || 'نووسەری ئەکادیمی',
        confidenceScore: srcConfidence,
        status: src.verificationResult?.status === 'verified' ? 'verified' : 'unverified'
      });

      if (src.metadata.doi) {
        const doiNodeId = `node-doi-${src.id}`;
        nodes.push({
          id: doiNodeId,
          type: 'doi',
          label: `DOI: ${src.metadata.doi}`,
          confidenceScore: src.verificationResult?.status === 'verified' ? 95 : 75,
          status: 'verified'
        });

        edges.push({
          id: `edge-${doiNodeId}-${srcNodeId}`,
          sourceNodeId: doiNodeId,
          targetNodeId: srcNodeId,
          relationType: 'published_in',
          strength: 1.0
        });
      }
    });

    // 2. Add Claim Nodes
    claims.forEach((claim) => {
      const claimNodeId = `node-claim-${claim.id}`;
      const relatedEvidence = evidenceList.filter(e => e.claimId === claim.id);
      const isVerified = claim.status === 'supported' || relatedEvidence.some(e => e.verificationStatus === 'verified');
      const claimConfidence = isVerified ? 80 : 40;

      nodes.push({
        id: claimNodeId,
        type: 'claim',
        label: claim.statement,
        subText: `دۆخ: ${claim.status || 'ئەکادیمی'}`,
        confidenceScore: claimConfidence,
        status: isVerified ? 'verified' : 'unverified'
      });
    });

    // 3. Add Evidence Nodes & Edges
    evidenceList.forEach((ev) => {
      const evNodeId = `node-ev-${ev.id}`;
      const evConfidence = ev.confidenceScore
        ? Math.round(ev.confidenceScore * (ev.confidenceScore <= 1 ? 100 : 1))
        : (ev.verificationStatus === 'verified' ? 85 : 50);

      nodes.push({
        id: evNodeId,
        type: 'evidence',
        label: ev.extractedSnippet.slice(0, 60) + '...',
        subText: `جۆر: ${ev.evidenceType}`,
        confidenceScore: evConfidence,
        status: ev.verificationStatus === 'verified' ? 'verified' : 'unverified'
      });

      // Link Evidence -> Source
      if (ev.sourceId) {
        const srcNodeId = `node-src-${ev.sourceId}`;
        edges.push({
          id: `edge-${evNodeId}-${srcNodeId}`,
          sourceNodeId: evNodeId,
          targetNodeId: srcNodeId,
          relationType: 'derived_from',
          strength: 0.95
        });
      }

      // Link Evidence -> Claim
      if (ev.claimId) {
        const claimNodeId = `node-claim-${ev.claimId}`;
        edges.push({
          id: `edge-${evNodeId}-${claimNodeId}`,
          sourceNodeId: evNodeId,
          targetNodeId: claimNodeId,
          relationType: 'supports',
          strength: 0.9
        });
      }
    });

    // 4. Add Citation Nodes & Edges
    citations.forEach((cite) => {
      const citeNodeId = `node-cite-${cite.citationId}`;
      nodes.push({
        id: citeNodeId,
        type: 'citation',
        label: cite.inTextParenthetical || 'ئاماژەی سەرچاوە',
        confidenceScore: 95,
        status: 'verified'
      });

      if (cite.sourceId) {
        const srcNodeId = `node-src-${cite.sourceId}`;
        edges.push({
          id: `edge-${citeNodeId}-${srcNodeId}`,
          sourceNodeId: citeNodeId,
          targetNodeId: srcNodeId,
          relationType: 'cites',
          strength: 1.0
        });
      }
    });

    const verifiedNodes = nodes.filter(n => n.status === 'verified').length;
    const overallGraphConfidence = nodes.length > 0
      ? Math.round((verifiedNodes / nodes.length) * 100)
      : 100;

    return {
      nodes,
      edges,
      overallGraphConfidence
    };
  }
}
