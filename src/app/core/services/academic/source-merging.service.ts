import { Injectable, inject } from '@angular/core';
import { Source, SourceMetadata, TransformationLog } from '../../models/research.model';
import { MetadataNormalizationService } from '../metadata-normalization.service';

export interface FieldProvenanceRecord {
  fieldName: keyof SourceMetadata;
  providedBy: string;
  originalValue: unknown;
}

export interface MergedSourceResult {
  mergedSource: Source;
  fieldSources: FieldProvenanceRecord[];
  transformationLogs: TransformationLog[];
}

@Injectable({
  providedIn: 'root'
})
export class SourceMergingService {
  private normalization = inject(MetadataNormalizationService);

  mergeSources(primarySource: Source, secondarySource: Source): MergedSourceResult {
    const metaA = primarySource.metadata;
    const metaB = secondarySource.metadata;
    const fieldSources: FieldProvenanceRecord[] = [];
    const transformationLogs: TransformationLog[] = [];

    const now = new Date().toISOString();

    // Field-by-field merge strategy favoring richer/longer fields while logging provenance
    const title = this.chooseRicherString('title', metaA.title, metaB.title, primarySource, secondarySource, fieldSources);
    const abstract = this.chooseRicherString('abstract', metaA.abstract, metaB.abstract, primarySource, secondarySource, fieldSources);
    const publisher = this.chooseRicherString('publisher', metaA.publisher, metaB.publisher, primarySource, secondarySource, fieldSources);
    const journal = this.chooseRicherString('journal', metaA.journal, metaB.journal, primarySource, secondarySource, fieldSources);
    const volume = this.chooseRicherString('volume', metaA.volume, metaB.volume, primarySource, secondarySource, fieldSources);
    const issue = this.chooseRicherString('issue', metaA.issue, metaB.issue, primarySource, secondarySource, fieldSources);
    const pages = this.chooseRicherString('pages', metaA.pages, metaB.pages, primarySource, secondarySource, fieldSources);
    const doi = metaA.doi || metaB.doi;
    const isbn = metaA.isbn || metaB.isbn;
    const url = metaA.url || metaB.url;

    // Authors merge: prefer longer authors list if valid, else combine unique
    let authors = metaA.authors;
    if (metaB.authors && metaB.authors.length > metaA.authors.length) {
      authors = metaB.authors;
      fieldSources.push({ fieldName: 'authors', providedBy: secondarySource.provenance.sourceProvider, originalValue: metaB.authors });
    } else {
      fieldSources.push({ fieldName: 'authors', providedBy: primarySource.provenance.sourceProvider, originalValue: metaA.authors });
    }

    const publicationYear = metaA.publicationYear || metaB.publicationYear;
    if (metaA.publicationYear) {
      fieldSources.push({ fieldName: 'publicationYear', providedBy: primarySource.provenance.sourceProvider, originalValue: metaA.publicationYear });
    } else if (metaB.publicationYear) {
      fieldSources.push({ fieldName: 'publicationYear', providedBy: secondarySource.provenance.sourceProvider, originalValue: metaB.publicationYear });
    }

    const mergedRaw: Partial<SourceMetadata> = {
      title,
      authors,
      publicationYear,
      publisher,
      journal,
      volume,
      issue,
      pages,
      doi,
      isbn,
      url,
      abstract,
      sourceType: metaA.sourceType || metaB.sourceType,
      databaseProvider: `${primarySource.provenance.sourceProvider} + ${secondarySource.provenance.sourceProvider}`,
      verificationStatus: metaA.verificationStatus === 'verified' || metaB.verificationStatus === 'verified'
        ? 'verified'
        : metaA.verificationStatus === 'partially_verified' || metaB.verificationStatus === 'partially_verified'
        ? 'partially_verified'
        : 'unverified'
    };

    const mergedMetadata = this.normalization.normalizeMetadata(mergedRaw);

    const logEntry: TransformationLog = {
      timestamp: now,
      action: 'MERGED_MULTIPLE_PROVIDER_METADATA',
      actor: 'SourceMergingService',
      details: `Merged primary [${primarySource.provenance.sourceProvider}:${primarySource.id}] with secondary [${secondarySource.provenance.sourceProvider}:${secondarySource.id}]. Fields combined from both providers with complete provenance.`
    };

    transformationLogs.push(logEntry);

    const existingHistory = [
      ...(primarySource.provenance.transformationHistory || []),
      ...(secondarySource.provenance.transformationHistory || [])
    ];

    const mergedSource: Source = {
      id: primarySource.id,
      metadata: mergedMetadata,
      addedAt: primarySource.addedAt,
      provenance: {
        sourceProvider: `${primarySource.provenance.sourceProvider}+${secondarySource.provenance.sourceProvider}`,
        providerSourceId: primarySource.provenance.providerSourceId || secondarySource.provenance.providerSourceId,
        retrievalTimestamp: now,
        originalUrl: url,
        retrievedMetadataSnapshot: {
          primarySnapshot: primarySource.provenance.retrievedMetadataSnapshot,
          secondarySnapshot: secondarySource.provenance.retrievedMetadataSnapshot,
          fieldProvenance: fieldSources
        },
        transformationHistory: [...existingHistory, logEntry]
      },
      rawContent: primarySource.rawContent || secondarySource.rawContent
    };

    return {
      mergedSource,
      fieldSources,
      transformationLogs
    };
  }

  private chooseRicherString(
    fieldName: keyof SourceMetadata,
    valA: string | undefined,
    valB: string | undefined,
    srcA: Source,
    srcB: Source,
    provenanceRecords: FieldProvenanceRecord[]
  ): string | undefined {
    const cleanA = valA ? valA.trim() : '';
    const cleanB = valB ? valB.trim() : '';

    if (cleanA.length >= cleanB.length && cleanA.length > 0) {
      provenanceRecords.push({ fieldName, providedBy: srcA.provenance.sourceProvider, originalValue: cleanA });
      return cleanA;
    } else if (cleanB.length > cleanA.length) {
      provenanceRecords.push({ fieldName, providedBy: srcB.provenance.sourceProvider, originalValue: cleanB });
      return cleanB;
    }
    return undefined;
  }
}
