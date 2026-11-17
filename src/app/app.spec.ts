import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { AppComponent, App } from './app';

describe('AppComponent', () => {
  it('should be defined', () => {
    expect(AppComponent).toBeDefined();
  });

  it('should export App alias matching AppComponent', () => {
    expect(App).toBe(AppComponent);
  });
});
