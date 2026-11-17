import {
  Source,
  Claim,
  Evidence,
  Citation,
  ResearchPlan,
  CitationStyle,
  ClaimStatus,
  SourceVerificationStatus
} from './research.model';
import { AcademicDocument } from './academic-writing.model';
import { VisualStory } from './visual-storytelling.model';

import { SlideLayoutType, SlideVisualData } from './slide-visual.model';

export type { SlideLayoutType, SlideVisualData };
export type AcademicLevel = 'qutabxana' | 'bachelor' | 'postgrad';
export type SlideTheme = 'cosmic' | 'sand' | 'emerald' | 'charcoal';
export type ExportTheme = 'professional' | 'academic' | 'creative';
export type TransitionStyle = 'fade' | 'slide' | 'push';
export type DetailTab = 'notes' | 'visual' | 'edit' | 'summary' | 'sources';

export interface SlideDataMetric {
  label: string;
  value: string;
  change?: string;
}

export interface Slide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  points: string[];
  bulletPoints?: string[];
  speakerNotes: string;
  visualSuggestion: string;
  aiImage?: string; // base64 JPEG representation
  imageUrl?: string;
  sources?: string[];
  citations?: string[];
  dataStats?: SlideDataMetric[];
  visualData?: SlideVisualData;
  table?: { headers: string[]; rows: string[][] };
}

export interface Presentation {
  id: string;
  title: string;
  topic: string;
  academicLevel: AcademicLevel;
  slides: Slide[];
  createdAt: string;
  transitionStyle?: TransitionStyle;
  annotations?: Record<number, string>;
}

export interface SampleTopic {
  topic: string;
  level: AcademicLevel;
  slideCount: number;
  labelName: string;
  badge: string;
}

export interface AutosaveState {
  presentation: Presentation;
  slideTheme: SlideTheme;
  exportTheme: ExportTheme;
  transitionStyle: TransitionStyle;
}

// ==========================================
// BATCH 10 — PRESENTATION INTELLIGENCE MODELS
// ==========================================

export type PresentationAudience =
  | 'school'
  | 'undergraduate'
  | 'postgraduate'
  | 'master'
  | 'doctoral'
  | 'academic_conference'
  | 'seminar'
  | 'thesis_defense'
  | 'professional';

export type PresentationPurpose =
  | 'teaching'
  | 'seminar'
  | 'research_presentation'
  | 'thesis_defense'
  | 'conference'
  | 'academic_briefing'
  | 'literature_review'
  | 'project_presentation';

export type ContentPriority = 'essential' | 'important' | 'supporting' | 'optional';

export type SlidePurpose =
  | 'introduce'
  | 'define'
  | 'contextualize'
  | 'compare'
  | 'explain'
  | 'demonstrate'
  | 'analyze'
  | 'presentEvidence'
  | 'presentFinding'
  | 'synthesize'
  | 'conclude'
  | 'recommend'
  | 'citeSources';

export type SlideType =
  | 'title'
  | 'agenda'
  | 'context'
  | 'definition'
  | 'research_question'
  | 'objectives'
  | 'methodology'
  | 'literature_review'
  | 'comparison'
  | 'evidence'
  | 'data'
  | 'finding'
  | 'analysis'
  | 'discussion'
  | 'conclusion'
  | 'recommendation'
  | 'reference'
  | 'appendix';

export type SlideLayoutIntent =
  | 'title_hero'
  | 'bullet_summary'
  | 'two_column'
  | 'three_column'
  | 'quote_highlight'
  | 'data_viz'
  | 'timeline'
  | 'process_steps'
  | 'matrix'
  | 'reference_list';

export type VisualIntentHint =
  | 'temporal'
  | 'timeline'
  | 'comparison'
  | 'process'
  | 'hierarchy'
  | 'relationship'
  | 'quantitative_data'
  | 'geographic'
  | 'quote'
  | 'definition'
  | 'evidence_card'
  | 'conceptual_diagram';

export type DataVizType =
  | 'bar_chart'
  | 'line_chart'
  | 'pie_chart'
  | 'table'
  | 'timeline'
  | 'comparison_matrix'
  | 'none';

export type SlideImagePurpose =
  | 'historical_context'
  | 'scientific_illustration'
  | 'geographic_context'
  | 'artifact'
  | 'person'
  | 'location'
  | 'conceptual_visual';

