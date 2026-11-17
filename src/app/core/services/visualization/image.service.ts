import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  async generateAIImage(prompt: string): Promise<string> {
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.imageBytes) {
          return data.imageBytes;
        }
      }
    } catch (err) {
      console.warn('Image fetch encountered error, generating fallback SVG:', err);
    }

    const safePrompt = prompt.replace(/[<>&"]/g, '').slice(0, 45);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <defs>
        <linearGradient id="bgG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a"/>
          <stop offset="100%" stop-color="#0284c7"/>
        </linearGradient>
      </defs>
      <rect width="640" height="360" fill="url(#bgG)" rx="16"/>
      <circle cx="320" cy="150" r="48" fill="#38bdf8" opacity="0.2"/>
      <polygon points="320,120 350,170 290,170" fill="#38bdf8" opacity="0.6"/>
      <text x="320" y="235" font-family="system-ui, sans-serif" font-size="16" fill="#f8fafc" font-weight="600" text-anchor="middle">پێشنیاری بینراوی ئەکادیمی</text>
      <text x="320" y="265" font-family="system-ui, sans-serif" font-size="13" fill="#94a3b8" text-anchor="middle">${safePrompt}...</text>
    </svg>`;

    return btoa(unescape(encodeURIComponent(svg)));
  }
}
