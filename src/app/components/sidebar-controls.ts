import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Presentation, SampleTopic } from '../core/models/presentation.model';
import { SAMPLE_TOPICS } from '../core/constants/app.constants';
import { PresentationService } from '../core/services/presentation/presentation.service';
import { AuthService } from '../core/services/workspace/auth.service';
import { HistoryService } from '../core/services/workspace/history.service';

@Component({
  selector: 'app-sidebar-controls',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  template: `
    <aside id="controls-panel" class="w-80 shrink-0 h-full overflow-y-auto p-4 bg-slate-900/90 border-e border-slate-800 flex flex-col gap-5 font-sans">
      
      <!-- Trial Status & Premium CTA -->
      <section class="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-indigo-900/60 flex flex-col gap-3 relative overflow-hidden">
        <div class="absolute -top-10 -left-10 w-24 h-24 bg-indigo-500/20 rounded-full blur-2xl"></div>
        
        <div class="flex items-center justify-between z-10">
          <span class="text-[11px] font-black flex items-center gap-1">
            <mat-icon class="text-indigo-400 text-sm">lock_open</mat-icon>
            <span>ئاستی هەژمار:</span>
          </span>
          @if (isPremiumUser) {
            <span class="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-sm">
              <mat-icon class="text-[10px] text-amber-100">workspace_premium</mat-icon>
              بێدەروو / پرۆ
            </span>
          } @else {
            <span class="bg-slate-800 text-slate-300 text-[9px] font-bold px-2 py-0.5 rounded-full">
              تاقیکاری لیمیتدار
            </span>
          }
        </div>

        @if (!isPremiumUser) {
          <div class="flex flex-col gap-1.5 mt-1 z-10">
            <div class="flex justify-between text-[11px] font-semibold text-indigo-200">
              <span>پڕۆژەی دروستکراوی ئەمڕۆ:</span>
              <span>{{ dailyGenerationsCount }} لە {{ dailyLimit }} پرۆژە</span>
            </div>
            <div class="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
              <div [style.width.%]="(dailyGenerationsCount / dailyLimit) * 100" class="bg-gradient-to-l from-indigo-500 to-indigo-400 h-2 rounded-full transition-all duration-500"></div>
            </div>
          </div>
          
          <button (click)="openUpgradeModal.emit()" class="w-full mt-1 bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black p-2.5 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer z-10">
            <mat-icon class="text-sm">workspace_premium</mat-icon>
            <span>بەرزکردنەوە بۆ هەژماری پڕۆ</span>
          </button>
        } @else {
          <div class="bg-indigo-950/50 p-3 rounded-xl border border-indigo-800/40 text-[11px] leading-relaxed text-indigo-200 z-10">
            🎉 هەژمارەکەت نیشانەی <strong>Premium Pro</strong>ی هەیە! بێ لیمیت پرێزێنتەیشن دروست بکە.
          </div>
          <button (click)="resetTrial.emit()" class="text-right text-[10px] text-slate-400 hover:text-red-400 underline cursor-pointer mt-1 z-10">
            گەڕانەوە بۆ لیمیتی پێشوو (بۆ تاقیکاری)
          </button>
        }
      </section>

      <!-- Presentation Parameter Card -->
      <section class="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col gap-4">
        <div class="border-b border-slate-800 pb-2">
          <h2 class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <mat-icon class="text-indigo-400 text-sm">tune</mat-icon>
            <span>مەرجەکانی پێشکەشکردن</span>
          </h2>
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="topic-input" class="text-xs font-bold text-slate-300">بابەتی سیمینار یان تێز:</label>
          <textarea id="topic-input" [(ngModel)]="topic" (ngModelChange)="topicChange.emit($event)" rows="3" 
            placeholder="نموونە: شیکاری کاریگەری ژیری دەستکرد لەسەر زانستی پزیشکی لە کوردستان"
            class="w-full text-xs p-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all outline-none resize-none leading-relaxed text-slate-100 placeholder:text-slate-600">
          </textarea>
        </div>

        <div class="flex flex-col gap-1.5">
          <span class="text-xs font-bold text-slate-300">ئاستی ئەکادیمی:</span>
          <div class="grid grid-cols-1 gap-1.5">
            <button type="button" (click)="setAcademicLevel('qutabxana')"
              [class]="academicLevel === 'qutabxana' ? 'border-indigo-500 bg-indigo-950/60 text-white' : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'"
              class="flex items-center gap-2 p-2 rounded-xl border transition-all text-right cursor-pointer">
              <span class="text-base">🎒</span>
              <div>
                <h4 class="text-xs font-bold">قوتابخانە (School)</h4>
                <p class="text-[9px] text-slate-400">دەربڕینی سادە و ڕوون</p>
              </div>
            </button>

            <button type="button" (click)="setAcademicLevel('bachelor')"
              [class]="academicLevel === 'bachelor' ? 'border-indigo-500 bg-indigo-950/60 text-white' : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'"
              class="flex items-center gap-2 p-2 rounded-xl border transition-all text-right cursor-pointer">
              <span class="text-base">🎓</span>
              <div>
                <h4 class="text-xs font-bold">زانکۆ (بەکالۆریۆس)</h4>
                <p class="text-[9px] text-slate-400">زاراوەی زانستی و هاوچەرخ</p>
              </div>
            </button>

            <button type="button" (click)="setAcademicLevel('postgrad')"
              [class]="academicLevel === 'postgrad' ? 'border-indigo-500 bg-indigo-950/60 text-white' : 'border-slate-800 bg-slate-900/80 hover:bg-slate-800 text-slate-300'"
              class="flex items-center gap-2 p-2 rounded-xl border transition-all text-right cursor-pointer">
              <span class="text-base">🧠</span>
              <div>
                <h4 class="text-xs font-bold">ماستەر و دکتۆرا</h4>
                <p class="text-[9px] text-slate-400">قووڵ، میتۆدۆلۆژی و بەڵگەی زانستی</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Slide Count Selector -->
        <div class="flex flex-col gap-1.5">
          <div class="flex items-center justify-between text-xs font-bold text-slate-300">
            <label for="slide-count-range">ژمارەی سلایدەکان:</label>
            <span class="bg-indigo-900/70 text-indigo-300 px-2 py-0.5 rounded text-[11px] font-black border border-indigo-700/50">
              {{ slideCount }} سلاید
            </span>
          </div>
          <input id="slide-count-range" type="range" min="3" max="15" [(ngModel)]="slideCount" (ngModelChange)="slideCountChange.emit($event)"
            class="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer">
        </div>

        <!-- Generate Button -->
        <button type="button" (click)="onGenerate()"
          [disabled]="isLoading || !topic.trim()"
          class="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-600 disabled:opacity-40 text-white font-bold p-3 rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed">
          @if (!isLoading) {
            <mat-icon class="text-sm">auto_awesome</mat-icon>
          } @else {
            <mat-icon class="text-sm animate-spin">sync</mat-icon>
          }
          <span>{{ isLoading ? 'داڕشتن بە ژیری دەستکرد...' : 'دروستکردنی پێشکەشکردن' }}</span>
        </button>
      </section>

      <!-- Quick Templates -->
      <section class="bg-slate-950 rounded-2xl border border-slate-800 p-4">
        <h3 class="text-xs font-bold text-slate-300 mb-2.5 flex items-center gap-1.5 border-b border-slate-800 pb-2">
          <mat-icon class="text-sm text-indigo-400">lightbulb</mat-icon>
          <span>نموونەی ئامادەبوو (دەستپێکردنی خێرا)</span>
        </h3>
        <div class="flex flex-col gap-2">
          @for (sample of sampleTopics; track sample.topic) {
            <button type="button" (click)="onSelectSample(sample)"
              class="text-right p-2 rounded-xl border border-slate-800/80 hover:border-indigo-600/60 bg-slate-900 hover:bg-indigo-950/30 text-xs transition-all flex flex-col gap-0.5 cursor-pointer">
              <span class="font-semibold text-slate-200">{{ sample.labelName }}</span>
              <div class="flex items-center gap-2 text-[10px] text-slate-500">
                <span class="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">{{ sample.badge }}</span>
                <span>•</span>
                <span>{{ sample.slideCount }} سلاید</span>
              </div>
            </button>
          }
        </div>
      </section>

      <!-- Presentation History -->
      @if (history.length > 0) {
        <section class="bg-slate-950 rounded-2xl border border-slate-800 p-4 flex flex-col gap-2.5">
          <h3 class="text-xs font-black text-white flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <mat-icon class="text-sm text-amber-400">history</mat-icon>
            <span>مێژووی پڕۆژەکان ({{ history.length }})</span>
          </h3>
          
          <div class="flex flex-col gap-1.5 max-h-52 overflow-y-auto">
            @for (item of history; track item.id) {
              <div role="button" tabindex="0"
                (click)="onLoadHistory(item)"
                (keydown.enter)="onLoadHistory(item)"
                (keydown.space)="onLoadHistory(item)"
                [class]="currentPresentation?.id === item.id ? 'bg-indigo-950 border-indigo-500' : 'bg-slate-900 border-slate-800 hover:bg-slate-850'"
                class="w-full text-right p-2 rounded-lg border cursor-pointer transition-all flex items-center justify-between gap-2">
                <div class="min-w-0 flex-1">
                  <h4 class="text-xs font-semibold text-slate-200 truncate">{{ item.title }}</h4>
                  <p class="text-[9px] text-slate-500 mt-0.5">
                    {{ getKurdishLevelName(item.academicLevel) }} • {{ item.slides.length }} سلاید
                  </p>
                </div>
                <button type="button" (click)="onDeleteHistory(item.id, $event)" title="سڕینەوە"
                  class="text-slate-500 hover:text-red-400 p-1 rounded hover:bg-slate-800 transition-colors flex items-center justify-center cursor-pointer">
                  <mat-icon class="text-sm">delete</mat-icon>
                </button>
              </div>
            }
          </div>
        </section>
      }

    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SidebarControlsComponent implements OnInit {
  private presentationService = inject(PresentationService);
  private authService = inject(AuthService);
  private historyService = inject(HistoryService);

  @Input() topic = '';
  @Output() topicChange = new EventEmitter<string>();

  @Input() academicLevel: 'qutabxana' | 'bachelor' | 'postgrad' = 'bachelor';
  @Output() academicLevelChange = new EventEmitter<'qutabxana' | 'bachelor' | 'postgrad'>();

  @Input() slideCount = 6;
  @Output() slideCountChange = new EventEmitter<number>();

  @Input() dailyGenerationsCount = 2;
  @Input() dailyLimit = 5;
  @Input() isPremiumUser = false;
  @Input() isLoading = false;
  @Input() sampleTopics: SampleTopic[] = [];
  @Input() history: Presentation[] = [];
  @Input() currentPresentation: Presentation | null = null;

  @Output() generate = new EventEmitter<void>();
  @Output() selectSample = new EventEmitter<SampleTopic>();
  @Output() loadHistoryItem = new EventEmitter<Presentation>();
  @Output() deleteHistoryItem = new EventEmitter<{ id: string; event: Event }>();
  @Output() openUpgradeModal = new EventEmitter<void>();
  @Output() resetTrial = new EventEmitter<void>();

  ngOnInit(): void {
    if (this.sampleTopics.length === 0) {
      this.sampleTopics = SAMPLE_TOPICS;
    }
    const trial = this.authService.getTrialStatus();
    this.dailyGenerationsCount = trial.dailyGenerationsCount;
    this.isPremiumUser = trial.isPremiumUser;
    
    if (this.history.length === 0) {
      this.history = this.historyService.loadHistory();
    }
    if (!this.currentPresentation) {
      this.currentPresentation = this.presentationService.currentPresentation();
    }
  }

  setAcademicLevel(level: 'qutabxana' | 'bachelor' | 'postgrad'): void {
    this.academicLevel = level;
    this.academicLevelChange.emit(level);
  }

  async onGenerate(): Promise<void> {
    this.generate.emit();
    if (!this.generate.observed && this.topic.trim()) {
      this.isLoading = true;
      try {
        const pres = await this.presentationService.generatePresentation(
          this.topic.trim(),
          this.academicLevel,
          this.slideCount
        );
        this.currentPresentation = pres;
        this.history = this.historyService.saveToHistory(this.history, pres);
      } catch (e) {
        console.error('SidebarControls generation error:', e);
      } finally {
        this.isLoading = false;
      }
    }
  }

  onSelectSample(sample: SampleTopic): void {
    this.topic = sample.topic;
    this.academicLevel = sample.level;
    this.slideCount = sample.slideCount;
    this.topicChange.emit(this.topic);
    this.academicLevelChange.emit(this.academicLevel);
    this.slideCountChange.emit(this.slideCount);

    this.selectSample.emit(sample);
    if (!this.selectSample.observed) {
      this.onGenerate();
    }
  }

  onLoadHistory(item: Presentation): void {
    this.currentPresentation = item;
    this.presentationService.setPresentation(item);
    this.loadHistoryItem.emit(item);
  }

  onDeleteHistory(id: string, event: Event): void {
    event.stopPropagation();
    this.deleteHistoryItem.emit({ id, event });
    if (!this.deleteHistoryItem.observed) {
      this.history = this.historyService.deleteFromHistory(this.history, id);
    }
  }

  getKurdishLevelName(level: string): string {
    switch (level) {
      case 'qutabxana': return '🎒 قوتابخانە';
      case 'bachelor': return '🎓 زانکۆ (بەکالۆریۆس)';
      case 'postgrad': return '🧠 ماستەر و دکتۆرا';
      default: return level;
    }
  }
}
