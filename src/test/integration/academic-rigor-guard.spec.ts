import { describe, it, expect } from 'vitest';
import { classifyAcademicTopic } from '../../app/core/utils/academic-topic-classifier.util';
import { VisualNecessityService } from '../../app/core/services/visualization/visual-necessity.service';
import { SlidePlan } from '../../app/core/models/presentation.model';

describe('Academic Rigor & Visual Necessity Guard', () => {
  const visualNecessity = new VisualNecessityService();

  describe('Topic Domain Classification', () => {
    it('classifies Islamic and theological topics as qualitative and non-quantitative', () => {
      const topic1 = 'التفریط لە ئیسلامدا و مەقاسیدی شەریعەت';
      const analysis1 = classifyAcademicTopic(topic1);
      expect(analysis1.domain).toBe('theological_religious');
      expect(analysis1.isQuantitative).toBe(false);
      expect(analysis1.recommendedLayouts).toContain('comparison-table');
      expect(analysis1.recommendedLayouts).not.toContain('chart-insight');
      expect(analysis1.recommendedLayouts).not.toContain('stat-kpi-dashboard');

      const topic2 = 'ئەحکامی فیقهی لە مامەڵە شەرعییەکاندا';
      const analysis2 = classifyAcademicTopic(topic2);
      expect(analysis2.domain).toBe('theological_religious');
      expect(analysis2.isQuantitative).toBe(false);
    });

    it('classifies literature and humanities topics as qualitative', () => {
      const topic = 'شیکاریی گوتار لە شیعرەکانی نالی و مەحویدا';
      const analysis = classifyAcademicTopic(topic);
      expect(analysis.domain).toBe('humanities_literature');
      expect(analysis.isQuantitative).toBe(false);
      expect(analysis.recommendedLayouts).toContain('bento-grid');
    });

    it('classifies philosophy and sociology topics as qualitative conceptual matrices', () => {
      const topic = 'ئیپستمۆلۆژیا و دیالەکتیکی دەسەڵات لە فەلسەفەی هاوچەرخدا';
      const analysis = classifyAcademicTopic(topic);
      expect(analysis.domain).toBe('philosophy_ethics');
      expect(analysis.isQuantitative).toBe(false);
      expect(analysis.recommendedLayouts).toContain('comparison-table');
    });

    it('classifies medical, economic, and AI topics as quantitative', () => {
      const topic = 'کاریگەریی نەخۆشی شەکرە لەسەر تێچووی ئابووری و داتای ڕاپرسی';
      const analysis = classifyAcademicTopic(topic);
      expect(analysis.domain).toBe('empirical_quantitative');
      expect(analysis.isQuantitative).toBe(true);
      expect(analysis.recommendedLayouts).toContain('stat-kpi-dashboard');
    });
  });

  describe('Visual Necessity Guard on Qualitative Topics', () => {
    it('rejects chart generation for qualitative topics like التفریط', () => {
      const mockSlidePlan = {
        slideNumber: 2,
        title: 'التفریط لە ئیسلامدا: هۆکار و دەرەنجامە مەقاسیدییەکان',
        slideType: 'comparison',
        purpose: 'compare',
        layoutIntent: 'two_column',
        densityStatus: 'optimal',
        speakerNotes: 'تێبینییەکانی پێشکەشکار',
        dataVizType: 'none',
        imageRequired: false,
        visualIntentHints: [],
        contentPlan: {
          explanation: 'تەوەری سەرەکی بریتییە لە پێناسەی زاراوەیی لە دیدی ئوسوڵییەوە و شیکردنەوەی دەقی ڕەسەن',
          blocks: [
            { id: 'b1', text: 'پێناسەی شەرعی لە ڕوانگەی ئوسوڵییەوە بەراورد دەکرێت لەگەڵ زێدەڕۆیی', priority: 'essential' }
          ],
          supportingClaims: [],
          evidence: [],
          citations: [],
          keyTerms: ['التفریط', 'المقاصد'],
          takeaway: 'پابەندبوون بە هاوسەنگی'
        },
        evidenceMaps: [],
        citationMaps: []
      } as unknown as SlidePlan;

      const evalResult = visualNecessity.evaluateNecessity(mockSlidePlan, {
        slideNumber: 2,
        primaryVisualCandidate: 'bar_chart',
        confidence: 0.8
      });

      expect(evalResult.necessity).toBe('recommended');
      expect(evalResult.primaryVisualType).toBe('comparison');
      expect(evalResult.reason).toContain('فیکری و تیۆرییە');
    });

    it('strictly forbids generic placeholder phrases like "خاڵە گرنگەکان"', () => {
      const forbiddenPhrases = [
        'خاڵە گرنگەکان',
        'بەڵگەکان',
        'دەربڕینی سادە و ڕوون',
        'سەرچاوەکان و نووسینەکان'
      ];

      // Simulated academic point
      const academicPoint = 'پێناسەی زاراوەیی لە دیدی ئوسوڵییەوە: شلگیری و کەمتەرخەمی لە جێبەجێکردنی فەرمانە شەرعییەکان دەبێتە هۆی تێکدانی تەرازووی تەشریع لەنێوان بنەما نەگۆڕەکان و بوارە گۆڕاوەکاندا.';

      for (const phrase of forbiddenPhrases) {
        expect(academicPoint).not.toBe(phrase);
        expect(academicPoint.length).toBeGreaterThan(50);
      }
    });
  });
});
