import { Injectable } from '@angular/core';
import { VisualizationField, VisualizationMapping } from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class VisualEncodingService {
  /**
   * Recommends optimal visual encoding channels (position, length, size, shape, pattern, text) for given fields.
   */
  encodeFields(fields: VisualizationField[]): VisualizationMapping[] {
    const mappings: VisualizationMapping[] = [];

    fields.forEach((f, idx) => {
      if (idx === 0) {
        mappings.push({
          field: f.name,
          channel: 'x',
          scaleType: f.dataType === 'temporal' ? 'time' : 'band',
          label: f.name
        });
      } else if (idx === 1) {
        mappings.push({
          field: f.name,
          channel: 'y',
          scaleType: 'linear',
          label: f.name
        });
      } else if (idx === 2) {
        mappings.push({
          field: f.name,
          channel: 'color',
          scaleType: 'ordinal',
          label: f.name
        });
      } else {
        mappings.push({
          field: f.name,
          channel: 'size',
          scaleType: 'linear',
          label: f.name
        });
      }
    });

    return mappings;
  }
}
