import { ClaimStatus, SourceVerificationStatus } from "./research.model";
import type {
  AcademicLevel,
  LayoutType,
  LayoutBounds,
  SlideType,
  SlidePlan,
  PresentationAudience,
  PresentationPurpose,
  DataVisualizationSpec,
  SlideImagePurpose
} from "./presentation.model";

// ==========================================
// BATCH 12 — VISUAL INTELLIGENCE & AUTOMATIC SLIDE VISUALIZATION ENGINE
// ==========================================

export type VisualType =
  | 'image'
  | 'chart'
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'scatter_plot'
  | 'area_chart'
  | 'timeline'
  | 'process'
  | 'flowchart'
  | 'comparison'
  | 'matrix'
  | 'table'
  | 'infographic'
  | 'map'
  | 'hierarchy'
  | 'cycle'
  | 'funnel'
  | 'equation'
  | 'diagram'
  | 'icon_group'
  | 'quote'
  | 'text_only';

export type VisualNecessity = 'required' | 'recommended' | 'optional' | 'not_needed';

export type VisualDataStatus = 'verified' | 'unverified_data' | 'data_missing';

export interface VisualEvidenceLink {
  visualId: string;
  claimId?: string;
  evidenceId?: string;
  sourceId?: string;
  citationId?: string;
  claimStatement?: string;
  evidenceSnippet?: string;
  verificationStatus: ClaimStatus | SourceVerificationStatus | 'verified' | 'partially_verified' | 'unverified' | 'unsupported';
  sourceTitle?: string;
}

export interface ChartSpecification {
  id: string;
  type: VisualType;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  series?: { name: string; values: (number | string)[] }[];
  categories?: string[];
  units?: string;
  source?: string;
  evidenceId?: string;
  citation?: string;
  accessibilityDescription: string;
  dataStatus: VisualDataStatus;
}

export interface DiagramSpecification {
  id: string;
  type: VisualType;
  title: string;
  nodes: { id: string; label: string; description?: string; type?: string }[];
  connections: { fromId: string; toId: string; label?: string }[];
  accessibilityDescription: string;
}

export interface TimelineSpecification {
  id: string;
  title: string;
  events: { id: string; dateOrEra: string; eventTitle: string; description?: string; evidenceId?: string }[];
  isChronological: boolean;
  accessibilityDescription: string;
}

export interface ComparisonSpecification {
  id: string;
  title: string;
  entities: string[];
  criteria: { criterionName: string; values: Record<string, string | number> }[];
  accessibilityDescription: string;
}

export interface TableSpecification {
  id: string;
  title: string;
  headers: string[];
  rows: (string | number)[][];
  caption?: string;
  accessibilityDescription: string;
  dataStatus: VisualDataStatus;
}

export interface ImageSpecification {
  id: string;
  subject: string;
  purpose: SlideImagePurpose | string;
  visualStyle: 'scientific_illustration' | 'historical_photo' | 'diagrammatic' | 'contextual_photo' | 'academic_schematic';
  aspectRatio: '16:9' | '4:3' | '1:1' | '3:2';
  composition: string;
  requiredElements: string[];
  prohibitedElements: string[];
  academicContext: string;
  sourceRequirement?: string;
  evidenceRequirement?: string;
  imageRequired: boolean;
  accessibilityDescription: string;
}

export interface VisualRequirement {
  slideNumber: number;
  necessity: VisualNecessity;
  primaryVisualType: VisualType;
  reason: string;
  confidence: number;
}

export interface VisualCandidate {
  type: VisualType;
  suitabilityScore: number;
  rationale: string;
  pros: string[];
  cons: string[];
}

export interface VisualIntent {
  slideNumber: number;
  informationType:
    | 'temporal'
    | 'numerical_comparison'
    | 'trend'
    | 'sequential_process'
    | 'comparison'
    | 'geographic'
    | 'hierarchical'
    | 'statistical_distribution'
    | 'conceptual_relationship'
    | 'textual_quote'
    | 'textual_definition';
  primaryVisualCandidate: VisualType;
  secondaryCandidates: VisualCandidate[];
  evidenceLinked: boolean;
}

export interface VisualDecision {
  slideNumber: number;
  decision: VisualType;
  necessity: VisualNecessity;
  reason: string;
  confidence: number;
  relatedContentIds: string[];
  relatedEvidenceIds: string[];
  alternativesConsidered: {
    type: VisualType;
    rejectedBecause: string;
  }[];
}

export interface VisualElement {
  id: string;
  type: VisualType;
  title: string;
  chartSpec?: ChartSpecification;
  diagramSpec?: DiagramSpecification;
  timelineSpec?: TimelineSpecification;
  comparisonSpec?: ComparisonSpecification;
  tableSpec?: TableSpecification;
  imageSpec?: ImageSpecification;
  evidenceLinks: VisualEvidenceLink[];
  altText: string;
  semanticDescription: string;
  accessibilityNotes: string;
}