export interface AudienceProfile {
  audience: PresentationAudience;
  terminologyStyle: 'simplified' | 'standard' | 'advanced_technical' | 'specialized_academic';
  explanationDepth: 'basic' | 'moderate' | 'rigorous' | 'exhaustive';
  evidenceDensity: 'low' | 'medium' | 'high';
  slideComplexity: 'low' | 'medium' | 'high';
  narrativeDepth: 'overview' | 'detailed' | 'deep_analytical';
  citationDensity: 'minimal' | 'standard' | 'heavy_academic';
  expectedBackgroundKnowledge: 'none' | 'foundational' | 'advanced' | 'expert';
}

export interface PresentationRequest {
  topic: string;
  academicLevel: string;
  documentType?: string;
  researchType?: string;
  language?: 'ckb' | 'en' | 'ar' | string;
  targetAudience: PresentationAudience;
  presentationPurpose: PresentationPurpose;
  slideCount: number;
  presentationDuration: number; // minutes
  citationStyle?: CitationStyle | string;
  sourceRequirements?: {
    minPeerReviewed?: number;
    maxAgeYears?: number;
    requireDoi?: boolean;
  };
  visualPreference?: {
    theme?: SlideTheme | string;
    densityPreference?: 'spacious' | 'balanced' | 'dense';
  };
  institutionalContext?: {
    universityName?: string;
    department?: string;
    presenterName?: string;
    supervisorName?: string;
    date?: string;
  };
}

export interface PresentationContext {
  request: PresentationRequest;
  audienceProfile: AudienceProfile;
  academicDocument?: AcademicDocument;
  claims?: Claim[];
  evidenceList?: Evidence[];
  sources?: Source[];
  citations?: Citation[];
  researchPlan?: ResearchPlan;
}

export interface PresentationSection {
  id: string;
  title: string;
  purpose: string;
  targetSlideCount: number;
  slideIndices: number[];
}

export interface PresentationNarrative {
  id: string;
  title: string;
  audience: PresentationAudience;
  purpose: PresentationPurpose;
  coreThesis: string;
  keyTakeaways: string[];
  sections: PresentationSection[];
  totalTargetSlides: number;
}

export interface ContentBlock {
  id: string;
  text: string;
  priority: ContentPriority;
  type: 'heading' | 'bullet' | 'claim_statement' | 'evidence_quote' | 'statistic' | 'explanation' | 'takeaway';
  claimId?: string;
  evidenceId?: string;
  citationId?: string;
}

export interface SlideEvidenceMap {
  slideNumber: number;
  claimId: string;
  claimStatement: string;
  verificationStatus: ClaimStatus | SourceVerificationStatus | 'verified' | 'partially_verified' | 'unverified' | 'unsupported';
  evidenceId?: string;
  evidenceSnippet?: string;
  sourceId?: string;
  sourceTitle?: string;
  citationId?: string;
  formattedCitation?: string;
}

export interface SlideCitationMap {
  slideNumber: number;
  citationId: string;
  style: CitationStyle | string;
  inText: string;
  referenceId: string;
  fullReference: string;
  author?: string;
  year?: number;
  locator?: string;
  sourceId: string;
}

export interface SlideContentPlan {
  primaryClaim?: Claim;
  supportingClaims: Claim[];
  evidence: Evidence[];
  citations: Citation[];
  keyTerms: string[];
  explanation: string;
  takeaway: string;
  blocks: ContentBlock[];
}

export interface SlidePlan {
  slideNumber: number;
  title: string;
  purpose: SlidePurpose;
  slideType: SlideType;
  layoutIntent: SlideLayoutIntent;
  contentPlan: SlideContentPlan;
  evidenceMaps: SlideEvidenceMap[];
  citationMaps: SlideCitationMap[];
  densityStatus: 'optimal' | 'spacious' | 'overloaded';
  speakerNotes: string;
  visualIntentHints: VisualIntentHint[];
  dataVizType: DataVizType;
  dataVizDescription?: string;
  imageRequired: boolean;
  imagePurpose?: SlideImagePurpose;
  imageDescription?: string;
  traceabilityPath: string;
  points?: string[];
  visualSuggestion?: string;
}

export interface SlideValidationResult {
  slideNumber: number;
  isOverloaded: boolean;
  textLength: number;
  claimCount: number;
  evidenceCount: number;
  citationCount: number;
  warnings: string[];
  recommendations: string[];
}

export interface PresentationValidationResult {
  isValid: boolean;
  status: 'valid' | 'warnings' | 'blocked';
  missingCriticalContent: boolean;
  unsupportedClaimsCount: number;
  citationLossCount: number;
  evidenceLossCount: number;
  overloadedSlidesCount: number;
  repetitionCount: number;
  narrativeGapCount: number;
  slideValidationResults: SlideValidationResult[];
  warnings: string[];
  errors: string[];
}

