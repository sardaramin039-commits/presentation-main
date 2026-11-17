export type VisualConceptType =
  | 'definition'
  | 'process'
  | 'chronology'
  | 'comparison'
  | 'cause_and_effect'
  | 'classification'
  | 'statistics'
  | 'relationship'
  | 'change'
  | 'argument';

export type VisualStrategyType =
  | 'concept_map'
  | 'flow'
  | 'timeline'
  | 'comparison_visual'
  | 'causal_diagram'
  | 'hierarchy'
  | 'data_story'
  | 'network'
  | 'before_after'
  | 'argument_map';

export type VisualNarrativeIntent =
  | 'introduce'
  | 'contextualize'
  | 'problem'
  | 'evidence'
  | 'analysis'
  | 'comparison'
  | 'findings'
  | 'interpretation'
  | 'conclusion';

export interface VisualEvidenceLink {
  evidenceId: string;
  sourceId: string;
  claimId: string;
  citationText: string;
  extractedSnippet: string;
  provenance: string;
  factual: boolean;
}

export interface VisualConcept {
  id: string;
  name: string;
  type: VisualConceptType;
  description: string;
  strategy: VisualStrategyType;
  evidenceLinks: VisualEvidenceLink[];
}

export interface VisualMetaphor {
  conceptName: string;
  metaphorName: string;
  explanation: string;
  preservesMeaning: boolean;
  visualCue: string;
}

export interface StoryTransition {
  fromSceneId: string;
  toSceneId: string;
  narrativeLink: string;
  logicalRelation: 'lead_in' | 'causal' | 'contrast' | 'elaboration' | 'conclusion';
}

export interface VisualScene {
  sceneId: string;
  slideNumber: number;
  title: string;
  narrativeIntent: VisualNarrativeIntent;
  concepts: VisualConcept[];
  metaphors: VisualMetaphor[];
  primaryVisualType: 'chart' | 'diagram' | 'timeline' | 'table' | 'image' | 'iconography' | 'no_visual';
  evidenceLinks: VisualEvidenceLink[];
  imageBrief?: {
    prompt: string;
    academicContext: string;
    culturallyAppropriate: boolean;
  };
}

export interface VisualSequence {
  scenes: VisualScene[];
  transitions: StoryTransition[];
}

export interface VisualStoryQualityScore {
  storyCoherence: number;
  visualRelevance: number;
  evidenceIntegrity: number;
  academicQuality: number;
  cognitiveClarity: number;
  consistency: number;
  overallScore: number;
  passed: boolean;
  warnings: string[];
}

export interface VisualStory {
  id: string;
  topic: string;
  sequence: VisualSequence;
  qualityScore: VisualStoryQualityScore;
  revised: boolean;
  createdAt: string;
}