export interface VisualComposition {
  slideNumber: number;
  layoutPattern: LayoutType | string;
  titleRegion: LayoutBounds;
  contentRegion: LayoutBounds;
  visualRegion: LayoutBounds;
  evidenceRegion?: LayoutBounds;
  footerRegion?: LayoutBounds;
  visualElements: VisualElement[];
  whitespacePct: number;
  cognitiveLoadStatus: 'balanced' | 'overloaded' | 'underutilized';
}

export interface DataVisualizationSpecification extends DataVisualizationSpec {
  chartSpecification?: ChartSpecification;
  evidenceLink?: VisualEvidenceLink;
  dataStatus: VisualDataStatus;
}

// ==========================================
// BATCH 13 — VISUAL DESIGN INTELLIGENCE & COMPOSITION
// ==========================================

export type VisualElementType =
  | 'text'
  | 'heading'
  | 'subheading'
  | 'image'
  | 'chart'
  | 'diagram'
  | 'table'
  | 'timeline'
  | 'comparison'
  | 'process'
  | 'quote'
  | 'metric'
  | 'icon'
  | 'shape'
  | 'citation'
  | 'reference';

export type VisualPriority = 'primary' | 'secondary' | 'tertiary' | 'background';

export type RecommendedChartType =
  | 'bar'
  | 'column'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'radar'
  | 'chartNotRecommended';

export type RecommendedImagePurpose =
  | 'illustration'
  | 'context'
  | 'historical'
  | 'scientific'
  | 'conceptual'
  | 'comparison'
  | 'background';

export type ImageRequirementStatus = 'imageRequired' | 'imageOptional' | 'imageNotRecommended';

export type CompositionLayoutType =
  | 'title'
  | 'title-content'
  | 'two-column'
  | 'three-column'
  | 'image-text'
  | 'text-image'
  | 'full-width-image'
  | 'chart-focused'
  | 'table-focused'
  | 'comparison'
  | 'timeline'
  | 'process'
  | 'quote'
  | 'metric'
  | 'mixed-content'
  | 'section-divider';

export interface VisualConstraint {
  minWidthPct: number;
  maxWidthPct: number;
  minHeightPct: number;
  maxHeightPct: number;
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
  nonOverlapping: boolean;
  withinCanvas: boolean;
  minFontSizePx?: number;
}

export interface LayoutRegion {
  id: string;
  name: string;
  bounds: LayoutBounds;
  zIndex: number;
  allowedElementTypes: VisualElementType[];
  assignedContentId?: string;
  assignedElementType?: VisualElementType;
}

export interface LayoutDefinition {
  layoutType: CompositionLayoutType;
  name: string;
  description: string;
  aspectRatio: '16:9' | '4:3';
  regions: LayoutRegion[];
  recommendedForSlideTypes: SlideType[];
}

export interface TypographyScale {
  titlePx: number;
  sectionTitlePx: number;
  bodyPx: number;
  captionPx: number;
  citationPx: number;
  fontFamily: string;
}

export interface SpacingScale {
  paddingPx: number;
  marginPx: number;
  gapPx: number;
  sectionGapPx: number;
}

export interface LayoutGridRules {
  columns: number;
  gutterPx: number;
  marginPx: number;
  safeZoneMarginPct: number;
}

export interface ShapeRules {
  borderRadiusPx: number;
  borderWidthPx: number;
  shadow: string;
}

export interface ChartRules {
  palette: string[];
  maxCategories: number;
  showGridLines: boolean;
  legendPosition: 'top' | 'bottom' | 'right' | 'none';
}

export interface ImageRules {
  defaultAspectRatio: '16:9' | '4:3';
  borderRadiusPx: number;
  captionStyle: 'subtle' | 'overlay' | 'inline';
}

export interface CitationRules {
  placement: 'footer' | 'inline' | 'sidebar';
  style: 'compact' | 'academic';
}

export interface HierarchyRules {
  headingWeight: number;
  bodyWeight: number;
  primaryContrastRatio: number;
}

export interface PresentationDesignSystem {
  typography: TypographyScale;
  spacing: SpacingScale;
  grid: LayoutGridRules;
  shapes: ShapeRules;
  charts: ChartRules;
  images: ImageRules;
  citations: CitationRules;
  hierarchy: HierarchyRules;
}

