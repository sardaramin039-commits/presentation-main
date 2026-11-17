import { Injectable } from '@angular/core';
import { VisualizationDataset } from '../../models/presentation.model';

export interface AxisDefinition {
  field: string;
  label: string;
  unit?: string;
  scaleType: 'linear' | 'log' | 'ordinal' | 'time' | 'band';
  min?: number;
  max?: number;
  isTruncated: boolean;
  misleadingWarning?: string;
}

export interface AxisPlan {
  xAxis: AxisDefinition;
  yAxis: AxisDefinition;
  secondaryYAxis?: AxisDefinition;
  hasMisleadingScale: boolean;
  explanation: string;
}

@Injectable({
  providedIn: 'root'
})
export class AxisPlanningService {
  /**
   * Generates axis configurations and validates scale integrity.
   */
  planAxes(
    dataset: VisualizationDataset,
    xFieldName: string,
    yFieldName: string,
    chartType: string
  ): AxisPlan {
    const xField = dataset.fields.find(f => f.name === xFieldName);
    const yField = dataset.fields.find(f => f.name === yFieldName);

    const yValues = dataset.rows.map(r => Number(r[yFieldName])).filter(v => !isNaN(v));

    const yMin = yValues.length > 0 ? Math.min(...yValues) : 0;
    const yMax = yValues.length > 0 ? Math.max(...yValues) : 100;


    let isTruncated = false;
    let misleadingWarning: string | undefined;

    // Zero-baseline integrity rule for bar/column charts
    if ((chartType === 'bar' || chartType === 'column') && yMin > 0) {
      if (yMin > yMax * 0.25) {
        isTruncated = true;
        misleadingWarning = 'دەستپێنەکردنی تەوەری Y لە ژمارە ٠ کارامەیی چارت و ڕاستیی بەراوردکاری لاواز دەکات';
      }
    }

    const xAxis: AxisDefinition = {
      field: xFieldName,
      label: xField?.name || xFieldName,
      unit: xField?.unit,
      scaleType: xField?.dataType === 'temporal' ? 'time' : 'band',
      isTruncated: false
    };

    const yAxis: AxisDefinition = {
      field: yFieldName,
      label: yField?.name || yFieldName,
      unit: yField?.unit,
      scaleType: 'linear',
      min: isTruncated ? yMin * 0.9 : Math.min(0, yMin),
      max: yMax * 1.05,
      isTruncated,
      misleadingWarning
    };

    return {
      xAxis,
      yAxis,
      hasMisleadingScale: isTruncated,
      explanation: isTruncated
        ? 'تەوەرەی Y بەشێکی ڕێنجمان قرتاندووە؛ پێویستە تێبینی لەسەر لاڕێبوونی چاو بخرێتەڕوو'
        : 'تەوەرەکان بە پێوەرێکی دروست و هاوسەنگ لە هەردوو جەمسەرەوە بڕیاریان لێدراوە'
    };
  }
}
