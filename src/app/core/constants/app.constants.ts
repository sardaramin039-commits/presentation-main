import { SampleTopic } from '../models/presentation.model';

export const STORAGE_KEYS = {
  HISTORY: 'kurdish_presentation_history',
  AUTOSAVE: 'kurdish_pres_autosave',
  DAILY_COUNT: 'kurdish_pres_daily_count',
  PREMIUM_ACTIVE: 'kurdish_pres_premium_active',
  SUMMARY_PREFIX: 'kurdish_summary_',
};

export const TRIAL_CONFIG = {
  DAILY_LIMIT: 5,
  DEFAULT_DAILY_COUNT: 2,
};

export const SAMPLE_TOPICS: SampleTopic[] = [
  {
    topic: 'گەرمبوونی زەوی و قەیرانی ئاو لە باشووری کوردستان',
    level: 'postgrad',
    slideCount: 8,
    labelName: 'قەیرانی ئاو لە کوردستان',
    badge: 'ماستەر و دکتۆرا'
  },
  {
    topic: 'کاریگەریی تۆڕە کۆمەڵایەتییەکان لەسەر ئاستی خوێندنی قوتابییان',
    level: 'bachelor',
    slideCount: 6,
    labelName: 'تۆڕە کۆمەڵایەتییەکان و خوێندن',
    badge: 'زانکۆ (بەکالۆریۆس)'
  },
  {
    topic: 'ئاژەڵە کێوییە دەگمەنەکانی کوردستان و چۆنیەتی پاراستنیان',
    level: 'qutabxana',
    slideCount: 5,
    labelName: 'پاراستنی ژینگەی کوردستان',
    badge: 'قوتابخانە'
  },
  {
    topic: 'چەمکی دبلۆماسیەتی وزە و شوێنی کوردستان لە هاوکێشە نێودەوڵەتییەکاندا',
    level: 'postgrad',
    slideCount: 8,
    labelName: 'دبلۆماسیەتی وزەی کوردستان',
    badge: 'ماستەر و دکتۆرا'
  }
];

export const LOADING_STEPS = {
  GENERAL: 'دەستپێکردنی بزوێنەری زیرەک و داڕشتنی بیرۆکەکان...',
  TITLES: 'ئامادەکردنی ناونیشانەکان و دابەشکردنی لۆژیکی...',
  LEVEL_QUTABXANA: 'بەرگکردنی بابەتەکە بە زمانی شیرین و کورت بۆ ئاستی قوتابخانە...',
  LEVEL_POSTGRAD: 'گەڕان بەدوای کێشە، کەلێنە زانستییەکان و دۆزینەوەی سەرچاوە متمانەپێکراوەکان بۆ ماستەر و دکتۆرا...',
  LEVEL_BACHELOR: 'داڕشتنی چەمکە زانستییەکان و چارتە پێویستەکان بۆ خوێندنی زانکۆ...',
  REVIEW: 'پێداچوونەوەی ڕێنووس و فۆرماتکردنی دەقی کوردی...',
  NOTES: 'ئامادەکردنی تێبینییەکانی پێشکەشکار و پێشنیارە بینراوەکان بۆ هەر سلایدێک...'
};
