import { Router, Request, Response } from 'express';
import { GoogleGenAI } from '@google/genai';

export const researchRouter = Router();

// چارەسەری هەڵەی process.env بە بەکارهێنانی string ناچارکەر
const apiKey = process.env['GOOGLE_AI_STUDIO_API_KEY'] || '';
const ai = new GoogleGenAI({ apiKey });

researchRouter.post('/generate-presentation', async (req: Request, res: Response) => {
  try {
    const { topic, academicLevel = 'university' } = req.body;
    
    const systemPrompt = `You are an expert Kurdish Academic Professor. Create a rigorous academic presentation.
OUTPUT FORMAT: JSON with "title" and "slides" array. Each slide must have "title", "bullets" (max 4), "visualType", "citation", and "speakerNotes". Language: Central Kurdish (Sorani). NO hallucinations.`;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: `Create a rigorous academic presentation about: ${topic}. Academic Level: ${academicLevel}.`,
        config: {
            systemInstruction: systemPrompt,
            temperature: 0.1,
            responseMimeType: "application/json"
        }
    });

    res.json({ success: true, data: JSON.parse(response.text || '{}') });
  } catch (error) {
    console.error('[Academic Engine Error]:', error);
    res.status(500).json({ success: false, error: 'هەڵە لە دروستکردنی ناوەڕۆکی ئەکادیمی ڕوویدا' });
  }
});
