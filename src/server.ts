import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { GoogleGenAI } from '@google/genai';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');

  server.use(express.json());

  // دانانی زیرەکی دەستکرد ڕاستەوخۆ لەناو سێرڤەرەکەدا بۆ ڕێگریکردن لە کێشەی SSR
  const apiKey = process.env['GOOGLE_AI_STUDIO_API_KEY'] || '';
  const ai = new GoogleGenAI({ apiKey });

  server.post('/api/generate-presentation', async (req: any, res: any) => {
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

  // ناردنی فایلەکانی ئەنگولار بەبێ کێشە
  server.get('*.*', express.static(browserDistFolder, { maxAge: '1y' }));
  server.get('*', (req: any, res: any) => {
    res.sendFile(join(browserDistFolder, 'index.html'));
  });

  return server;
}

const run = () => {
  const port = process.env['PORT'] || 3000;
  const server = app();
  server.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
};

run();
export const reqHandler = app();
