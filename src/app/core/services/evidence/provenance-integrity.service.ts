import { Injectable } from '@angular/core';
import { ProvenanceChain, ProvenanceOperation, AuditRecord } from '../../models/provenance.model';

@Injectable({
  providedIn: 'root'
})
export class ProvenanceIntegrityService {
  private auditLog: AuditRecord[] = [];

  /**
   * Creates a new provenance chain for an entity
   */
  public createChain(
    operation: ProvenanceOperation,
    details: string,
    entityIds?: { sourceId?: string; evidenceId?: string; claimId?: string; citationId?: string },
    modelOrProvider = 'KurdishAI-Studio-Academic-Engine-v2026',
    parentProvenanceId?: string
  ): ProvenanceChain {
    const timestamp = new Date().toISOString();
    const id = `prov-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    const initialRecord: AuditRecord = {
      timestamp,
      operation,
      actor: 'system',
      details
    };

    this.auditLog.push(initialRecord);

    return {
      id,
      createdAt: timestamp,
      sourceId: entityIds?.sourceId,
      evidenceId: entityIds?.evidenceId,
      claimId: entityIds?.claimId,
      citationId: entityIds?.citationId,
      operation,
      modelOrProvider,
      version: '1.0.0-P1',
      verificationStatus: 'verified',
      auditTrail: [initialRecord],
      parentProvenanceId
    };
  }

  /**
   * Mutates or updates a provenance chain with an audit record
   */
  public recordMutation(
    chain: ProvenanceChain,
    operation: ProvenanceOperation,
    details: string
  ): ProvenanceChain {
    const record: AuditRecord = {
      timestamp: new Date().toISOString(),
      operation,
      actor: 'system',
      details
    };

    this.auditLog.push(record);

    return {
      ...chain,
      operation,
      auditTrail: [...chain.auditTrail, record]
    };
  }

  /**
   * Verifies if a provenance chain is complete and unbroken
   */
  public isChainValid(chain: ProvenanceChain): { valid: boolean; reason?: string } {
    if (!chain || !chain.id || !chain.createdAt) {
      return { valid: false, reason: 'Missing base provenance attributes' };
    }
    if (!chain.auditTrail || chain.auditTrail.length === 0) {
      return { valid: false, reason: 'Empty audit trail' };
    }
    return { valid: true };
  }

  public getGlobalAuditLog(): AuditRecord[] {
    return [...this.auditLog];
  }
}