export interface VisualDesignValidationResult {
  valid: boolean;
  status: 'valid' | 'warning' | 'invalid';
  overflowDetected: boolean;
  collisionDetected: boolean;
  densityStatus: 'balanced' | 'overloaded' | 'underutilized';
  citationVisibilityPass: boolean;
  evidenceVisibilityPass: boolean;
  academicIntegrityPass: boolean;
  contentChangeRequired: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface VisualDesignRequest {
  topic: string;
  academicLevel: AcademicLevel;
  audienceProfile: PresentationAudience;
  presentationPurpose: PresentationPurpose;
  slidePlans: SlidePlan[];
  aspectRatio?: '16:9' | '4:3';
}

export interface VisualDesignPlan {
  presentationId: string;
  aspectRatio: '16:9' | '4:3';
  designSystem: PresentationDesignSystem;
  slideCompositions: VisualComposition[];
  validation: VisualDesignValidationResult;
  explainableDecisions: {
    slideNumber: number;
    layoutChosen: CompositionLayoutType;
    rationale: string;
    evidenceLinked: boolean;
  }[];
}

// ==========================================
// BATCH 14 — DATA VISUALIZATION & INFOGRAPHIC INTELLIGENCE
// ==========================================

export type DataClassificationType =
  | 'categorical'
  | 'ordinal'
  | 'quantitative'
  | 'continuous'
  | 'discrete'
  | 'temporal'
  | 'geographical'
  | 'relational'
  | 'hierarchical'
  | 'textual'
  | 'mixed';

export type ChartTypeSupported =
  | 'bar'
  | 'column'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'scatter'
  | 'bubble'
  | 'radar'
  | 'histogram'
  | 'stackedBar'
  | 'stackedColumn'
  | 'notRecommended';

export type InfographicType =
  | 'statisticHighlight'
  | 'processInfographic'
  | 'timelineInfographic'
  | 'comparisonInfographic'
  | 'hierarchyInfographic'
  | 'cycleInfographic'
  | 'conceptInfographic'
  | 'stepByStepInfographic';

export type ScientificDiagramType =
  | 'flow'
  | 'process'
  | 'hierarchy'
  | 'relationship'
  | 'cycle'
  | 'causeEffect'
  | 'conceptMap'
  | 'framework'
  | 'timeline';

export interface VisualizationField {
  name: string;
  dataType: DataClassificationType;
  sampleValues: (string | number)[];
  unit?: string;
  isNullable?: boolean;
}

export interface VisualizationDataset {
  id: string;
  title: string;
  fields: VisualizationField[];
  rows: Record<string, string | number>[];
  sourceEvidenceId?: string;
  sourceCitationId?: string;
}

export interface VisualizationProvenance {
  visualizationId: string;
  datasetId: string;
  evidenceId: string;
  sourceId: string;
  providerName: string;
  verificationStatus: 'verified' | 'unverified' | 'refuted';
  traceabilityPath: string;
}

export interface VisualizationMapping {
  field: string;
  channel: 'x' | 'y' | 'color' | 'size' | 'shape' | 'label' | 'facet';
  scaleType?: 'linear' | 'log' | 'ordinal' | 'time' | 'band';
  label?: string;
}

export interface VisualizationConstraint {
  maxCategories?: number;
  minDataPoints?: number;
  maxVariables?: number;
  requiresPositiveValues?: boolean;
  requiresTemporalSequence?: boolean;
  allowTruncatedAxis?: boolean;
}

export interface VisualizationRecommendation {
  chartType: ChartTypeSupported;
  infographicType?: InfographicType;
  diagramType?: ScientificDiagramType;
  confidenceScore: number;
  rationale: string;
  dataRequirementsSatisfied: boolean;
  limitations: string[];
  mappings: VisualizationMapping[];
}

export interface VisualizationValidationResult {
  valid: boolean;
  status: 'valid' | 'warning' | 'invalid';
  dataIntegrityPass: boolean;
  chartAppropriatenessPass: boolean;
  axisValidityPass: boolean;
  scaleValidityPass: boolean;
  provenancePass: boolean;
  citationPass: boolean;
  readabilityPass: boolean;
  accessibilityPass: boolean;
  visualComplexityPass: boolean;
  academicIntegrityPass: boolean;
  warnings: string[];
  errors: string[];
  recommendations: string[];
}

export interface VisualizationData {
  datasets: VisualizationDataset[];
  provenance: VisualizationProvenance[];
  rawTextContext?: string;
}

export interface VisualizationRequest {
  id: string;
  slideNumber: number;
  topic: string;
  academicLevel: AcademicLevel;
  contentBlockText: string;
  data: VisualizationData;
  goal?: 'comparison' | 'trend' | 'distribution' | 'composition' | 'relationship' | 'process';
}

export interface VisualizationPlan {
  id: string;
  slideNumber: number;
  recommendation: VisualizationRecommendation;
  provenance: VisualizationProvenance[];
  validation: VisualizationValidationResult;
  accessibleDescription: string;
  sourceCitationRequired: boolean;
  explainableReason: string;
}
