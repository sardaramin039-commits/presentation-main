import '@angular/compiler';
import { getTestBed } from '@angular/core/testing';
import { BrowserTestingModule, platformBrowserTesting } from '@angular/platform-browser/testing';
import { expect } from 'vitest';

try {
  getTestBed().initTestEnvironment(
    BrowserTestingModule,
    platformBrowserTesting(),
    { teardown: { destroyAfterEach: true } }
  );
} catch {
  // Environment already initialized or handled
}

expect.extend({
  toBeTrue(received: unknown) {
    const pass = received === true;
    return {
      pass,
      message: () => `expected ${received} to be true`
    };
  },
  toBeFalse(received: unknown) {
    const pass = received === false;
    return {
      pass,
      message: () => `expected ${received} to be false`
    };
  }
});
