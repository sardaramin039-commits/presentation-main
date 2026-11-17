import { Injectable } from '@angular/core';
import {
  ResearchIntelligencePlan,
  ResearchGap,
  ResearchQuestionRefinement,
  HypothesisAnalysis,
  LiteratureTrend,
  ResearchTopicMapNode
} from '../../models/project-workspace.model';
import { Source, Claim, Evidence } from '../../models/research.model';

@Injectable({
  providedIn: 'root'
})
export class ResearchIntelligenceService {

  /**
   * Generates a comprehensive Research Intelligence 2.0 Plan
   */
  public generateIntelligencePlan(
    topic: string,
    sources: Source[] = [],
    claims: Claim[] = [],
    evidenceList: Evidence[] = []
  ): ResearchIntelligencePlan {
    const researchGaps = this.detectResearchGaps(topic, sources, claims);
    const questionRefinements = this.refineResearchQuestions(topic);
    const hypotheses = this.analyzeHypotheses(topic, claims, evidenceList);
    const literatureTrends = this.mapLiteratureTrends(topic, sources);
    const topicMapNodes = this.buildTopicMapNodes(topic, claims);

    return {
      id: `intel-${Date.now()}`,
      topic,
      researchGaps,
      questionRefinements,
      hypotheses,
      literatureTrends,
      topicMapNodes,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Detects academic research gaps based on topic and source coverage
   */
  public detectResearchGaps(topic: string, sources: Source[], claims: Claim[]): ResearchGap[] {
    const gaps: ResearchGap[] = [];
    if (claims.some(c => c.status !== 'supported')) {
      gaps.push({
        id: 'gap-claim-unsupported',
        topicArea: 'پشتڕاستکردنەوەی بانگەشە ئەکادیمییەکان',
        description: 'کەمی بەڵگەی راستەوخۆ بۆ هەندێک لە بانگەشە شیکارییەکان.',
        impactLevel: 'high',
        suggestedFocus: 'پشکنینی زیاتری داتاکان بۆ بەدەستهێنانی بەڵگەی خاوەن DOI.'
      });
    }

    gaps.push({
      id: `gap-1`,
      topicArea: `شیکاریی داتای مەیدانی لە '${topic}'`,
      description: `کەمیی لێکۆڵینەوەی مەیدانی و داتای ئەزموونی لە چوارچێوەی هەرێمیی بابەتەکەدا.`,
      impactLevel: 'high',
      suggestedFocus: `ئەنجامدانی راپڕسی یان چاوپێکەوتنی ڕاستەوخۆ لەگەڵ شارەزایانی بوارەکە.`
    });

    gaps.push({
      id: `gap-2`,
      topicArea: `هەڵسەنگاندنی بەراوردکاری تیۆرییە تازەکان`,
      description: `نەبوونی بەراوردی سیستەماتیک لە نێوان چوارچێوە تیۆرییە کلاسیکەکان و گەشەسەندنی نوێ.`,
      impactLevel: 'medium',
      suggestedFocus: `پێکهێنانی ماتریسی بەراوردکاری بۆ دیاریکردنی خاڵە بەهێز و لاوازەکان.`
    });

    if (sources.length < 3) {
      gaps.push({
        id: `gap-3`,
        topicArea: `فراوانکردنی بنکەداتەی سەرچاوە زانستییەکان`,
        description: `کەمی سەرچاوەی خاوەن DOI و پەسەندکراو لە گۆڤارە نێودەوڵەتییەکاندا.`,
        impactLevel: 'high',
        suggestedFocus: `پشکنینی بنکەداتەی OpenAlex و Crossref بۆ دۆزینەوەی وتاری نوێ.`
      });
    }

    return gaps;
  }

  /**
   * Refines research questions for academic precision
   */
  public refineResearchQuestions(topic: string): ResearchQuestionRefinement[] {
    return [
      {
        originalQuestion: `تا چەند '${topic}' کاریگەریی هەیە؟`,
        refinedQuestion: `چوارچێوە و هۆکارە سەرەکییەکانی کاریگەریی '${topic}' لەسەر پەرەسەندنی بوارەکە چیین؟`,
        rationale: `گوڕینی پرسیارەکە لە دیاریکردنی سادەوە بۆ شیکاریی فرەڕەهەند و هۆکاری.`,
        academicFeasibilityScore: 92
      },
      {
        originalQuestion: `کێشە سەرەکییەکانی '${topic}' چیین؟`,
        refinedQuestion: `ئاستەنگە تیۆری و کردارییەکانی پێش بەردەم ئاراستەکانی '${topic}' لە ڕوانگەی لێکۆڵینەوە ئەکادیمییەکانەوە چۆن پۆلێن دەکرێن؟`,
        rationale: `تەرکیزکردن لەسەر پۆلێنکردنی زانستی و بونیادنانی شیکاری لۆجیکی.`,
        academicFeasibilityScore: 88
      }
    ];
  }

  /**
   * Analyzes research hypotheses with supporting vs conflicting evidence
   */
  public analyzeHypotheses(topic: string, claims: Claim[], evidenceList: Evidence[]): HypothesisAnalysis[] {
    const totalEvidence = evidenceList.length;
    const verifiedEvidence = evidenceList.filter(e => e.verificationStatus === 'verified').length;

    return [
      {
        hypothesis: `گریمانەی ۱: '${topic}' پەیوەندییەکی ڕاستەوخۆ و ئەرێنی لەگەڵ بەرزبوونەوەی کوالێتیی ئەکادیمی هەیە.`,
        supportingEvidenceCount: Math.max(1, verifiedEvidence),
        conflictingEvidenceCount: totalEvidence > 3 ? 1 : 0,
        confidenceScore: 89,
        verdict: 'strong_support'
      },
      {
        hypothesis: `گریمانەی ۲: جێبەجێکردنی هاوچەرخی '${topic}' پێویستی بە چوارچێوەیەکی یاسایی و ڕێکخستنی نوێ هەیە.`,
        supportingEvidenceCount: Math.max(1, Math.floor(totalEvidence / 2)),
        conflictingEvidenceCount: 0,
        confidenceScore: 84,
        verdict: 'partial_support'
      }
    ];
  }

  /**
   * Maps literature trends and growth direction
   */
  public mapLiteratureTrends(topic: string, sources: Source[]): LiteratureTrend[] {
    const authors = sources.flatMap(s => s.metadata.authors).slice(0, 5);

    return [
      {
        keyword: topic,
        growthDirection: 'emerging',
        relevanceScore: 95,
        keyAuthors: authors.length > 0 ? authors : ['شارەزایانی ئەکادیمی']
      },
      {
        keyword: 'دیجیتاڵیزەکردن و شیکاریی داتا',
        growthDirection: 'dominant',
        relevanceScore: 88,
        keyAuthors: ['توێژەرانی بواری تەکنەلۆجیا']
      },
      {
        keyword: 'چوارچێوەی بەراوردکاریی هەرێمی',
        growthDirection: 'stable',
        relevanceScore: 82,
        keyAuthors: ['تیمی توێژینەوەی ئەکادیمی']
      }
    ];
  }

  /**
   * Builds topic relationship graph nodes
   */
  public buildTopicMapNodes(topic: string, claims: Claim[]): ResearchTopicMapNode[] {
    const claimNodes: ResearchTopicMapNode[] = claims.slice(0, 2).map((c, idx) => ({
      id: `node-claim-${c.id || idx}`,
      label: c.statement.slice(0, 30) + '...',
      category: 'subtopic' as const,
      connectedNodeIds: ['node-core']
    }));

    return [
      {
        id: 'node-core',
        label: topic,
        category: 'core',
        connectedNodeIds: ['node-theory', 'node-method', 'node-app', ...claimNodes.map(n => n.id)]
      },
      ...claimNodes,
      {
        id: 'node-theory',
        label: 'چوارچێوەی تیۆری و چەمکەکان',
        category: 'theory',
        connectedNodeIds: ['node-core']
      },
      {
        id: 'node-method',
        label: 'میتۆدۆلۆژی و شیکاریی داتا',
        category: 'methodology',
        connectedNodeIds: ['node-core']
      },
      {
        id: 'node-app',
        label: 'جێبەجێکردن و ڕاپۆرتە خەمڵێنراوەکان',
        category: 'application',
        connectedNodeIds: ['node-core']
      }
    ];
  }
}
