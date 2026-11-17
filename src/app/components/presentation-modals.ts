import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Presentation, SlideTheme } from '../core/models/presentation.model';
import { PresentationService } from '../core/services/presentation/presentation.service';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-presentation-modals',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <!-- Outline Navigator Modal -->
    @if ((modalType === 'outline' || showOutlineModal) && effectivePresentation) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
        <div class="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-150 overflow-hidden flex flex-col font-sans">
          <header class="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h3 class="font-black text-slate-800 flex items-center gap-2 text-sm">
              <span class="material-icons text-teal-600 text-sm">format_list_bulleted</span>
              نەخشە و پلانی پێشکەشکردنەکەت (Outline)
            </h3>
            <button (click)="onClose('outline')" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons text-sm">close</span>
            </button>
          </header>
          
          <div class="p-5 flex flex-col gap-3 overflow-y-auto max-h-[60vh]">
            <p class="text-[11px] text-slate-500">لێرەوە دەتوانیت پلانی سلایدەکان بە ڕیزبەندی ببینیت و ڕاستەوخۆ بچیتە سەر هەر یەکێکیان:</p>
            
            <div class="flex flex-col gap-2">
              @for (slide of effectivePresentation.slides; track slide.title; let idx = $index) {
                <button (click)="selectSlide.emit(idx); onClose('outline')"
                  class="w-full text-right p-3 rounded-xl border border-slate-100 hover:border-indigo-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer">
                  <div class="flex items-center gap-3">
                    <span class="bg-slate-200 group-hover:bg-indigo-100 text-slate-600 group-hover:text-indigo-700 font-bold text-xs h-6 w-6 rounded-lg flex items-center justify-center">
                      {{ idx + 1 }}
                    </span>
                    <div>
                      <h5 class="text-xs font-black text-slate-800">{{ slide.title }}</h5>
                      <p class="text-[9px] text-slate-400 mt-0.5">{{ slide.points.length }} خاڵی سەرەکی</p>
                    </div>
                  </div>
                  <span class="material-icons text-slate-300 group-hover:text-indigo-600 text-sm">chevron_left</span>
                </button>
              }
            </div>
          </div>

          <button (click)="onClose('outline')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-3.5 text-center mt-auto cursor-pointer">داخستنی ناوەرۆک</button>
        </div>
      </div>
    }

    <!-- Share Link Modal -->
    @if ((modalType === 'share' || showShareModal) && effectivePresentation) {
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
        <div class="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-150 overflow-hidden flex flex-col font-sans">
          <header class="bg-slate-50 border-b border-slate-200 px-5 py-4 flex items-center justify-between">
            <h3 class="font-black text-slate-800 flex items-center gap-2 text-sm">
              <span class="material-icons text-rose-600 text-sm">share</span>
              بڵاوکردنەوەی بەستەر (Share Presentation)
            </h3>
            <button (click)="onClose('share')" class="text-slate-400 hover:text-slate-600 cursor-pointer">
              <span class="material-icons text-sm">close</span>
            </button>
          </header>

          <div class="p-5 flex flex-col gap-4">
            <div class="flex items-center gap-3 bg-rose-50 border border-rose-100 rounded-xl p-3">
              <span class="material-icons text-rose-600 text-2xl">cloud_done</span>
              <div>
                <h5 class="text-xs font-black text-rose-950">پرۆژەکەت بە فەرمی ئامادەیە بۆ بڵاوکردنەوە</h5>
                <p class="text-[10px] text-rose-500 mt-0.5">دەتوانیت بەستەری خوارەوە کۆپی بکەیت و بنێریت بۆ هاوڕێکانت یان مامۆستاکەت بۆ بینینی نایاب.</p>
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-bold text-slate-700">بەستەری گشتی پرۆژە:</span>
              <div class="flex gap-2">
                <input type="text" readonly [value]="shareURL" class="flex-1 bg-slate-50 text-[11px] p-3 rounded-xl border border-slate-200 outline-none select-all font-mono" dir="ltr">
                <button (click)="copyToClipboard.emit(shareURL)" class="bg-indigo-650 hover:bg-indigo-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs transition-colors cursor-pointer flex items-center justify-center">
                  <span class="material-icons text-sm">content_copy</span>
                </button>
              </div>
            </div>
            <span class="text-[9px] text-slate-400 text-center">بەستەرەکە بۆ ماوەی هەمیشەیی خەزن کراوە لەگەڵ داتاکانی ئەم پرۆژەیە.</span>
          </div>

          <button (click)="onClose('share')" class="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs p-3.5 text-center mt-auto cursor-pointer">داخستن</button>
        </div>
      </div>
    }

    <!-- Premium Upgrade Modal -->
    @if (modalType === 'upgrade' || showUpgradeModal) {
      <div class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" dir="rtl">
        <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col font-sans relative">
          <button (click)="onClose('upgrade')" class="absolute top-4 left-4 text-slate-400 hover:text-slate-600 bg-slate-100/60 p-1 rounded-full hover:scale-105 transition-transform z-10 cursor-pointer">
            <span class="material-icons text-sm">close</span>
          </button>

          <div class="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white p-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
            <div class="absolute -right-10 -bottom-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
            
            <div class="h-14 w-14 bg-amber-400/10 text-amber-400 rounded-full flex items-center justify-center border-2 border-amber-400/30 animate-pulse shadow-xl mb-3">
              <span class="material-icons text-3xl">star</span>
            </div>
            
            <h3 class="text-base font-black tracking-tight text-white mb-1">بەرزکردنەوە بۆ هەژماری پڕۆ (Premium Pro)</h3>
            <p class="text-[10px] text-indigo-200">کۆتایی بە لیمیتەکان بهێنە و سەرجەم تایبەتمەندییە زانستییەکان بەردەست بکە</p>
          </div>

          <div class="p-6 flex flex-col gap-4">
            <p class="text-xs text-slate-600 leading-relaxed text-right">بە هەبوونی هەژماری Premium Pro، دەتوانیت ڕۆژانە بەبێ هیچ جۆرە لیمیت یان ڕاگرتنێک سوودمەند بیت لەم تایبەتمەندییە نایابانە:</p>
            
            <div class="flex flex-col gap-2.5">
              <div class="flex items-center gap-2 text-right">
                <span class="material-icons text-emerald-500 text-base">check_circle</span>
                <span class="text-xs text-slate-700 font-bold">بێ سنوور دروستکردنی پێشکەشکردن بە ژیری دەستکردی پێشکەوتوو</span>
              </div>
              <div class="flex items-center gap-2 text-right">
                <span class="material-icons text-emerald-500 text-base">check_circle</span>
                <span class="text-xs text-slate-700 font-bold">دروستکردنی یەک چرکەیی کورتەی جێبەجێکار (Executive Summary)</span>
              </div>
              <div class="flex items-center gap-2 text-right">
                <span class="material-icons text-emerald-500 text-base">check_circle</span>
                <span class="text-xs text-slate-700 font-bold">هەناردەکردنی ڕاستەوخۆ بۆ پێکهاتەی بێوێنە و ئاڕاستەی پڕۆفیشناڵ</span>
              </div>
              <div class="flex items-center gap-2 text-right">
                <span class="material-icons text-emerald-500 text-base">check_circle</span>
                <span class="text-xs text-slate-700 font-bold">دەستپێڕاگەیشتن بە نوێترین مۆدێلەکانی Gemini پێش هەر کەسێکی تر</span>
              </div>
            </div>

            <div class="bg-indigo-50 border border-indigo-100/50 p-4 rounded-2xl flex items-center justify-between mt-1">
              <div class="text-right">
                <span class="block text-[10px] text-slate-500">یاسای نرخاندن:</span>
                <span class="block text-xs font-black text-indigo-950">سوودمەندبوونی بێ بەرامبەر (تاقیکاری)</span>
              </div>
              <span class="text-xs bg-indigo-200 text-indigo-900 border border-indigo-300 font-extrabold px-3 py-1 rounded-full">پرۆ تاقیکاری</span>
            </div>

            <button (click)="upgradeToPremium.emit()" [disabled]="isUpgrading"
              class="w-full bg-gradient-to-l from-indigo-700 to-indigo-600 hover:from-indigo-800 hover:to-indigo-700 text-white p-3.5 rounded-xl text-xs font-black shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer">
              @if (isUpgrading) {
                <span class="material-icons text-sm animate-spin">sync</span>
                <span>خەریکە هەموار دەکرێت...</span>
              } @else {
                <span class="material-icons text-sm">workspace_premium</span>
                <span>بەرزکردنەوەی هەژماری خۆم (بێبەرامبەر تاقی بکەرەوە!)</span>
              }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Expanded Teleprompter / Presenter Notes Modal -->
    @if ((modalType === 'teleprompter' || showTeleprompterModal) && effectivePresentation) {
      <div class="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100000] flex flex-col p-6 font-sans text-right" dir="rtl">
        <header class="flex items-center justify-between pb-4 border-b border-slate-800">
          <div class="flex items-center gap-3">
            <span class="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-lg flex items-center gap-1 shadow">
              <span class="material-icons text-sm">record_voice_over</span>
              دیمەنی دەق و وتەی پێشکەشکار (Teleprompter View)
            </span>
            <h3 class="text-white text-sm font-bold">
              سلایدی {{ activeSlideIndex + 1 }}: {{ effectivePresentation.slides[activeSlideIndex].title }}
            </h3>
          </div>

          <div class="flex items-center gap-3">
            <!-- Font Size Controls -->
            <div class="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-white text-xs font-bold gap-2">
              <span class="text-slate-400 px-2 text-[11px]">قەبارەی دەق:</span>
              <button (click)="teleprompterFontSize = teleprompterFontSize - 2" class="p-1 hover:bg-slate-700 rounded cursor-pointer">
                <span class="material-icons text-sm">remove</span>
              </button>
              <span class="font-mono text-indigo-400 px-1">{{ teleprompterFontSize }}px</span>
              <button (click)="teleprompterFontSize = teleprompterFontSize + 2" class="p-1 hover:bg-slate-700 rounded cursor-pointer">
                <span class="material-icons text-sm">add</span>
              </button>
            </div>

            <button (click)="copyToClipboard.emit(effectivePresentation.slides[activeSlideIndex].speakerNotes)"
              class="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer">
              <span class="material-icons text-sm">content_copy</span>
              <span>کۆپیکردنی دەقەکە</span>
            </button>

            <button (click)="onClose('teleprompter')"
              class="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl cursor-pointer">
              <span class="material-icons text-sm">close</span>
            </button>
          </div>
        </header>

        <main class="flex-1 overflow-y-auto py-8 px-4 max-w-4xl mx-auto w-full">
          <div class="bg-slate-900 border border-indigo-500/30 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col gap-6">
            <div class="flex items-center justify-between pb-4 border-b border-slate-800 text-slate-400 text-xs">
              <span class="flex items-center gap-1 text-indigo-400 font-bold">
                <span class="material-icons text-sm">campaign</span>
                دەقی فەرمی وتاری دەمی بۆ پێشکەشکار:
              </span>
              <span>⏱️ کاتی خەمڵێنراو: {{ getReadTimeInMinutes(effectivePresentation.slides[activeSlideIndex].speakerNotes) }}</span>
            </div>

            <p [style.font-size.px]="teleprompterFontSize" class="text-slate-100 leading-loose whitespace-pre-line text-justify font-sans">
              {{ effectivePresentation.slides[activeSlideIndex].speakerNotes }}
            </p>
          </div>
        </main>

        <footer class="pt-4 border-t border-slate-800 flex justify-between items-center max-w-4xl mx-auto w-full">
          <button (click)="prevSlide.emit()" [disabled]="activeSlideIndex === 0"
            class="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
            <span class="material-icons text-sm">arrow_forward</span>
            <span>سلایدی پێشوو</span>
          </button>

          <span class="text-slate-400 text-xs font-bold">
            سلایدی {{ activeSlideIndex + 1 }} لە {{ effectivePresentation.slides.length }}
          </span>

          <button (click)="nextSlide.emit()" [disabled]="activeSlideIndex === effectivePresentation.slides.length - 1"
            class="bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
            <span>سلایدی داهاتوو</span>
            <span class="material-icons text-sm">arrow_back</span>
          </button>
        </footer>
      </div>
    }

    <!-- Fullscreen Presenter Mode Overlay -->
    @if (isFullscreenMode && currentPresentation) {
      <div class="fixed inset-0 bg-slate-950/98 z-[99999] flex flex-col justify-between p-4 sm:p-8 font-sans select-none" dir="rtl">
        
        <!-- Top Action bar -->
        <div class="flex justify-between items-center pb-3 border-b border-white/10 gap-2 flex-wrap">
          <div class="flex items-center gap-3">
            <span class="bg-indigo-600 text-white text-[11px] font-black px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 shadow">
              <span class="material-icons text-xs animate-pulse">slideshow</span>
              پیشاندانی گەورەکراو (Presenter Mode)
            </span>
            <h2 class="text-white text-xs sm:text-sm font-bold truncate max-w-xs hidden md:block">
              {{ currentPresentation.title }}
            </h2>
          </div>

          <!-- Quick Actions & Theme Controls in Fullscreen Mode -->
          <div class="flex items-center gap-2 flex-wrap">
            
            <!-- Theme Selectors -->
            <div class="flex items-center bg-white/10 p-1 rounded-xl border border-white/10 gap-1">
              <button (click)="changeSlideTheme.emit('cosmic')" [class.ring-2]="slideTheme === 'cosmic'" class="h-6 w-6 rounded-lg bg-indigo-950 border border-indigo-500 cursor-pointer" title="Cosmic Dark"></button>
              <button (click)="changeSlideTheme.emit('sand')" [class.ring-2]="slideTheme === 'sand'" class="h-6 w-6 rounded-lg bg-amber-100 border border-amber-400 cursor-pointer" title="Sand Light"></button>
              <button (click)="changeSlideTheme.emit('emerald')" [class.ring-2]="slideTheme === 'emerald'" class="h-6 w-6 rounded-lg bg-emerald-950 border border-emerald-500 cursor-pointer" title="Emerald Dark"></button>
              <button (click)="changeSlideTheme.emit('charcoal')" [class.ring-2]="slideTheme === 'charcoal'" class="h-6 w-6 rounded-lg bg-stone-900 border border-stone-600 cursor-pointer" title="Charcoal Dark"></button>
            </div>

            <!-- Speaker Notes Overlay Toggle -->
            <button (click)="showSpeakerNotesInFullscreen = !showSpeakerNotesInFullscreen"
              [class]="showSpeakerNotesInFullscreen ? 'bg-amber-500 text-slate-950' : 'bg-white/10 hover:bg-white/20 text-white'"
              class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow">
              <span class="material-icons text-sm">record_voice_over</span>
              <span>تێبینی پێشکەشکار</span>
            </button>

            <!-- Download PNG -->
            <button (click)="downloadSlideAsImage.emit('fullscreen-projector-canvas')" 
              class="bg-emerald-600 hover:bg-emerald-500 text-white transition-all px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer">
              <span class="material-icons text-sm">download</span>
              <span class="hidden sm:inline">داونلۆد (PNG)</span>
            </button>

            <!-- Close Fullscreen -->
            <button (click)="toggleFullscreen.emit()" 
              class="bg-white/10 hover:bg-white/20 text-white transition-all p-2 rounded-xl flex items-center justify-center cursor-pointer" 
              title="داخستنی شاشە">
              <span class="material-icons text-base">close</span>
            </button>
          </div>
        </div>

        <!-- Main center content: Simulated 16:9 Slide Canvas -->
        <div class="my-auto flex flex-col justify-center items-center w-full max-w-6xl mx-auto py-4 min-h-0 relative">
          
          <div id="fullscreen-projector-canvas" [ngClass]="{
            'bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border-indigo-800 shadow-indigo-950/50': slideTheme === 'cosmic',
            'bg-amber-50 text-slate-900 border-amber-300 shadow-amber-100': slideTheme === 'sand',
            'bg-gradient-to-br from-zinc-950 via-emerald-950 to-stone-950 text-white border-emerald-800 shadow-emerald-950/30': slideTheme === 'emerald',
            'bg-gradient-to-r from-stone-900 to-stone-950 text-white border-stone-700 shadow-stone-950/20': slideTheme === 'charcoal'
          }" class="relative w-full aspect-auto md:aspect-[16/9] min-h-[55vh] max-w-full rounded-2xl border-2 p-6 sm:p-10 md:p-12 flex flex-col justify-between shadow-2xl overflow-y-auto transition-all duration-300">
            
            <div class="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none"></div>

            <!-- Slide Header -->
            <div class="flex justify-between items-center z-10 pb-3 border-b border-white/10">
              <div class="flex items-center gap-3">
                <span class="text-xs uppercase tracking-wider font-black px-3 py-1 rounded shadow-sm" [ngClass]="{
                  'bg-indigo-950 text-indigo-200 border border-indigo-700/60': slideTheme === 'cosmic',
                  'bg-amber-200/80 text-amber-950 border border-amber-300': slideTheme === 'sand',
                  'bg-emerald-950 text-emerald-200 border border-emerald-700': slideTheme === 'emerald',
                  'bg-stone-800 text-stone-200 border border-stone-600': slideTheme === 'charcoal'
                }">
                  سلایدی {{ currentPresentation.slides[activeSlideIndex].slideNumber || (activeSlideIndex + 1) }}
                </span>
              </div>
              <div class="text-xs font-black uppercase flex items-center gap-1.5" [ngClass]="{
                'text-indigo-200': slideTheme === 'cosmic',
                'text-amber-950': slideTheme === 'sand',
                'text-emerald-200': slideTheme === 'emerald',
                'text-stone-200': slideTheme === 'charcoal'
              }">
                <span class="material-icons text-sm">school</span>
                <span>{{ getKurdishLevelName(currentPresentation.academicLevel) }}</span>
                <span class="material-icons text-sm text-blue-500">verified</span>
              </div>
            </div>

            <!-- Slide Body -->
            <div class="my-auto z-10 grid grid-cols-1 md:grid-cols-12 gap-8 w-full items-start text-right py-4">
              
              <div class="md:col-span-8 flex flex-col gap-4">
                <h2 class="text-lg sm:text-xl md:text-2xl lg:text-3xl font-black tracking-tight" [ngClass]="{
                  'text-indigo-100': slideTheme === 'cosmic',
                  'text-slate-900': slideTheme === 'sand',
                  'text-emerald-100': slideTheme === 'emerald',
                  'text-amber-200': slideTheme === 'charcoal'
                }">
                  {{ currentPresentation.slides[activeSlideIndex].title }}
                </h2>
                
                <ul class="flex flex-col gap-3 relative mt-2">
                  @for (bullet of currentPresentation.slides[activeSlideIndex].points; track bullet) {
                    <li class="flex items-start gap-2.5 text-xs sm:text-sm md:text-base leading-relaxed" [ngClass]="{
                      'text-slate-100 font-semibold': slideTheme === 'cosmic' || slideTheme === 'emerald',
                      'text-slate-800 font-bold': slideTheme === 'sand',
                      'text-stone-100 font-semibold': slideTheme === 'charcoal'
                    }">
                      <span class="text-base select-none shrink-0" [ngClass]="{
                        'text-indigo-300 font-black': slideTheme === 'cosmic',
                        'text-amber-700 font-black': slideTheme === 'sand',
                        'text-emerald-400 font-black': slideTheme === 'emerald',
                        'text-amber-400 font-black': slideTheme === 'charcoal'
                      }">◈</span>
                      <span class="leading-relaxed break-words">{{ bullet }}</span>
                    </li>
                  }
                </ul>
              </div>

              <!-- Graphic visual side preview -->
              <div class="md:col-span-4 flex flex-col gap-4 bg-slate-900/45 backdrop-blur p-4 rounded-xl border border-white/5 shadow-inner">
                <div class="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 shadow">
                  @if (currentPresentation.slides[activeSlideIndex].aiImage) {
                    <img 
                      [src]="'data:image/jpeg;base64,' + currentPresentation.slides[activeSlideIndex].aiImage"
                      alt="وێنەی دروستکراوی AI" 
                      referrerpolicy="no-referrer"
                      class="object-cover w-full h-full filter brightness-95 saturate-110">
                  } @else {
                    <img 
                      [src]="'https://picsum.photos/seed/' + currentPresentation.slides[activeSlideIndex].title + '/300/180'"
                      alt="وێنەی هاوپێچی فەرمی" 
                      referrerpolicy="no-referrer"
                      class="object-cover w-full h-full filter brightness-90 saturate-110">
                  }
                </div>

                <div class="flex flex-col gap-2">
                  <div class="flex justify-between items-center text-[10px] font-bold opacity-80 uppercase leading-none">
                    <span class="flex items-center gap-0.5 text-white">
                      <span class="material-icons text-[11px] text-indigo-400">assessment</span>
                      بایەخ و گرنگی زانستی
                    </span>
                    <span class="font-mono text-[9px] text-emerald-400">چالاکە</span>
                  </div>
                  <div class="flex flex-col gap-1.5 text-white">
                    <div class="flex flex-col gap-0.5">
                      <div class="flex justify-between text-[9px] opacity-90">
                        <span>بایەخ و قووڵی بابەت</span>
                        <span class="font-mono">85%</span>
                      </div>
                      <div class="w-full bg-black/60 rounded-full h-1 overflow-hidden">
                        <div class="bg-indigo-400 h-1 rounded-full" style="width: 85%"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            <!-- Slide Footer -->
            <div class="flex justify-between items-end border-t pt-3 border-dashed z-10" [ngClass]="{
              'border-slate-800': slideTheme === 'cosmic',
              'border-amber-200': slideTheme === 'sand',
              'border-emerald-900': slideTheme === 'emerald',
              'border-stone-800': slideTheme === 'charcoal'
            }">
              <div>
                <span class="text-[10px] sm:text-xs font-bold block" [ngClass]="{
                  'text-indigo-400': slideTheme === 'cosmic',
                  'text-amber-800': slideTheme === 'sand',
                  'text-emerald-400': slideTheme === 'emerald',
                  'text-stone-400': slideTheme === 'charcoal'
                }">{{ currentPresentation.title }}</span>
              </div>
              <div class="text-xs sm:text-sm font-black">
                {{ activeSlideIndex + 1 }} / {{ currentPresentation.slides.length }}
              </div>
            </div>

          </div>

          <!-- Floating Speaker Notes Box inside Fullscreen Presenter Mode -->
          @if (showSpeakerNotesInFullscreen) {
            <div class="w-full mt-3 bg-slate-900/95 border-2 border-amber-400/60 rounded-2xl p-4 shadow-2xl text-right animate-fade-in max-h-48 overflow-y-auto z-20">
              <div class="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                <span class="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <span class="material-icons text-sm">campaign</span>
                  وتەی پێشکەشکار بۆ ئەم سلایدە (Speaker Notes):
                </span>
                <button (click)="showSpeakerNotesInFullscreen = false" class="text-slate-400 hover:text-white cursor-pointer">
                  <span class="material-icons text-xs">close</span>
                </button>
              </div>
              <p class="text-xs sm:text-sm text-slate-100 leading-relaxed font-normal whitespace-pre-line">
                {{ currentPresentation.slides[activeSlideIndex].speakerNotes }}
              </p>
            </div>
          }
        </div>

        <!-- Bottom Controls Bar -->
        <div class="flex justify-between items-center pt-3 border-t border-white/10 gap-2 flex-wrap">
          
          <!-- Slide Jump Selector Pills -->
          <div class="flex items-center gap-1.5 overflow-x-auto max-w-md py-1 scrollbar-none">
            @for (s of currentPresentation.slides; track s.title; let idx = $index) {
              <button (click)="selectSlide.emit(idx)"
                [class]="activeSlideIndex === idx ? 'bg-indigo-600 text-white font-black scale-105 shadow' : 'bg-white/10 hover:bg-white/20 text-slate-300 font-bold'"
                class="px-2.5 py-1 rounded-lg text-xs transition-all cursor-pointer shrink-0">
                {{ idx + 1 }}
              </button>
            }
          </div>

          <!-- Slide Nav Buttons -->
          <div class="flex items-center gap-3">
            <button (click)="prevSlide.emit()" [disabled]="activeSlideIndex === 0"
              class="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
              <span class="material-icons text-sm">arrow_forward</span>
              <span>پێشوو</span>
            </button>

            <span class="text-white text-xs font-black bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
              {{ activeSlideIndex + 1 }} / {{ currentPresentation.slides.length }}
            </span>

            <button (click)="nextSlide.emit()" [disabled]="activeSlideIndex === currentPresentation.slides.length - 1"
              class="bg-white/10 hover:bg-white/20 disabled:opacity-30 text-white transition-all px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer">
              <span>داهاتوو</span>
              <span class="material-icons text-sm">arrow_back</span>
            </button>
          </div>
        </div>

      </div>
    }
  `
})
export class PresentationModalsComponent {
  private presentationService = inject(PresentationService);

  @Input() modalType: string | null = null;
  @Input() showOutlineModal = false;
  @Input() showShareModal = false;
  @Input() showUpgradeModal = false;
  @Input() isFullscreenMode = false;
  @Input() showTeleprompterModal = false;
  @Input() currentPresentation: Presentation | null = null;
  @Input() activeSlideIndex = 0;
  @Input() slideTheme: SlideTheme = 'cosmic';
  @Input() shareURL = '';
  @Input() isUpgrading = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() closeOutlineModal = new EventEmitter<void>();
  @Output() closeShareModal = new EventEmitter<void>();
  @Output() closeUpgradeModal = new EventEmitter<void>();
  @Output() closeTeleprompterModal = new EventEmitter<void>();
  @Output() toggleFullscreen = new EventEmitter<void>();
  @Output() selectSlide = new EventEmitter<number>();
  @Output() copyToClipboard = new EventEmitter<string>();
  @Output() upgradeToPremium = new EventEmitter<void>();
  @Output() prevSlide = new EventEmitter<void>();
  @Output() nextSlide = new EventEmitter<void>();
  @Output() downloadSlideAsImage = new EventEmitter<string>();
  @Output() changeSlideTheme = new EventEmitter<SlideTheme>();

  showSpeakerNotesInFullscreen = false;
  teleprompterFontSize = 18;

  get effectivePresentation(): Presentation | null {
    return this.currentPresentation || this.presentationService.currentPresentation();
  }

  onClose(type?: string): void {
    this.closeModal.emit();
    if (type === 'outline') this.closeOutlineModal.emit();
    if (type === 'share') this.closeShareModal.emit();
    if (type === 'upgrade') this.closeUpgradeModal.emit();
    if (type === 'teleprompter') this.closeTeleprompterModal.emit();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent) {
    if (!this.isFullscreenMode && !this.showTeleprompterModal) return;
    
    // Ignore key presses if user is typing in an input or textarea
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
      event.preventDefault();
      this.nextSlide.emit();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      this.prevSlide.emit();
    } else if (event.key === 'Escape') {
      if (this.isFullscreenMode) this.toggleFullscreen.emit();
      if (this.showTeleprompterModal) this.closeTeleprompterModal.emit();
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

  getReadTimeInMinutes(text: string): string {
    if (!text) return '١ خولەک';
    const words = text.trim().split(/\s+/).length;
    const mins = Math.max(1, Math.ceil(words / 100));
    return `${mins} خولەک`;
  }
}

