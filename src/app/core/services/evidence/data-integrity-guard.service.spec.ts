import { DataIntegrityGuardService } from '../data-integrity-guard.service';
import { VisualizationDataset } from '../../models/presentation.model';

describe('DataIntegrityGuardService', () => {
  let service: DataIntegrityGuardService;

  beforeEach(() => {
    service = new DataIntegrityGuardService();
  });

  it('should detect missing values without auto-mutating rows', () => {
    const dataset: VisualizationDataset = {
      id: 'ds_missing',
      title: 'ونبوو',
      fields: [
        { name: 'کاتگۆری', dataType: 'categorical', sampleValues: ['A', 'B'] },
        { name: 'بڕ', dataType: 'quantitative', sampleValues: [10, ''] }
      ],
      rows: [
        { 'کاتگۆری': 'A', 'بڕ': 10 },
        { 'کاتگۆری': 'B', 'بڕ': '' }
      ]
    };

    const report = service.inspectDataset(dataset);
    expect(report.issues.some(i => i.issueType === 'missingValues')).toBe(true);
  });
});
