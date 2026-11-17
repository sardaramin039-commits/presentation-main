import { AcademicLevel } from '../../core/models/presentation.model';

export interface ResearchArticle {
  id: string;
  title: string;
  author: string;
  role: string;
  year: number;
  academicLevel: AcademicLevel;
  category: string;
  abstract: string;
  keyFindings: string[];
  citationsCount: number;
  doi: string;
  fullTextSnippet: string;
  suggestedSlideTopic: string;
  tags: string[];
  gradientTheme: string;
}

export interface PresentationShowcase {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  slidesCount: number;
  canvaBadge: string;
  author: string;
  academicLevel: AcademicLevel;
  previewSlides: {
    slideNumber: number;
    title: string;
    points: string[];
    speakerNote: string;
  }[];
}

export interface NavItem {
  id: 'home' | 'library' | 'citations' | 'presentations';
  label: string;
  icon: string;
  description: string;
}