export interface AcademicIntegrityGateResult {
  status: 'PASS' | 'PASS_WITH_WARNINGS' | 'BLOCKED';
  isPassed: boolean;
  traceableClaimsPercentage: number;
  preservedCitationsCount: number;
  preservedEvidenceCount: number;
  warnings: string[];
  blockingReasons: string[];
}

export interface PresentationPlan {
  id: string;
  title: string;
  request: PresentationRequest;
  context: PresentationContext;
  narrative: PresentationNarrative;
  slides: SlidePlan[];
  validation: PresentationValidationResult;
  integrityGate: AcademicIntegrityGateResult;
  visualStory?: VisualStory;
  createdAt: string;
}

// ==========================================
// BATCH 11 — PROFESSIONAL VISUAL DESIGN MODELS
// ==========================================

export type LayoutType =
  | 'title_only'
  | 'title_content'
  | 'two_column'
  | 'three_column'
  | 'comparison'
  | 'timeline'
  | 'process'
  | 'problem_solution'
  | 'image_text'
  | 'full_bleed_visual'
  | 'quote'
  | 'statistic'
  | 'chart'
  | 'table'
  | 'methodology'
  | 'conclusion'
  | 'references';

export type LayoutZoneType =
  | 'header'
  | 'subheader'
  | 'main_content'
  | 'secondary_content'
  | 'visual_container'
  | 'footnote'
  | 'citation_bar'
  | 'sidebar';

export interface LayoutBounds {
  topPct: number;
  leftPct: number;
  widthPct: number;
  heightPct: number;
}

export interface LayoutCapacity {
  maxWords?: number;
  maxBullets?: number;
  maxItems?: number;
}

export interface LayoutZone {
  id: string;
  name: string;
  type: LayoutZoneType;
  bounds: LayoutBounds;
  capacity: LayoutCapacity;
  contentIds: string[];
}

export interface SlideLayoutSpec {
  layoutType: LayoutType;
  zones: LayoutZone[];
  alignment: 'left' | 'center' | 'right' | 'justify';
  columnCount: number;
  contentCapacityScore: number; // 0 - 100
  visualEmphasisZone: string;
  rtl: boolean;
}

export interface VisualHierarchy {
  primaryMessage: string;
  secondaryMessage?: string;
  supportingEvidence?: string;
  supportingVisual?: string;
  metadataText?: string;
  focalPointZoneId: string;
  readingOrder: string[]; // array of zoneIds in order
  emphasisLevels: Record<string, 'high' | 'medium' | 'low' | 'muted'>;
  informationDensityScore: number; // 0 - 100

  supportingInformation?: string[];
  evidenceSnippet?: string;
  secondaryDetails?: string[];
  titleProminence?: 'high' | 'medium' | 'normal';
  sectionProminence?: 'high' | 'medium' | 'normal';
  bodyProminence?: 'normal' | 'muted';
  evidenceProminence?: 'high' | 'accent' | 'normal';
  citationProminence?: 'subtle' | 'footnote';
  visualProminence?: 'dominant' | 'balanced' | 'secondary';
}

