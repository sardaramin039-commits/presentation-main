import { Injectable } from '@angular/core';
import {
  SlideDesignSpec,
  DesignFinding
} from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class VisualBalanceService {
  /**
   * Evaluates horizontal, vertical, and spatial balance across layout zones.
   */
  evaluateBalance(slideSpec: SlideDesignSpec): {
    isBalanced: boolean;
    balanceScore: number; // 0 - 100
    findings: DesignFinding[];
  } {
    const findings: DesignFinding[] = [];
    const layout = slideSpec.layout;

    if (layout.zones.length <= 1) {
      return { isBalanced: true, balanceScore: 100, findings: [] };
    }

    let leftWeight = 0;
    let rightWeight = 0;

    layout.zones.forEach(zone => {
      const isLeft = zone.bounds.leftPct < 50;
      const weight = zone.contentIds.length * 10 + (zone.bounds.widthPct * zone.bounds.heightPct) / 100;
      if (isLeft) {
        leftWeight += weight;
      } else {
        rightWeight += weight;
      }
    });

    const totalWeight = leftWeight + rightWeight;
    let balanceScore = 100;

    if (totalWeight > 0) {
      const diffRatio = Math.abs(leftWeight - rightWeight) / totalWeight;
      if (diffRatio > 0.6 && layout.columnCount > 1) {
        balanceScore = Math.round(100 - diffRatio * 50);
        findings.push({
          id: `balance_${slideSpec.slideNumber}`,
          slideNumber: slideSpec.slideNumber,
          category: 'alignment',
          severity: 'moderate',
          message: `سڵایدی ${slideSpec.slideNumber} هاوسەنگی لای ڕاست و چەپی تێکچووە (لایەکی ڕێژەی سەرنجی زۆر زیاترە).`,
          location: 'کۆڵۆمەکانی سڵاید',
          rationale: 'ناڕێکی کێشی بینراو (Visual Weight) جێگیریی دیزاینەکە کەم دەکاتەوە.',
          recommendation: 'ناوەڕۆکەکە بە یەکسانی لە نێوان نێوان هەردوو لادا بڵاو بکەرەوە.'
        });
      }
    }

    return {
      isBalanced: findings.length === 0,
      balanceScore,
      findings
    };
  }
}
