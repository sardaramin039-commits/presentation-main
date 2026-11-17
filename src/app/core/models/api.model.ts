import { AcademicLevel, Slide } from './presentation.model';

export interface GeneratePresentationRequest {
  topic: string;
  academicLevel: AcademicLevel;
  slideCount: number;
}

export interface GeneratePresentationResponse {
  title: string;
  topic: string;
  academicLevel: AcademicLevel;
  slides: Slide[];
}

export interface RefineSlideRequest {
  slide: Slide;
  instruction: string;
  academicLevel: AcademicLevel;
}

export interface GenerateSummaryRequest {
  topic: string;
  academicLevel: AcademicLevel;
}

export interface GenerateSummaryResponse {
  summary: string;
}

export interface GenerateImageRequest {
  prompt: string;
}

export interface GenerateImageResponse {
  imageBytes?: string;
  error?: string;
}
