import { DataClassificationService } from '../data-classification.service';
import { VisualizationField } from '../../models/presentation.model';

describe('DataClassificationService', () => {
  let service: DataClassificationService;

  beforeEach(() => {
    service = new DataClassificationService();
  });

  it('should classify numeric values as discrete/continuous quantitative', () => {
    const field: VisualizationField = {
      name: 'پێوەر',
      dataType: 'quantitative',
      sampleValues: [10, 20, 30, 40]
    };
    const result = service.classifyField(field);
    expect(result.isNumeric).toBe(true);
    expect(result.primaryType).toBe('discrete');
  });

  it('should classify date strings as temporal', () => {
    const field: VisualizationField = {
      name: 'بەروار',
      dataType: 'temporal',
      sampleValues: ['2020-01-01', '2021-01-01', '2022-01-01']
    };
    const result = service.classifyField(field);
    expect(result.isTemporal).toBe(true);
    expect(result.primaryType).toBe('temporal');
  });

  it('should classify categorical string labels correctly', () => {
    const field: VisualizationField = {
      name: 'پۆلەکان',
      dataType: 'categorical',
      sampleValues: ['پۆلی A', 'پۆلی B', 'پۆلی C']
    };
    const result = service.classifyField(field);
    expect(result.isCategorical).toBe(true);
  });
});