export interface FontSpec {
  fontFamily: string;
  fontSizePx: number;
  fontWeight: number | string;
  lineHeightEm: number;
  letterSpacingEm: number;
  colorCss: string;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export interface TypographySpec {
  language: 'ckb' | 'ar' | 'fa' | 'en' | string;
  direction: 'rtl' | 'ltr';
  presentationTitle: FontSpec;
  slideTitle: FontSpec;
  sectionTitle: FontSpec;
  body: FontSpec;
  caption: FontSpec;
  citation: FontSpec;
  footnote: FontSpec;
  dataLabel: FontSpec;
  chartLabel: FontSpec;
  overflowProtected: boolean;
}

export interface ColorPaletteSpec {
  name: string;
  theme: SlideTheme | string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  positive: string;
  warning: string;
  negative: string;
  contrastRatioScore: number; // 0-100 or ratio
  academicAppropriatenessScore: number; // 0-100
}

export interface SpacingSpec {
  paddingPx: number;
  marginPx: number;
  itemGapPx: number;
  sectionGapPx: number;
  scaleFactor: number;
}

export interface GridGuide {
  type: 'vertical' | 'horizontal';
  positionPx: number;
}

export interface GridSpec {
  slideWidthPx: number;
  slideHeightPx: number;
  margins: { top: number; right: number; bottom: number; left: number };
  safeZone: { top: number; right: number; bottom: number; left: number };
  columns: number;
  columnWidthPx: number;
  gutterWidthPx: number;
  verticalRhythmPx: number;
  alignmentGuides: GridGuide[];
}

export type SuggestedVisualForm =
  | 'text_bullet'
  | 'diagram'
  | 'chart'
  | 'timeline'
  | 'comparison_card'
  | 'definition_card'
  | 'callout_box'
  | 'process_flow'
  | 'kpi_stat'
  | 'table';

export interface ContentVisualMapping {
  contentId: string;
  contentType: 'claim' | 'data' | 'process' | 'chronology' | 'comparison' | 'definition' | 'finding' | 'methodology' | 'general';
  suggestedVisualForm: SuggestedVisualForm;
  rationale: string;
  confidenceScore: number; // 0 - 1.0
}

export interface DataVizSeries {
  name: string;
  values: (number | string)[];
}

export interface DataVisualizationSpec {
  chartType: DataVizType;
  title: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
  series?: DataVizSeries[];
  categories?: string[];
  hasRealData: boolean;
  provenanceId?: string;
  recommendedWidthPct: number;
  recommendedHeightPct: number;
  isFactual: boolean;
}

export type ImageRole =
  | 'explanatory'
  | 'contextual'
  | 'decorative'
  | 'evidence'
  | 'conceptual'
  | 'background';

export interface ImagePlacementSpec {
  imageRequired: boolean;
  imageRole: ImageRole;
  placementZoneId: string;
  aspectRatio: '16:9' | '4:3' | '1:1' | '3:2' | 'custom';
  cropMode: 'cover' | 'contain' | 'fill' | 'none';
  visualPriority: 'high' | 'medium' | 'low';
  promptOrDescription: string;
  hasRealAsset: boolean;
  assetUrl?: string;
}

export interface ShapeSpec {
  id: string;
  type: 'rectangle' | 'rounded_rectangle' | 'circle' | 'arrow' | 'badge' | 'card' | 'divider';
  zoneId: string;
  backgroundColor: string;
  borderColor?: string;
  borderRadiusPx?: number;
  opacity: number;
}

export interface DesignConstraint {
  minReadableFontSizePx: number;
  maxTextWordsPerSlide: number;
  maxBulletsPerSlide: number;
  safeMarginPx: number;
  rtlCompatible: boolean;
  contrastThresholdRatio: number;
}

export type FindingSeverity = 'critical' | 'major' | 'moderate' | 'minor' | 'informational';

export type DesignFindingCategory =
  | 'overflow'
  | 'density'
  | 'hierarchy'
  | 'alignment'
  | 'contrast'
  | 'consistency'
  | 'missing_visual'
  | 'inappropriate_visual'
  | 'citation_visibility'
  | 'provenance_integrity';

export interface DesignFinding {
  id: string;
  slideNumber: number;
  category: DesignFindingCategory;
  severity: FindingSeverity;
  message: string;
  location: string;
  rationale: string;
  recommendation: string;
}

export interface DesignValidationResult {
  slideNumber: number;
  status: 'pass' | 'pass_with_warnings' | 'needs_revision' | 'critical_revision';
  overflowRisk: boolean;
  densityStatus: 'optimal' | 'spacious' | 'overloaded';
  contrastPass: boolean;
  hierarchyValid: boolean;
  citationVisible: boolean;
  provenanceIntact: boolean;
  findings: DesignFinding[];
}

export interface SlideDesignSpec {
  slideNumber: number;
  slideType: SlideType;
  layout: SlideLayoutSpec;
  visualHierarchy: VisualHierarchy;
  typography: TypographySpec;
  colorPalette: ColorPaletteSpec;
  spacing: SpacingSpec;
  grid: GridSpec;
  contentMappings: ContentVisualMapping[];
  dataVizSpec?: DataVisualizationSpec;
  imageSpec?: ImagePlacementSpec;
  shapes: ShapeSpec[];
  validation: DesignValidationResult;
}

export interface PresentationDesignPlan {
  id: string;
  presentationPlanId: string;
  title: string;
  slides: SlideDesignSpec[];
  overallConsistencyScore: number;
  overallValidationStatus: 'pass' | 'pass_with_warnings' | 'needs_revision' | 'critical_revision';
  findings: DesignFinding[];
  recommendations: string[];
  createdAt: string;
}

export * from "./visual-intelligence.model";
export type { VisualElement } from "./visual-intelligence.model";
export * from './slide-design.model';




