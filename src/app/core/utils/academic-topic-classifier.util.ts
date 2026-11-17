export type AcademicTopicDomain = 
  | 'theological_religious'  // شەرعی، ئیسلامی، عەقیدە، فیقهـ، مێژووی ئیسلامی
  | 'humanities_literature'  // ئەدەب، زمان، شیعر، سەفەرنامە، گێڕانەوەناسی
  | 'philosophy_ethics'      // فەلسەفە، ئەخلاق، هزر، فیکری سیاسی و کۆمەڵناسی
  | 'history_civilization'   // مێژوو، ڕووداوە مێژووییەکان، شوێنەوار
  | 'empirical_quantitative' // پزیشکی، ئابووری، تەکنەلۆجیا، ژینگە، زانستە ئەزموونییەکان
  | 'general_academic';      // بابەتی گشتیی زانستی

export interface TopicDomainAnalysis {
  domain: AcademicTopicDomain;
  isQuantitative: boolean;
  recommendedLayouts: ('bento-grid' | 'comparison-table' | 'process-timeline' | 'hero-split-image' | 'stat-kpi-dashboard' | 'chart-insight')[];
  rationale: string;
}

/**
 * شیکەرەوەی ژیرانەی سروشتی بابەتە ئەکادیمییەکان بۆ ڕێگریکردن لە داتای هەڵبەستراو
 */
export function classifyAcademicTopic(text: string): TopicDomainAnalysis {
  const normalized = (text || '').toLowerCase();

  // ١. بابەتە شەرعی و ئیسلامییەکان (Theological & Islamic Studies)
  const religiousKeywords = [
    'ئیسلام', 'شەریعەت', 'فیقه', 'تەفسیر', 'حەدیس', 'قورئان', 'تفریط', 'التفریط', 'إفراط', 'الإفراط',
    'سوننەت', 'مەقاسید', 'ئیجتیهاد', 'ئیمان', 'عەقیدە', 'شەرعی', 'پێغەمبەر', 'سەلەف', 'مەزهەب',
    'تەسەوف', 'حەرام', 'حەڵاڵ', 'فەتوای', 'کەلام', 'ئیلاهیات', 'ڕەوشت', 'تەوحید'
  ];
  if (religiousKeywords.some(kw => normalized.includes(kw))) {
    return {
      domain: 'theological_religious',
      isQuantitative: false,
      recommendedLayouts: ['comparison-table', 'bento-grid', 'process-timeline', 'hero-split-image'],
      rationale: 'ئەم بابەتە شەرعی و تیۆرییە؛ پێویستی بە بەراوردکاری چەمکەکان، پۆلێنکاری و بەڵگەی دەقی ڕەسەن هەیە، نەک چارت و ئاماری ژمارەیی.'
    };
  }

  // ٢. ئەدەب، زمانەوانی و گێڕانەوەناسی (Literature & Humanities)
  const literatureKeywords = [
    'ئەدەب', 'شیعر', 'ڕۆمان', 'سەفەرنامە', 'گێڕانەوە', 'میتۆلۆژیا', 'زمانەوانی', 'ڕەوانبێژی',
    'ڕەخنەی ئەدەبی', 'دەق', 'شاعیر', 'مەحوی', 'نالی', 'هێمن', 'گۆران', 'کلاسیک', 'مۆدێرنیزم'
  ];
  if (literatureKeywords.some(kw => normalized.includes(kw))) {
    return {
      domain: 'humanities_literature',
      isQuantitative: false,
      recommendedLayouts: ['bento-grid', 'hero-split-image', 'process-timeline', 'comparison-table'],
      rationale: 'ئەم بابەتە ئەدەبی و لێکۆڵینەوەی دەقییە؛ جەخت لەسەر گوتاری دەسەڵات، شیعرناسی و ڕەهەندە مێژووییەکان دەکاتەوە.'
    };
  }

  // ٣. فەلسەفە و فیکری سیاسی و کۆمەڵناسی (Philosophy & Theoretical Sociology)
  const philosophyKeywords = [
    'فەلسەفە', 'مەعریفە', 'ئیپستمۆلۆژیا', 'گوتار', 'دەسەڵات', 'کۆمەڵناسی', 'ئەخلاق', 'دیالەکتیک',
    'بوونیادگەری', 'مێتافیزیک', 'هۆشیاری', 'ئایدیۆلۆژیا', 'فۆکۆ', 'کانت', 'هیگڵ', 'ئەرستۆ'
  ];
  if (philosophyKeywords.some(kw => normalized.includes(kw))) {
    return {
      domain: 'philosophy_ethics',
      isQuantitative: false,
      recommendedLayouts: ['bento-grid', 'comparison-table', 'process-timeline', 'hero-split-image'],
      rationale: 'ئەم بابەتە فەلسەفی و ڕەخنەگرییە؛ پێویستی بە شیکردنەوەی چەمکسازی، دیالەکتیکی هزر و بەراوردی قووتابخانە فیکرییەکان هەیە.'
    };
  }

  // ٤. مێژوو و شارستانییەت (History)
  const historyKeywords = [
    'مێژوو', 'مێژووی', 'شۆڕش', 'میرنشین', 'سەدە', 'کۆن', 'سەردەم', 'مێزۆپۆتامیا', 'عوسمانی', 'بابان', 'ئەردەڵان', 'جەنگی'
  ];
  if (historyKeywords.some(kw => normalized.includes(kw))) {
    return {
      domain: 'history_civilization',
      isQuantitative: false,
      recommendedLayouts: ['process-timeline', 'bento-grid', 'hero-split-image', 'comparison-table'],
      rationale: 'بابەتێکی مێژوویی و قۆناغ بە قۆناغە؛ هێڵی کاتی و ڕووداوە بەڵگەدارەکان گونجاوترین دیمەنی زانستین.'
    };
  }

  // ٥. زانستە ئەزموونی و ئامارییەکان (Empirical & Quantitative)
  const quantitativeKeywords = [
    'ئامار', 'ئابووری', 'دارایی', 'پزیشکی', 'نەخۆشی', 'کلینیکی', 'زیرەکی دەستکرد', 'ئەلگۆریتم',
    'مۆدێل', 'داتای', 'ڕاپرسی', 'تێچوو', 'داهات', 'بازاڕ', 'ژینگە', 'تەکنەلۆجیا', 'فیزیا', 'کیمیا', 'بایۆلۆجی', 'ڕێژەی'
  ];
  if (quantitativeKeywords.some(kw => normalized.includes(kw))) {
    return {
      domain: 'empirical_quantitative',
      isQuantitative: true,
      recommendedLayouts: ['stat-kpi-dashboard', 'chart-insight', 'bento-grid', 'comparison-table'],
      rationale: 'بابەتێکی ئەزموونی و ژمارەییە؛ بەکارهێنانی کارتی ئاماری KPI و چارتی داتا لەگەڵ سەرچاوەی پێوانەکاری زانستی پێویستە.'
    };
  }

  return {
    domain: 'general_academic',
    isQuantitative: false,
    recommendedLayouts: ['bento-grid', 'comparison-table', 'hero-split-image', 'process-timeline'],
    rationale: 'بابەتی ئەکادیمیی گشتی؛ پشت بە شیکردنەوەی بونیادی چەمکەکان و بەراوردکاری تیۆری دەبەستێت.'
  };
}
