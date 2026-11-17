import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TimerService implements OnDestroy {
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  isRunning = false;
  timerSeconds = 0;

  toggleTimer(onTick: (secs: number) => void): boolean {
    if (this.isRunning) {
      this.pauseTimer();
      return false;
    } else {
      this.startTimer(onTick);
      return true;
    }
  }

  startTimer(onTick: (secs: number) => void): void {
    this.pauseTimer();
    this.isRunning = true;
    this.timerSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      onTick(this.timerSeconds);
    }, 1000);
  }

  pauseTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    this.isRunning = false;
  }

  resetTimer(): void {
    this.pauseTimer();
    this.timerSeconds = 0;
  }

  formatTime(totalSecs: number): string {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.pauseTimer();
  }
}
