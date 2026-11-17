import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Injector, PLATFORM_ID, runInInjectionContext } from '@angular/core';
import { AuthService } from './auth.service';
import { User } from 'firebase/auth';

vi.mock('@angular/common', () => ({
  isPlatformBrowser: (platformId: unknown) => platformId === 'browser'
}));

const mockFirebaseUser = {
  uid: 'user_123',
  email: 'researcher@univ.krd',
  displayName: 'د. ئاراس ئەحمەد',
  photoURL: 'https://avatar.com/photo.jpg',
  emailVerified: true
} as unknown as User;

let registeredAuthSuccessCb: ((user: User, token: string) => void) | null = null;
let registeredAuthFailureCb: (() => void) | null = null;

vi.mock('./firebase-auth-client', () => ({
  auth: {},
  initAuth: vi.fn((successCb, failureCb) => {
    registeredAuthSuccessCb = successCb;
    registeredAuthFailureCb = failureCb;
  }),
  googleSignIn: vi.fn().mockResolvedValue({
    user: {
      uid: 'user_123',
      email: 'researcher@univ.krd',
      displayName: 'د. ئاراس ئەحمەد',
      photoURL: 'https://avatar.com/photo.jpg',
      emailVerified: true
    },
    accessToken: 'mock_token_abc'
  }),
  logoutUser: vi.fn().mockResolvedValue(undefined)
}));

describe('AuthService', () => {
  let browserInjector: Injector;
  let serverInjector: Injector;

  beforeEach(() => {
    vi.clearAllMocks();
    registeredAuthSuccessCb = null;
    registeredAuthFailureCb = null;

    browserInjector = Injector.create({
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    serverInjector = Injector.create({
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' }
      ]
    });
  });

  it('should initialize with signals in browser mode', () => {
    const service = runInInjectionContext(browserInjector, () => new AuthService());
    expect(service).toBeDefined();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should handle SSR mode safely without hanging', () => {
    const service = runInInjectionContext(serverInjector, () => new AuthService());
    expect(service.isLoading()).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(service.currentUser()).toBeNull();
  });

  it('should sign in with Google and update currentUser signal', async () => {
    const service = runInInjectionContext(browserInjector, () => new AuthService());
    const result = await service.signInWithGoogle();

    expect(result).not.toBeNull();
    expect(result?.user.uid).toBe('user_123');
    expect(result?.accessToken).toBe('mock_token_abc');
    expect(service.currentUser()?.email).toBe('researcher@univ.krd');
    expect(service.isAuthenticated()).toBe(true);
    expect(service.isLoading()).toBe(false);
  });

  it('should handle onAuthStateChanged events properly', () => {
    const service = runInInjectionContext(browserInjector, () => new AuthService());

    if (registeredAuthSuccessCb) {
      registeredAuthSuccessCb(mockFirebaseUser, 'token_xyz');
      expect(service.currentUser()?.uid).toBe('user_123');
      expect(service.isAuthenticated()).toBe(true);
      expect(service.getAccessToken()).toBe('token_xyz');
    }

    if (registeredAuthFailureCb) {
      registeredAuthFailureCb();
      expect(service.currentUser()).toBeNull();
      expect(service.isAuthenticated()).toBe(false);
      expect(service.getAccessToken()).toBeNull();
    }
  });

  it('should reset user signal and clear session on signOutUser', async () => {
    const service = runInInjectionContext(browserInjector, () => new AuthService());
    await service.signInWithGoogle();
    expect(service.isAuthenticated()).toBe(true);

    await service.signOutUser();
    expect(service.currentUser()).toBeNull();
    expect(service.isAuthenticated()).toBe(false);
  });

  it('should manage trial status and daily limits correctly', () => {
    const service = runInInjectionContext(browserInjector, () => new AuthService());
    const initialStatus = service.getTrialStatus();
    expect(initialStatus.dailyLimit).toBeGreaterThan(0);

    const incremented = service.incrementDailyCount(1, 5);
    expect(incremented).toBe(2);

    service.resetDailyCount();
    expect(service.getTrialStatus().dailyGenerationsCount).toBe(0);

    service.setPremiumActive(true);
    expect(service.getTrialStatus().isPremiumUser).toBe(true);
  });
});
