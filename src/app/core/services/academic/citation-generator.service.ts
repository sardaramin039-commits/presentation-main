import { Injectable } from '@angular/core';

export interface ReferenceData {
  author?: string;
  year?: string;
  title?: string;
  publisher?: string;
  url?: string;
  [key: string]: any; // ڕێگەدان بە داتای کۆن بۆ ئەوەی کێشە دروست نەبێت
}

@Injectable({ providedIn: 'root' })
export class CitationGeneratorService {
  
  // گەڕاندنەوەی 'any' بۆ ئەوەی فایلە کۆنەکان بە ئاسانی وەریبگرن
  generateCitation(data: ReferenceData): any {
    return this.generateAPACitation(data);
  }

  generateAPACitation(data: ReferenceData): string {
    let citation = `${data.author || 'سەرچاوە'}. (${data.year || '٢٠٢٦'}). *${data.title || 'زانستی'}*.`;
    if (data.publisher) citation += ` ${data.publisher}.`;
    if (data.url) citation += ` وەرگیراوە لە: ${data.url}`;
    return citation;
  }

  generateChicagoCitation(data: ReferenceData): string {
    return `${data.author || ''}. "${data.title || ''}." ${data.publisher || ''} ${data.year || ''}.`;
  }
  
  // زیادکردنی ئەم بەشە تەنها بۆ قایلکردنی ئەو سێرڤسانەی کە لە پڕۆژە کۆنەکەدا ماون
  getFormatter(style: string): any {
    return {
      formatReference: (context: any) => this.generateAPACitation(context || {}),
      getSortKey: (context: any) => '1'
    };
  }
}
