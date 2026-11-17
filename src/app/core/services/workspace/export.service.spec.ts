import { TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExportService } from './export.service';
import { EditablePptxObjectModelService } from './editable-pptx-object-model.service';
import { PptxExportFidelityService } from './pptx-export-fidelity.service';

describe('ExportService', () => {
  let service: ExportService;

  const mockPptxModelService = {
    buildEditableModel: vi.fn().mockReturnValue({ slides: [] }),
    generateAndDownloadFile: vi.fn().mockResolvedValue(undefined)
  };

  const mockFidelityService = {
    validateAndRepair: vi.fn().mockImplementation((model) => model)
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        ExportService,
        { provide: EditablePptxObjectModelService, useValue: mockPptxModelService },
        { provide: PptxExportFidelityService, useValue: mockFidelityService }
      ]
    });

    service = TestBed.inject(ExportService);
  });

  it('پێویستە پێش دابەزاندنی فایلی PPTX پشکنینی Fidelity ئەنجام بدات', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dummyPresentation: any = { id: 'p1', title: 'Academic Seminar', slides: [] };
    
    await service.exportToPptx(dummyPresentation);

    expect(mockPptxModelService.buildEditableModel).toHaveBeenCalledWith(dummyPresentation);
    expect(mockFidelityService.validateAndRepair).toHaveBeenCalled();
    expect(mockPptxModelService.generateAndDownloadFile).toHaveBeenCalled();
  });
});
