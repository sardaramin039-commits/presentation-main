// ==========================================
// BATCH 15 — INTELLIGENT SLIDE DESIGN, VISUAL COMPOSITION & PPTX PRODUCTION ENGINE MODELS
// ==========================================

export type VisualIntentHint =
  | 'temporal'
  | 'timeline'
  | 'comparison'
  | 'process'
  | 'hierarchy'
  | 'quantitative_data'
  | 'quote'
  | 'evidence_card'
  | 'conceptual_diagram'
  | string;

export interface ColorToken {
  name: string;
  hex: string;
  rgb?: string;
  usage:
    | 'primary'
    | 'secondary'
    | 'accent'
    | 'background'
    | 'surface'
    | 'text'
    | 'mutedText'
    | 'border'
    | 'positive'
    | 'warning'
    | 'negative';
  contrastRatioAgainstBackground?: number;
}

export interface ThemeSpec {
  id: string;
  name: string;
  variant: 'light' | 'dark' | 'academic' | 'corporate' | 'creative';
  primaryColor: ColorToken;
  secondaryColor: ColorToken;
  accentColor: ColorToken;
  backgroundColor: ColorToken;
  surfaceColor: ColorToken;
  textColor: ColorToken;
  mutedTextColor: ColorToken;
  borderColor: ColorToken;
  fontFamilyTitle: string;
  fontFamilyBody: string;
}

export interface TypographySpec {
  language: 'ckb' | 'ar' | 'fa' | 'en' | string;
  direction: 'rtl' | 'ltr';
  titleFont: string;
  bodyFont: string;
  fontFallbackChain: string[];
  titleSizePt: number;
  subtitleSizePt: number;
  headingSizePt: number;
  bodySizePt: number;
  captionSizePt: number;
  citationSizePt: number;
  footnoteSizePt: number;
  tableSizePt: number;
  chartSizePt: number;
  lineHeightEm: number;
  overflowProtected: boolean;
}

export interface SpacingSpec {
  paddingInches: number;
  marginInches: number;
  itemGapInches: number;
  columnGapInches: number;
  safeMarginInches: number;
}

export interface SpeakerNote {
  slideNumber: number;
  notes: string;
  keyTalkingPoints?: string[];
  estimatedDurationSeconds?: number;
}

export interface AnimationSpec {
  elementId: string;
  type: 'fade' | 'appear' | 'wipe' | 'none';
  trigger: 'onClick' | 'afterPrevious' | 'withPrevious';
  durationMs: number;
  delayMs?: number;
  isSupportedInExport: boolean;
  unsupportedReason?: string;
}

export interface TransitionSpec {
  type: 'fade' | 'slide' | 'push' | 'wipe' | 'morph_intent' | 'none';
  durationMs: number;
  isSupportedInExport: boolean;
  unsupportedReason?: string;
}

export interface TextElement {
  id: string;
  type: 'title' | 'subtitle' | 'heading' | 'body' | 'bullet' | 'caption' | 'quote' | 'footnote';
  text: string;
  direction: 'rtl' | 'ltr';
  fontPt: number;
  fontWeight: 'normal' | 'bold' | '500' | '600' | '700';
  colorHex: string;
  align: 'left' | 'center' | 'right' | 'justify';
  bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
  bulletStyle?: string;
  claimId?: string;
  evidenceId?: string;
  citationId?: string;
}

export interface ImageElement {
  id: string;
  imageId: string;
  source: string;
  sourceType: 'generated' | 'repository' | 'uploaded' | 'verified_database' | 'unknown';
  originalUrl?: string;
  license: string;
  retrievedAt: string;
  altText: string;
  provenance: string;
  base64Data?: string;
  bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
  semanticPurpose: 'hero' | 'supporting' | 'comparison' | 'diagram' | 'illustration';
  aspectRatio: '16:9' | '4:3' | '1:1' | 'auto';
}

export interface ChartElement {
  id: string;
  chartType: 'bar' | 'column' | 'line' | 'area' | 'pie' | 'donut' | 'scatter' | 'stacked' | 'comparison';
  title: string;
  labels: string[];
  series: { name: string; values: number[] }[];
  units?: string;
  legendPosition: 'top' | 'bottom' | 'right' | 'left' | 'none';
  source: string;
  dataProvenance: string;
  hasRealData: boolean;
  evidenceId?: string;
  bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
}

