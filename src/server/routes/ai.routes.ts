import { Router, Request, Response } from 'express';
import { GoogleGenAI, Type, GenerateContentResponse, GenerateContentParameters } from '@google/genai';
import { PromptInjectionDefense } from '../../app/core/utils/prompt-injection-defense.utils';

export const aiRouter = Router();

const VALID_ACADEMIC_LEVELS = ['qutabxana', 'bachelor', 'postgrad'] as const;
type ValidAcademicLevel = typeof VALID_ACADEMIC_LEVELS[number];

function sanitizeString(input: unknown, maxLength = 300): string {
  if (typeof input !== 'string') return '';
  return input.trim().slice(0, maxLength);
}

function sanitizeAcademicLevel(level: unknown): ValidAcademicLevel {
  const str = typeof level === 'string' ? level.trim() : '';
  if (VALID_ACADEMIC_LEVELS.includes(str as ValidAcademicLevel)) {
    return str as ValidAcademicLevel;
  }
  return 'bachelor';
}

function sanitizeSlideCount(count: unknown): number {
  const parsed = typeof count === 'number' ? count : parseInt(String(count), 10);
  if (isNaN(parsed)) return 6;
  return Math.max(3, Math.min(15, parsed));
}

function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes('GEMINI_API_KEY') || msg.includes('apiKey') || msg.includes('bearer')) {
      return 'کێشەیەک لە ڕێکخستنی کلیلەکانی ژیریی دەستکرددا هەیە.';
    }
    return msg;
  }
  return 'هەڵەیەکی نەزانراو لە ڕاژەکار ڕوویدا.';
}

function inspectAndBoundInput(rawInput: unknown, maxLength: number, tag: string): { blocked: boolean; text: string } {
  const cleanStr = sanitizeString(rawInput, maxLength);
  if (!cleanStr) return { blocked: false, text: '' };

  const check = PromptInjectionDefense.inspectAndSanitize(cleanStr);
  if (check.action === 'block') {
    return { blocked: true, text: '' };
  }
  return {
    blocked: false,
    text: PromptInjectionDefense.wrapUntrustedContent(check.sanitizedText, tag)
  };
}

let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env['GEMINI_API_KEY'];
    if (!key) {
      throw new Error('GEMINI_API_KEY is not defined. Please configure it in your Secrets panel.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: { 'User-Agent': 'mam-library-academic-engine' }
      }
    });
  }
  return aiInstance;
}

type GenerateParams = Omit<GenerateContentParameters, 'model'>;

async function generateContentWithRetry(params: GenerateParams): Promise<GenerateContentResponse> {
  // مۆدێلە فەرمی و ستانداردەکانی Gemini
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.5-pro'
  ];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const ai = getAI();
        const response = await ai.models.generateContent({
          ...params,
          model
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const isTransient =
          lastError.message.includes('503') ||
          lastError.message.includes('429') ||
          lastError.message.includes('UNAVAILABLE');

        if (!isTransient) break;
        await new Promise(resolve => setTimeout(resolve, attempt === 0 ? 800 : 1500));
      }
    }
  }

  let friendlyMsg = 'سێرڤەری ژیریی دەستکرد لە ئێستادا وەڵام ناداتەوە.';
  if (lastError?.message) {
    friendlyMsg += ` (${lastError.message})`;
  }
  throw new Error(friendlyMsg);
}

/**
 * 1. AI Presentation Generation Endpoint
 */
