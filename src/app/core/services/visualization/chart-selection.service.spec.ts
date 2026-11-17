import { ChartSelectionService } from '../chart-selection.service';
import { VisualizationDataset } from '../../models/presentation.model';

describe('ChartSelectionService', () => {
  let service: ChartSelectionService;

  beforeEach(() => {
    service = new ChartSelectionService();
  });

  it('should return notRecommended if dataset is empty or lacks numbers', () => {
    const dataset: VisualizationDataset = {
      id: 'ds1',
      title: 'بەتاڵ',
      fields: [{ name: 'ناوەکان', dataType: 'textual', sampleValues: ['A', 'B'] }],
      rows: [{ 'ناوەکان': 'A' }, { 'ناوەکان': 'B' }]
    };
    const rec = service.recommendChart(dataset);
    expect(rec.chartType).toBe('notRecommended');
    expect(rec.dataRequirementsSatisfied).toBe(false);
  });

  it('should recommend line or area chart for temporal trend goals', () => {
    const dataset: VisualizationDataset = {
      id: 'ds2',
      title: 'گۆڕانکاری کاتی',
      fields: [
        { name: 'ساڵ', dataType: 'temporal', sampleValues: ['2020', '2021', '2022'] },
        { name: 'ڕێژە', dataType: 'quantitative', sampleValues: [12, 18, 25] }
      ],
      rows: [
        { 'ساڵ': '2020', 'ڕێژە': 12 },
        { 'ساڵ': '2021', 'ڕێژە': 18 },
        { 'ساڵ': '2022', 'ڕێژە': 25 }
      ]
    };
    const rec = service.recommendChart(dataset, 'trend');
    expect(['line', 'area']).toContain(rec.chartType);
    expect(rec.dataRequirementsSatisfied).toBe(true);
  });
});
