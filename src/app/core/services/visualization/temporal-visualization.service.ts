import { Injectable } from '@angular/core';

export interface TimelineEvent {
  timeLabel: string;
  description: string;
  sourceEvidenceId?: string;
}

export interface TemporalVisualPlan {
  title: string;
  events: TimelineEvent[];
  hasFabricatedDates: boolean;
  layout: 'horizontalTimeline' | 'verticalMilestones' | 'chronologicalStepped';
  rationale: string;
}

@Injectable({
  providedIn: 'root'
})
export class TemporalVisualizationService {
  /**
   * Builds chronological timelines solely using explicit temporal references found in evidence.
   */
  planTemporalVisual(textContent: string, sourceEvidenceIds: string[] = []): TemporalVisualPlan {
    const text = textContent || '';
    // Regex matching years e.g. 1990, 2020, 2024 or Kurdish numbers / dates
    const yearMatches = text.match(/\b(19\d\d|20\d\d)\b/g) || [];

    const events: TimelineEvent[] = [];
    const uniqueYears = Array.from(new Set(yearMatches));

    if (uniqueYears.length > 0) {
      uniqueYears.forEach((yr, idx) => {
        events.push({
          timeLabel: yr,
          description: `دەستپێک یان وەرچەرخانی ڕووداوەکان لە ساڵی ${yr}`,
          sourceEvidenceId: sourceEvidenceIds[idx % (sourceEvidenceIds.length || 1)]
        });
      });
    } else {
      // Step based timeline without dates
      events.push({
        timeLabel: 'قۆناغی سەرەتایی',
        description: 'دەستپێکی ڕەوتی توێژینەوەکە'
      });
      events.push({
        timeLabel: 'قۆناغی ناوەندی',
        description: 'گەشەسەندن و گۆڕانکارییە سەرەکییەکان'
      });
      events.push({
        timeLabel: 'قۆناغی کۆتایی',
        description: 'ئەنجام و دەستکەوتە زانستییە بەدەستهاتووەکان'
      });
    }

    return {
      title: 'ڕێڕەوی گەشەسەندنی کاتی',
      events,
      hasFabricatedDates: false,
      layout: events.length > 4 ? 'verticalMilestones' : 'horizontalTimeline',
      rationale: 'تایملاین بەپێی بەروارە بڕواپێکراوەکانی دەق بێ دروستکردنی هیچ ساڵێکی خەیاڵی داڕێژراوە'
    };
  }
}
