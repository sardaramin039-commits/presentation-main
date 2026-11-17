import { Injectable, signal, computed } from '@angular/core';
import {
  AcademicProject,
  AcademicProjectVersion,
  AcademicComment,
  ProjectDashboardStats,
  UserRole
} from '../../models/project-workspace.model';
import { Source, Claim, Evidence, Citation } from '../../models/research.model';
import { AcademicDocument } from '../../models/academic-writing.model';
import { PresentationPlan } from '../../models/presentation.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectWorkspaceService {
  private readonly STORAGE_KEY = 'ai_academic_projects_v26';

  // Signals for Reactive UI State
  public projects = signal<AcademicProject[]>([]);
  public activeProjectId = signal<string | null>(null);

  public activeProject = computed(() => {
    const id = this.activeProjectId();
    if (!id) return this.projects()[0] || null;
    return this.projects().find(p => p.id === id) || null;
  });

  public dashboardStats = computed<ProjectDashboardStats>(() => {
    const list = this.projects();
    let totalSources = 0;
    let verifiedSourcesCount = 0;
    let totalEvidenceCount = 0;
    let totalClaimsCount = 0;
    let unverifiedClaimsCount = 0;
    let reviewPendingCount = 0;

    list.forEach(p => {
      totalSources += p.sources.length;
      verifiedSourcesCount += p.sources.filter(s => s.verificationResult?.status === 'verified').length;
      totalEvidenceCount += p.evidenceList.length;
      totalClaimsCount += p.claims.length;
      unverifiedClaimsCount += p.claims.filter(c => c.status !== 'supported').length;
      if (p.workflowSteps.some(step => step.status === 'pending' || step.status === 'in_review')) {
        reviewPendingCount++;
      }
    });

    return {
      totalProjects: list.length,
      totalSources,
      verifiedSourcesCount,
      totalEvidenceCount,
      totalClaimsCount,
      unverifiedClaimsCount,
      reviewPendingCount,
      exportReadyCount: list.length
    };
  });

  constructor() {
    this.loadFromStorage();
    if (this.projects().length === 0) {
      this.createInitialDefaultProject();
    }
  }

  /**
   * Create a new Academic Project
   */
  public createProject(
    title: string,
    topic: string,
    academicLevel: 'qutabxana' | 'bachelor' | 'postgrad' = 'bachelor',
    projectType: 'thesis' | 'dissertation' | 'seminar' | 'journal_article' | 'research_paper' | 'presentation' = 'thesis',
    userRole: UserRole = 'researcher'
  ): AcademicProject {
    const newProj: AcademicProject = {
      id: `proj-${Date.now()}`,
      title,
      topic,
      academicLevel,
      projectType,
      ownerEmail: 'user@academic.edu',
      userRole,
      sources: [],
      evidenceList: [],
      claims: [],
      citations: [],
      comments: [],
      workflowSteps: [
        {
          stepId: 'step-1',
          stageName: 'ڕەشنووسی سەرەتایی (Initial Draft)',
          reviewerRole: 'student',
          status: 'approved',
          comments: 'ڕەشنووسی سەرەتایی بونیاد نرا.'
        },
        {
          stepId: 'step-2',
          stageName: 'پێداچوونەوەی سەرپەرشتیار (Supervisor Review)',
          reviewerRole: 'supervisor',
          status: 'pending',
          comments: 'چاودێری و پێداچوونەوەی ئەکادیمی.'
        },
        {
          stepId: 'step-3',
          stageName: 'هەڵسەنگاندنی زانستیی کۆتایی (Academic Review)',
          reviewerRole: 'reviewer',
          status: 'pending',
          comments: 'پشکنینی بێ کەموکوڕیی سەرچاوەکان.'
        }
      ],
      versions: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create initial Version snapshot
    this.addVersionSnapshot(newProj, 'وەشانی سەرەتایی (Initial Version)', 'بونیادنانی پڕۆژە');

    this.projects.update(list => [newProj, ...list]);
    this.activeProjectId.set(newProj.id);
    this.saveToStorage();

    return newProj;
  }

  /**
   * Set Active Project by ID
   */
  public setActiveProject(id: string): void {
    this.activeProjectId.set(id);
  }

  /**
   * Update Active Project Data
   */
  public updateActiveProjectData(
    sources?: Source[],
    evidenceList?: Evidence[],
    claims?: Claim[],
    citations?: Citation[],
    document?: AcademicDocument,
    presentation?: PresentationPlan
  ): void {
    const current = this.activeProject();
    if (!current) return;

    const updated: AcademicProject = {
      ...current,
      sources: sources || current.sources,
      evidenceList: evidenceList || current.evidenceList,
      claims: claims || current.claims,
      citations: citations || current.citations,
      currentDocument: document || current.currentDocument,
      currentPresentation: presentation || current.currentPresentation,
      updatedAt: new Date().toISOString()
    };

    this.projects.update(list => list.map(p => p.id === updated.id ? updated : p));
    this.saveToStorage();
  }

  /**
   * Add a Version Snapshot to active project
   */
  public createVersionSnapshot(versionLabel: string, summaryOfChanges: string): void {
    const current = this.activeProject();
    if (!current) return;

    this.addVersionSnapshot(current, versionLabel, summaryOfChanges);
    this.projects.update(list => list.map(p => p.id === current.id ? current : p));
    this.saveToStorage();
  }

  /**
   * Add Academic Comment
   */
  public addComment(
    sectionTarget: string,
    commentText: string,
    authorRole: UserRole = 'supervisor',
    authorName = 'سەرپەرشتیاری ئەکادیمی'
  ): AcademicComment {
    const current = this.activeProject();
    const comment: AcademicComment = {
      id: `comment-${Date.now()}`,
      projectId: current?.id || 'default',
      authorName,
      authorRole,
      sectionTarget,
      commentText,
      createdAt: new Date().toISOString(),
      resolved: false
    };

    if (current) {
      current.comments.push(comment);
      this.projects.update(list => list.map(p => p.id === current.id ? current : p));
      this.saveToStorage();
    }

    return comment;
  }

  /**
   * Update Workflow Step Status
   */
  public updateWorkflowStep(stepId: string, status: 'pending' | 'in_review' | 'approved' | 'revision_requested', comments: string): void {
    const current = this.activeProject();
    if (!current) return;

    const step = current.workflowSteps.find(s => s.stepId === stepId);
    if (step) {
      step.status = status;
      step.comments = comments;
      step.reviewedAt = new Date().toISOString();
      this.projects.update(list => list.map(p => p.id === current.id ? current : p));
      this.saveToStorage();
    }
  }

  // --- PRIVATE HELPERS ---

  private addVersionSnapshot(proj: AcademicProject, label: string, summary: string): void {
    const nextVer = (proj.versions.length || 0) + 1;
    const version: AcademicProjectVersion = {
      versionNumber: nextVer,
      versionLabel: label,
      timestamp: new Date().toISOString(),
      author: proj.ownerEmail,
      summaryOfChanges: summary,
      documentSnapshot: proj.currentDocument ? JSON.parse(JSON.stringify(proj.currentDocument)) : undefined,
      presentationSnapshot: proj.currentPresentation ? JSON.parse(JSON.stringify(proj.currentPresentation)) : undefined
    };
    proj.versions.unshift(version);
  }

  private createInitialDefaultProject(): void {
    this.createProject(
      'تێزی بەراوردکاریی شیکارییە ئەکادیمییەکان',
      'کاریگەریی ژیریی دەستکرد لەسەر پەرەسەندنی توێژینەوەی زانستی',
      'bachelor',
      'thesis',
      'researcher'
    );
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.projects.set(parsed);
          this.activeProjectId.set(parsed[0].id);
        }
      }
    } catch {
      // Fallback
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.projects()));
    } catch {
      // Ignore storage quota errors
    }
  }
}