export interface TableElement {
  id: string;
  title?: string;
  headers: string[];
  rows: (string | number)[][];
  bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
  source?: string;
  dataProvenance?: string;
}

export interface DiagramElement {
  id: string;
  diagramType: 'timeline' | 'process' | 'hierarchy' | 'matrix' | 'relationship';
  title: string;
  nodes: { id: string; label: string; subtext?: string }[];
  edges?: { fromId: string; toId: string; label?: string }[];
  bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
}

export interface ShapeElement {
  id: string;
  shapeType: 'rectangle' | 'rounded_rectangle' | 'circle' | 'line' | 'card';
  fillColorHex: string;
  borderColorHex?: string;
  borderWidthPt?: number;
  bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
}

export interface IconElement {
  id: string;
  iconName: string;
  colorHex: string;
  bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
}

export interface CitationElement {
  id: string;
  citationId: string;
  inTextCitation: string;
  fullReference: string;
  sourceId: string;
  traceableClaimId?: string;
  bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
  isReferenceSlide: boolean;
}

export type VisualElement =
  | { kind: 'text'; data: TextElement }
  | { kind: 'image'; data: ImageElement }
  | { kind: 'chart'; data: ChartElement }
  | { kind: 'table'; data: TableElement }
  | { kind: 'diagram'; data: DiagramElement }
  | { kind: 'shape'; data: ShapeElement }
  | { kind: 'icon'; data: IconElement }
  | { kind: 'citation'; data: CitationElement };

export type LayoutCategory =
  | 'title'
  | 'section_divider'
  | 'text_image'
  | 'two_column'
  | 'three_column'
  | 'timeline'
  | 'comparison'
  | 'process'
  | 'hierarchy'
  | 'matrix'
  | 'statistics'
  | 'chart'
  | 'table'
  | 'quote'
  | 'key_finding'
  | 'methodology'
  | 'conclusion'
  | 'references';

export interface VisualLayout {
  layoutCategory: LayoutCategory;
  name: string;
  explanation: string;
  columnCount: number;
  rtl: boolean;
  zones: {
    id: string;
    type: 'header' | 'main' | 'secondary' | 'visual' | 'footnote' | 'citation';
    bounds: { xPct: number; yPct: number; wPct: number; hPct: number };
  }[];
}

export interface DesignFinding {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category:
    | 'overflow'
    | 'clipping'
    | 'overlap'
    | 'contrast'
    | 'density'
    | 'accessibility'
    | 'consistency'
    | 'citation_collision';
  message: string;
  slideNumber: number;
  elementId?: string;
  autoRepaired?: boolean;
  repairDetails?: string;
}

export interface DesignValidationResult {
  slideNumber: number;
  passed: boolean;
  hasCriticalFailures: boolean;
  hasWarnings: boolean;
  findings: DesignFinding[];
  repairedFindings: DesignFinding[];
}

export interface SlideDesignSpec {
  slideNumber: number;
  title: string;
  layout: VisualLayout;
  elements: VisualElement[];
  speakerNotes: SpeakerNote;
  animations: AnimationSpec[];
  transition: TransitionSpec;
  theme: ThemeSpec;
  typography: TypographySpec;
  spacing: SpacingSpec;
  densityScore: number; // 0..100
  densityStatus: 'optimal' | 'spacious' | 'overloaded';
  densityWarning?: string;
  validation: DesignValidationResult;
}

export interface ExportSpecification {
  presentationId: string;
  title: string;
  aspectRatio: '16:9' | '4:3';
  slides: SlideDesignSpec[];
  theme: ThemeSpec;
  totalSlides: number;
  isEditable: boolean;
  language: 'ckb' | 'ar' | 'fa' | 'en' | string;
  metadata: {
    createdAt: string;
    academicLevel: string;
    author: string;
    provenancePreserved: boolean;
  };
}

export interface QualityGateResult {
  gateName:
    | 'Academic Integrity Gate'
    | 'Content Integrity Gate'
    | 'Citation Integrity Gate'
    | 'Visual Integrity Gate'
    | 'Accessibility Gate'
    | 'PPTX Export Gate';
  passed: boolean;
  hasCriticalFailures: boolean;
  findings: DesignFinding[];
  notes: string[];
}

export interface QualityGateSuiteResult {
  overallPassed: boolean;
  canExport: boolean;
  gates: QualityGateResult[];
  criticalFailuresCount: number;
  warningsCount: number;
}
