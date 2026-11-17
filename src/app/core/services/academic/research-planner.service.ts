import { Injectable } from '@angular/core';
import { ResearchPlan, ResearchQuestion, SourceType } from '../../models/research.model';

@Injectable({
  providedIn: 'root'
})
export class ResearchPlannerService {

  createResearchPlan(topic: string, academicLevel = 'bachelor'): ResearchPlan {
    const sanitizedTopic = topic.trim();
    const planId = `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const questions = this.generateResearchQuestions(sanitizedTopic, academicLevel);
    const subtopics = this.generateSubtopics(sanitizedTopic, academicLevel);
    const keywords = this.extractBaseKeywords(sanitizedTopic);
    const alternativeKeywords = this.expandKeywords(keywords, academicLevel);
    const languageVariants = this.generateLanguageVariants(keywords);
    const targetSourceTypes = this.determineTargetSourceTypes(academicLevel);
    const searchStrategy = this.buildSearchStrategy(sanitizedTopic, academicLevel, keywords);

    return {
      id: planId,
      topic: sanitizedTopic,
      academicLevel,
      objective: `دیاریکردنی بنەما زانستییەکان، شیکردنەوەی سەرچاوە متمانەپێکراوەکان، و پۆلێنکردنی بەڵگەکان بۆ بابەتەکە: "${sanitizedTopic}"`,
      questions,
      subtopics,
      keywords,
      alternativeKeywords,
      languageVariants,
      targetSourceTypes,
      searchStrategy,
      createdAt: new Date().toISOString()
    };
  }

  private generateResearchQuestions(topic: string, level: string): ResearchQuestion[] {
    const levelPrefix = level === 'postgrad' ? 'بەراوردکاری و لێکۆڵینەوەی ڕەخنەیی' : level === 'bachelor' ? 'شیکردنەوە و بەڵگەهێنانەوە' : 'پێناسە و ناساندنی گشتی';

    return [
      {
        id: 'q1',
        question: `پێناسە، بنەما تیۆرییەکان، و چەمکە سەرەکییەکانی ${topic} چیین؟`,
        category: 'Background & Definitions',
        keywords: [topic, 'pênase', 'definition', 'overview', 'fundamentals']
      },
      {
        id: 'q2',
        question: `چێوەی ئەکادیمی و پێشینەی مێژوویی/زانستیی ${topic} چۆن پێشکەوتووە؟`,
        category: 'Theoretical Framework',
        keywords: [topic, 'history', 'literature review', 'framework']
      },
      {
        id: 'q3',
        question: `${levelPrefix}: دەستکەوتە سەرەکییەکان و ئالۆنگارییەکانی پەیوەندیدار بە ${topic} چیین؟`,
        category: 'Critical Analysis',
        keywords: [topic, 'challenges', 'analysis', 'impact', 'results']
      }
    ];
  }

  private generateSubtopics(topic: string, level: string): string[] {
    const base = [
      `چەمکە بنەڕەتییەکانی ${topic}`,
      `تەوەرەی سەرەکی و هۆکارەکانی ${topic}`,
      `کاریگەری و ئەنجامە ئەکادیمییەکانی ${topic}`
    ];

    if (level === 'postgrad' || level === 'bachelor') {
      base.push(`بەراوردکاری میتۆدۆلۆژی و شیکاریی زانستی بۆ ${topic}`);
    }

    return base;
  }

  private extractBaseKeywords(topic: string): string[] {
    const words = topic
      .split(/\s+/)
      .map(w => w.replace(/[^\w\u0600-\u06FF]/g, ''))
      .filter(w => w.length > 2);
    
    return Array.from(new Set([topic, ...words]));
  }

  private expandKeywords(baseKeywords: string[], level: string): string[] {
    const academicSuffixes = level === 'postgrad' 
      ? ['methodology', 'meta-analysis', 'empirical study', 'systematic review', 'critical analysis']
      : ['research', 'case study', 'overview', 'journal', 'analysis'];

    const expanded: string[] = [];
    for (const kw of baseKeywords) {
      for (const suffix of academicSuffixes) {
        expanded.push(`${kw} ${suffix}`);
      }
    }
    return expanded;
  }

  private generateLanguageVariants(keywords: string[]): Record<string, string[]> {
    return {
      ku: keywords,
      en: keywords.map(kw => `${kw} research`),
      ar: keywords.map(kw => `دراسة ${kw}`)
    };
  }

  private determineTargetSourceTypes(level: string): SourceType[] {
    if (level === 'postgrad') {
      return ['journal_article', 'book_chapter', 'thesis', 'conference_paper', 'report'];
    }
    if (level === 'bachelor') {
      return ['journal_article', 'book', 'conference_paper', 'report'];
    }
    return ['book', 'journal_article', 'report', 'webpage'];
  }

  private buildSearchStrategy(topic: string, level: string, keywords: string[]): string {
    const primaryKw = keywords.join(' OR ');
    return `فلتەرکردنی سەرچاوە ئەکادیمییەکان بە گوێرەی [${primaryKw}] - تەرکیز لەسەر ئاستی ${level} و پێوەری پێداچوونەوەی هاوتەمەنەکان (Peer-reviewed).`;
  }
}
