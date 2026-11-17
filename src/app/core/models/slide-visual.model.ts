// جۆرەکانی نەخشەسازی و دیمەنی بینراوی سلایدەکان
export type SlideLayoutType = 
  | 'hero-split-image'     // نیوە وێنەی گەورە + نیوە دەق
  | 'bento-grid'           // کارتی مۆدێرن (٣ بۆ ٤ کارت بە ئایکۆنەوە)
  | 'stat-kpi-dashboard'   // ژمارە و ئاماری گەورە (بۆ نموونە: +84%, 2.5M)
  | 'chart-insight'        // چارتی زیندوو لەگەڵ شیکردنەوەی داتا
  | 'process-timeline'     // هێڵی کاتی یان قۆناغەکان (١ -> ٢ -> ٣)
  | 'comparison-table'     // خشتەی بەراوردکاریی ڕەنگاوڕەنگ
  | 'scientific-diagram';  // هێڵکاریی زانستی و فلۆچارت

export interface SlideVisualData {
  layout: SlideLayoutType;
  transition: 'fade' | 'slide-up' | 'zoom-morph' | 'flip';
  
  // ١. وێنە و میدیا
  image?: {
    url: string;
    searchQuery: string;
    alt: string;
    position: 'left' | 'right' | 'background-overlay' | 'floating-card';
  };

  // ٢. ئامار و ژمارەی سەرنجڕاکێش (KPI Callouts)
  stats?: {
    value: string;       // نموونە: "94.2%"
    label: string;       // نموونە: "وردیی مۆدێلەکە"
    trend?: 'up' | 'down' | 'neutral';
  }[];

  // ٣. داتای چارت (بەستراو بە chart-selection.service.ts)
  chart?: {
    type: 'bar' | 'line' | 'doughnut' | 'radar' | 'scatter';
    title: string;
    labels: string[];
    datasets: { label: string; data: number[]; color?: string }[];
  };

  // ٤. داتای خشتە (بەستراو بە table-recommendation.service.ts)
  table?: {
    headers: string[];
    rows: string[][];
  };
}