aiRouter.post('/generate-presentation', async (req: Request, res: Response) => {
  try {
    const rawTopic = req.body?.topic;
    const topic = sanitizeString(rawTopic, 300);
    if (!topic) {
      return res.status(400).json({ error: 'تکایە بابەتێک بنووسە (Topic is required)' });
    }

    const guardedTopic = inspectAndBoundInput(rawTopic, 300, 'presentation_topic');
    if (guardedTopic.blocked) {
      const reqId = (req as unknown as { requestId?: string }).requestId || 'unknown';
      return res.status(400).json({
        error: 'دەقی داواکراو نەشیاوە یان بەندەکانی ئاسایشی پشکنینی شکاندووە.',
        code: 'PROMPT_INJECTION_BLOCKED',
        requestId: reqId
      });
    }

    const level = sanitizeAcademicLevel(req.body?.academicLevel);
    const count = sanitizeSlideCount(req.body?.slideCount);

    // وەرگرتنی سەرچاوە ڕاستەقینەکانی بەکارهێنەر ئەگەر لە پانێڵی سەرچاوەکانەوە نێردرابن
    const providedSources: string[] = Array.isArray(req.body?.sources)
      ? req.body.sources.map((s: unknown) => sanitizeString(s, 250)).filter(Boolean).slice(0, 15)
      : [];

    const levelGuidance: Record<ValidAcademicLevel, string> = {
      qutabxana: 'ئاستی قوتابخانە: زمانی کوردیی سۆرانیی ڕوون، سادە و فێرکاری. خاڵەکان کورت و پڕمانا بن و وتەی پێشکەشکار وەکوو ڕوونکردنەوەی مامۆستایەکی دڵسۆز بێت بۆ قوتابییان.',
      bachelor: 'ئاستی زانکۆ (بەکالۆریۆس): زمانی ئەکادیمیی ستاندارد، پێناسەی زانستیی چەمکەکان، پۆلێنکاریی سیستماتیک و نموونەی ڕوونکەرەوە.',
      postgrad: 'ئاستی ماستەر و دکتۆرا: زمانی کوردیی باڵای ئەکادیمی، شیکردنەوەی ڕەخنەگرانە (Critical Analysis)، خستنەڕووی جیاوازیی قوتابخانە فیکری و تیۆرییەکان و وتەی پێشکەشکاری قووڵ هاوشێوەی سیمیناری دکتۆرا.'
    };

    const sourcesInstruction = providedSources.length > 0
      ? `تەنها پشت بەم سەرچاوە ڕاستەقینانە ببەستە کە لە خوارەوە دراون:\n${providedSources.map((s, i) => `${i + 1}. ${s}`).join('\n')}`
      : 'تەنها سەرچاوە و کتێبە کلاسیکی و ئەکادیمییە سەلمێنراو و ناسراوەکانی ئەم بوارە بنووسە. بە هیچ شێوەیەک ناوی کتێب، توێژەر، یان کۆدی DOI لە خۆتەوە هەڵمەبەستە (Zero Hallucination). ئەگەر سەرچاوەیەکی مسۆگەرت لەیاد نییە، خانەی sources بە بەتاڵی جێ بهێڵە.';

    const prompt = `تۆ پسپۆڕ و توێژەرێکی باڵای ئەکادیمی و ئەندازیاری پرێزنتەیشنی زانستیت.
ئەرکت دروستکردنی پرێزنتەیشنێکی زانستیی ئاستبەرزە بە زمانی کوردیی سۆرانیی ستاندارد دەربارەی ئەم تەوەرە:
${guardedTopic.text}

ژمارەی سلایدە داواکراوەکان: ${count} سلاید (دەبێت ڕێک ${count} سلاید بێت).
ئاستی ئەکادیمی و شێوازی نووسین:
${levelGuidance[level]}

ڕێنماییە زانستی و میتۆدۆلۆژییەکان:
١. قەدەغەکردنی دەقی قاڵبی: بە هیچ شێوەیەک دەقی بێمانا و گشتگیر مەنووسە. هەر خاڵێک (points) دەبێت تێزێکی زانستیی تەواو بێت لەگەڵ دانانی زاراوە زانستییەکان لە نێوان کەوانەدا.
٢. بنەمای ڕاستگۆیی ئامار و نەخشە (Data Integrity Guard):
   - تۆ خۆت بڕیار بدە ئایا ئەم تەوەرە تیۆری/ئەدەبی/شەرعی/مێژووییە (Qualitative) یان ئەزموونی/ئامارییە (Quantitative).
   - ئەگەر بابەتەکە تیۆری، فیکری، شەرعی یان ئەدەبی بوو: بە تەواوی قەدەغەیە ڕێژەی سەدی و ئاماری هەڵبەستراو بنووسیت و خانەی dataStats بە بەتاڵی جێ بهێڵە، و لە بری ئەوە visualLayout بکە بە 'comparison-table'، 'bento-grid' یان 'process-timeline'.
   - تەنها ئەگەر بابەتەکە ئاماری بوو و ژمارەی زانستیی ڕاستەقینە هەبوو، خانەی dataStats بەکار بهێنە.
٣. بنەمای سەرچاوەکان:
${sourcesInstruction}
٤. وتەی پێشکەشکار (speakerNotes): دەبێت ڕێک لەگەڵ ئاستی (${level}) بگونجێت و شیکردنەوەی خاڵەکانی سەر سلایدەکە بێت.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'ناونیشانی سەرەکیی پرێزنتەیشنەکە بە کوردیی ئەکادیمی' },
            slides: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  slideNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  subtitle: { type: Type.STRING },
                  points: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  speakerNotes: { type: Type.STRING },
                  visualSuggestion: { type: Type.STRING },
                  visualLayout: {
                    type: Type.STRING,
                    description: 'شێوازی نەخشەی سلاید: bento-grid, comparison-table, process-timeline, hero-split-image, stat-kpi-dashboard'
                  },
                  comparisonTable: {
                    type: Type.OBJECT,
                    properties: {
                      headers: { type: Type.ARRAY, items: { type: Type.STRING } },
                      rows: {
                        type: Type.ARRAY,
                        items: { type: Type.ARRAY, items: { type: Type.STRING } }
                      }
                    }
                  },
                  sources: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  dataStats: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        value: { type: Type.STRING },
                        change: { type: Type.STRING }
                      },
                      required: ['label', 'value']
                    }
                  }
                },
                required: ['slideNumber', 'title', 'points', 'speakerNotes', 'visualSuggestion', 'visualLayout']
              }
            }
          },
          required: ['title', 'slides']
        }
      }
    });

    if (!response.text) {
      throw new Error('هیچ وەڵامێک لە ژیریی دەستکردەوە نەهات.');
    }

    const data = JSON.parse(response.text.trim());
    return res.json({
      title: data.title || topic,
      topic,
      academicLevel: level,
      slides: data.slides || []
    });
  } catch (error: unknown) {
    console.error('Error generating presentation:', error);
    return res.status(502).json({ error: sanitizeErrorMessage(error) });
  }
});

/**
 * 2. Slide Refinement Endpoint
 */
aiRouter.post('/refine-slide', async (req: Request, res: Response) => {
  try {
    const rawSlide = req.body?.slide;
    const rawInstruction = req.body?.instruction;

    if (!rawSlide || !rawInstruction) {
      return res.status(400).json({ error: 'تکایە سلاید و ڕێنمایی چاککردنەکە دیاری بکە.' });
    }

    const guardedInstruction = inspectAndBoundInput(rawInstruction, 500, 'refinement_instruction');
    if (guardedInstruction.blocked) {
      return res.status(400).json({
        error: 'ڕێنماییەکە بەندەکانی ئاسایشی پشکنینی شکاندووە.',
        code: 'PROMPT_INJECTION_BLOCKED'
      });
    }

    // پاکژکردنەوەی خانەکانی سلاید پێش ناردنی بۆ ناو پرۆمپت
    const safeSlidePayload = {
      slideNumber: Number(rawSlide.slideNumber) || 1,
      title: sanitizeString(rawSlide.title, 200),
      subtitle: sanitizeString(rawSlide.subtitle, 200),
      points: Array.isArray(rawSlide.points) ? rawSlide.points.map((p: unknown) => sanitizeString(p, 400)).slice(0, 8) : [],
      speakerNotes: sanitizeString(rawSlide.speakerNotes, 1000),
      visualSuggestion: sanitizeString(rawSlide.visualSuggestion, 300),
      sources: Array.isArray(rawSlide.sources) ? rawSlide.sources.map((s: unknown) => sanitizeString(s, 250)).slice(0, 5) : []
    };

    const level = sanitizeAcademicLevel(req.body?.academicLevel);

    const prompt = `تۆ پسپۆڕێکی ئەکادیمیی پێشکەشکردنیت. تکایە ئەم سلایدەی خوارەوە بەپێی ڕێنمایی بەکارهێنەر دەستکاری بکە بە زمانی کوردیی سۆرانیی ستاندارد:

سلایدی ئێستا:
${JSON.stringify(safeSlidePayload, null, 2)}

ڕێنمایی بۆ دەستکاریکردن:
${guardedInstruction.text}

ئاستی ئەکادیمی: "${level}"
تێبینی: هیچ سەرچاوەیەکی وەهمی لە خۆتەوە زیاد مەکە.`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            slideNumber: { type: Type.INTEGER },
            title: { type: Type.STRING },
            subtitle: { type: Type.STRING },
            points: { type: Type.ARRAY, items: { type: Type.STRING } },
            speakerNotes: { type: Type.STRING },
            visualSuggestion: { type: Type.STRING },
            sources: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ['slideNumber', 'title', 'points', 'speakerNotes', 'visualSuggestion']
        }
      }
    });

    if (!response.text) {
      throw new Error('هیچ وەڵامێک لە ژیریی دەستکردەوە نەهات.');
    }

    const data = JSON.parse(response.text.trim());
    return res.json(data);
  } catch (error: unknown) {
    console.error('Error refining slide with AI:', error);
    return res.status(502).json({ error: sanitizeErrorMessage(error) });
  }
});

/**
 * 3. Summary Generation Endpoint
 */
aiRouter.post('/generate-summary', async (req: Request, res: Response) => {
  try {
    const rawTopic = req.body?.topic;
    if (!sanitizeString(rawTopic, 300)) {
      return res.status(400).json({ error: 'تکایە سەرەتا بابەتێک یان ناونیشانێک دیاری بکە.' });
    }

    const guardedTopic = inspectAndBoundInput(rawTopic, 300, 'summary_topic');
    if (guardedTopic.blocked) {
      return res.status(400).json({
        error: 'دەقی داواکراو نەشیاوە.',
        code: 'PROMPT_INJECTION_BLOCKED'
      });
    }

    const level = sanitizeAcademicLevel(req.body?.academicLevel);

    const prompt = `تۆ پسپۆڕێکی نووسینی ئەکادیمیت. کورتەیەکی زانستی (Executive Summary / Abstract) بە زمانی کوردیی سۆرانیی ستاندارد دەربارەی ئەم بابەتە بنووسە:
بابەت: ${guardedTopic.text}
ئاستی ئەکادیمی: "${level}"`;

    const response = await generateContentWithRetry({
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING, description: 'دەقی کورتە زانستییەکە بە کوردییەکی پاراو' }
          },
          required: ['summary']
        }
      }
    });

    if (!response.text) {
      throw new Error('هیچ وەڵامێک لە لایەن ژیریی دەستکردەوە دابین نەکرا.');
    }

    const data = JSON.parse(response.text.trim());
    return res.json({ summary: data.summary || '' });
  } catch (error: unknown) {
    console.error('Error generating summary:', error);
    return res.status(502).json({ error: sanitizeErrorMessage(error) });
  }
});

/**
 * 4. Image Generation Endpoint
 */
aiRouter.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const rawPrompt = req.body?.prompt;
    const cleanPrompt = sanitizeString(rawPrompt, 500);
    if (!cleanPrompt) {
      return res.status(400).json({ error: 'تکایە پێشنیاری وێنەکە بنووسە (Prompt is required)' });
    }

    const guardedPrompt = inspectAndBoundInput(rawPrompt, 500, 'image_prompt');
    if (guardedPrompt.blocked) {
      return res.status(400).json({ error: 'دەقی داواکراو ڕێگەپێنەدراوە.' });
    }

    try {
      const ai = getAI();
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002',
        prompt: cleanPrompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '16:9'
        }
      });

      const base64Bytes = response?.generatedImages?.[0]?.image?.imageBytes;
      if (!base64Bytes) {
        throw new Error('سیستەم داتا گرافیکییەکەی دانەمەزراند.');
      }

      return res.json({ imageBytes: base64Bytes, isFallback: false });
    } catch {
      const safeText = cleanPrompt.replace(/[<>&"']/g, '').slice(0, 50);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360" direction="rtl">
        <defs>
          <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0f172a"/>
            <stop offset="100%" stop-color="#0369a1"/>
          </linearGradient>
        </defs>
        <rect width="640" height="360" fill="url(#bgGrad)" rx="16"/>
        <circle cx="320" cy="150" r="50" fill="#38bdf8" opacity="0.2"/>
        <polygon points="320,120 350,170 290,170" fill="#38bdf8" opacity="0.6"/>
        <text x="320" y="235" font-family="system-ui, sans-serif" font-size="16" fill="#f8fafc" font-weight="600" text-anchor="middle">هێڵکاریی بینراوی ئەکادیمی</text>
        <text x="320" y="265" font-family="system-ui, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">${safeText}</text>
      </svg>`;

      const base64Bytes = Buffer.from(svg).toString('base64');
      return res.json({ imageBytes: base64Bytes, isFallback: true });
    }
  } catch (error: unknown) {
    return res.status(500).json({ error: sanitizeErrorMessage(error) });
  }
});
