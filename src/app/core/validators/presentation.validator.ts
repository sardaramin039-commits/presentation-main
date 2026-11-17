import { Slide, SlideVisualData } from '../models/presentation.model';
import { GeneratePresentationResponse } from '../models/api.model';

export function validatePresentationResponse(data: unknown): GeneratePresentationResponse {
  if (typeof data !== 'object' || data === null) {
    throw new Error('وەڵامی AI داڕشتنێکی نادروستی هەیە.');
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj['title'] !== 'string' || !obj['title'].trim()) {
    throw new Error('ناونیشانی پرێزێنتەیشن نادیارە لە وەڵامی AI.');
  }

  if (typeof obj['topic'] !== 'string') {
    obj['topic'] = obj['title'];
  }

  const validLevels = ['qutabxana', 'bachelor', 'postgrad'];
  const level = typeof obj['academicLevel'] === 'string' && validLevels.includes(obj['academicLevel'])
    ? (obj['academicLevel'] as 'qutabxana' | 'bachelor' | 'postgrad')
    : 'bachelor';

  if (!Array.isArray(obj['slides']) || obj['slides'].length === 0) {
    throw new Error('هیچ سلایدێک نەدۆزرایەوە لە وەڵامی AI.');
  }

  const validatedSlides: Slide[] = obj['slides'].map((slideObj, index) => {
    return validateSlide(slideObj, index + 1);
  });

  return {
    title: obj['title'] as string,
    topic: obj['topic'] as string,
    academicLevel: level,
    slides: validatedSlides,
  };
}

export function validateSlide(data: unknown, fallbackIndex: number): Slide {
  if (typeof data !== 'object' || data === null) {
    throw new Error(`سلایدی ژمارە ${fallbackIndex} پێکهاتەیەکی نادروستی هەیە.`);
  }

  const obj = data as Record<string, unknown>;

  const slideNumber = typeof obj['slideNumber'] === 'number' ? obj['slideNumber'] : fallbackIndex;
  const title = typeof obj['title'] === 'string' && obj['title'].trim() ? obj['title'].trim() : `سلایدی ${fallbackIndex}`;
  
  let points: string[] = [];
  if (Array.isArray(obj['points'])) {
    points = obj['points'].map(p => String(p).trim()).filter(Boolean);
  }
  if (points.length === 0) {
    points = ['کۆبوونەوەی زانیارییەکان'];
  }

  const speakerNotes = typeof obj['speakerNotes'] === 'string' ? obj['speakerNotes'].trim() : '';
  const visualSuggestion = typeof obj['visualSuggestion'] === 'string' ? obj['visualSuggestion'].trim() : '';
  const aiImage = typeof obj['aiImage'] === 'string' ? obj['aiImage'] : undefined;
  const subtitle = typeof obj['subtitle'] === 'string' ? obj['subtitle'].trim() : undefined;
  const imageUrl = typeof obj['imageUrl'] === 'string' ? obj['imageUrl'].trim() : undefined;

  let sources: string[] | undefined = undefined;
  if (Array.isArray(obj['sources'])) {
    sources = obj['sources'].map(s => String(s).trim()).filter(Boolean);
  }

  let dataStats: { label: string; value: string; change?: string }[] | undefined = undefined;
  if (Array.isArray(obj['dataStats']) && obj['dataStats'].length > 0) {
    dataStats = obj['dataStats'].map(ds => {
      const dObj = ds as Record<string, unknown>;
      return {
        label: String(dObj['label'] || ''),
        value: String(dObj['value'] || ''),
        change: dObj['change'] ? String(dObj['change']) : undefined
      };
    }).filter(d => d.label && d.value);
  }

  // Preserve visualData or construct from visualLayout & comparisonTable
  let visualData = obj['visualData'] as Record<string, unknown> | undefined;
  if (!visualData && (obj['visualLayout'] || obj['comparisonTable'])) {
    visualData = {
      layout: obj['visualLayout'] || (obj['comparisonTable'] ? 'comparison-table' : 'bento-grid'),
      transition: 'fade',
      table: obj['comparisonTable']
    };
  }

  return {
    slideNumber,
    title,
    subtitle,
    points,
    speakerNotes,
    visualSuggestion,
    aiImage,
    imageUrl,
    sources,
    dataStats,
    visualData: visualData as unknown as SlideVisualData | undefined
  };
}
