import { Injectable } from '@angular/core';
import {
  AudienceProfile,
  PresentationAudience,
  PresentationPurpose
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class PresentationAudienceService {
  /**
   * Generates a detailed Audience Profile based on target audience and academic level.
   */
  getAudienceProfile(
    audience: PresentationAudience,
    academicLevel = '🎓 زانکۆ - بەکالۆریۆس'
  ): AudienceProfile {
    const isPostgrad =
      academicLevel.includes('ماستەر') ||
      academicLevel.includes('دکتۆرا') ||
      audience === 'master' ||
      audience === 'doctoral' ||
      audience === 'postgraduate';

    const isSchool = academicLevel.includes('قوتابخانە') || audience === 'school';

    if (isSchool) {
      return {
        audience: 'school',
        terminologyStyle: 'simplified',
        explanationDepth: 'basic',
        evidenceDensity: 'low',
        slideComplexity: 'low',
        narrativeDepth: 'overview',
        citationDensity: 'minimal',
        expectedBackgroundKnowledge: 'none'
      };
    }

    if (isPostgrad) {
      return {
        audience: audience || 'postgraduate',
        terminologyStyle: 'specialized_academic',
        explanationDepth: 'exhaustive',
        evidenceDensity: 'high',
        slideComplexity: 'high',
        narrativeDepth: 'deep_analytical',
        citationDensity: 'heavy_academic',
        expectedBackgroundKnowledge: 'advanced'
      };
    }

    switch (audience) {
      case 'academic_conference':
      case 'thesis_defense':
        return {
          audience,
          terminologyStyle: 'advanced_technical',
          explanationDepth: 'rigorous',
          evidenceDensity: 'high',
          slideComplexity: 'high',
          narrativeDepth: 'deep_analytical',
          citationDensity: 'heavy_academic',
          expectedBackgroundKnowledge: 'expert'
        };

      case 'seminar':
      case 'professional':
        return {
          audience,
          terminologyStyle: 'advanced_technical',
          explanationDepth: 'rigorous',
          evidenceDensity: 'medium',
          slideComplexity: 'medium',
          narrativeDepth: 'detailed',
          citationDensity: 'standard',
          expectedBackgroundKnowledge: 'foundational'
        };

      case 'undergraduate':
      default:
        return {
          audience: 'undergraduate',
          terminologyStyle: 'standard',
          explanationDepth: 'moderate',
          evidenceDensity: 'medium',
          slideComplexity: 'medium',
          narrativeDepth: 'detailed',
          citationDensity: 'standard',
          expectedBackgroundKnowledge: 'foundational'
        };
    }
  }

  /**
   * Returns strategic presentation directives based on purpose and audience.
   */
  getPurposeDirectives(
    purpose: PresentationPurpose,
    audienceProfile: AudienceProfile
  ): {
    narrativeEmphasis: string;
    evidenceRequirement: string;
    slidePacingNotes: string;
  } {
    switch (purpose) {
      case 'thesis_defense':
        return {
          narrativeEmphasis: 'جەختکردنەوە لە سەر ڕەسەنایەتی میتۆدۆلۆژی، بەڵگەی سەلمێنراو، و لێکدانەوەی ئەنجامەکان',
          evidenceRequirement: 'تەواوی بانگەشەکان دەبێت بە ئاماژەی خێرا و سەرچاوەی پشتڕاستکراو بن',
          slidePacingNotes: 'سڵایدی هێواش بە تەرخانکردنی کاتی پێویست بۆ لایەنی زانستی و وەڵامدانەوەی پرسیار'
        };

      case 'academic_briefing':
        return {
          narrativeEmphasis: 'پوختەکردنی خێرای دەستکەوتە سەرەکییەکان و دەرئەنجامە بڕیاربەخشەکان',
          evidenceRequirement: 'بەڵگە بڕیاردەرەکان بە کورتی و بەبێ درێژدادڕی',
          slidePacingNotes: 'ڕیتمی خێرا بە ئامانجی پێشکەشکردنی زانیاری لە کاتێکی کورتدا'
        };

      case 'teaching':
        return {
          narrativeEmphasis: 'ڕوونکردنەوەی پلەبەپلەی چەمکە بنچینەییەکان بە نموونەی ڕوون',
          evidenceRequirement: 'بەستنەوەی چەمکەکان بە بەڵگەی مامناوەند بۆ تێگەیشتنی باشتر',
          slidePacingNotes: 'ڕیتمی ڕوون و لەسەرخۆ بە شوێنی گونجاو بۆ ڕوونکردنەوە'
        };

      case 'conference':
        return {
          narrativeEmphasis: 'خستنەڕووی نوێگەری و داهێنانی توێژینەوەکە بە جەخت لەسەر ئەنجامە سەرەکییەکان',
          evidenceRequirement: 'بەڵگەی بەهێز و کورت بۆ سەلماندنی نوێگەری توێژینەوەکە',
          slidePacingNotes: 'پێشکەشکردنی چڕ و سەرنجڕاکێش بەپێی کاتی ڕێگەپێدراوی کۆنفرانس'
        };

      case 'literature_review':
        return {
          narrativeEmphasis: 'بەراوردکاری و داڕشتنەوەی کەرەستە ئەکادیمییە بڵاوکراوەکان بە پێوەر و جیاوازییەکانیان',
          evidenceRequirement: 'چڕیی بەرزی ئاماژەدان و بەستنەوەی توێژەرانی پێشوو',
          slidePacingNotes: 'دابەشکردنی بابەتییانەی سڵایدەکان بۆ داپۆشینی هەموو لایەنەکان'
        };

      case 'research_presentation':
      case 'seminar':
      case 'project_presentation':
      default:
        return {
          narrativeEmphasis: 'ڕەوتی مەنتقی لە کێشەی توێژینەوەوە بەرەو میتۆد و دەرئەنجامەکان',
          evidenceRequirement: `بەڵگەی بەهێز بەپێی ئاستی ${audienceProfile.audience}`,
          slidePacingNotes: 'ڕیتمی هاوسەنگ بە هاوسەنگی لە نێوان شیکردنەوە و بەڵگەکان'
        };
    }
  }
}
