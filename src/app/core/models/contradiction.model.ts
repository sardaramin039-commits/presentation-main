import { ProvenanceChain } from './provenance.model';

export type ContradictionType =
  | 'conflicting_claims'
  | 'opposing_studies'
  | 'publication_date_gap'
  | 'methodological_disagreement'
  | 'differing_definitions';

export interface ContradictionItem {
  id: string;
  claimAId?: string;
  claimBId?: string;
  sourceAId: string;
  sourceBId: string;
  sourceATitle: string;
  sourceBTitle: string;
  type: ContradictionType;
  explanationKurdish: string;
  severity: 'high' | 'moderate' | 'low';
  provenance: ProvenanceChain;
}

export interface ContradictionGraphNode {
  id: string;
  label: string;
  type: 'claim' | 'source' | 'evidence';
}

export interface ContradictionGraphEdge {
  fromId: string;
  toId: string;
  relation: 'contradicts' | 'conflicts_with' | 'opposes';
}

export interface ContradictionGraph {
  nodes: ContradictionGraphNode[];
  edges: ContradictionGraphEdge[];
  items: ContradictionItem[];
  hasUnresolvedContradictions: boolean;
}
