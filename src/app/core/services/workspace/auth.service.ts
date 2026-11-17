import { Injectable, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { User } from 'firebase/auth';
import { UserProfile, TrialStatus } from '../../models/auth.model';
import { SecureStorageUtils } from '../../utils/secure-storage.utils';
import { initAuth, googleSignIn, logoutUser, getFirebaseIdToken } from './firebase-auth-client';
import { STORAGE_KEYS, TRIAL_CONFIG } from '../../constants/app.constants';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  private static readonly AUTH_STORAGE_KEY = 'kurdish_ai_authenticated_profile';

  // بەڕێوەبردنی دۆخی بەکارهێنەر بە Angular Signals
  private readonly currentUserSignal = signal<UserProfile | null>(null);
  private readonly loadingSignal = signal<boolean>(true);

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = this.loadingSignal.asReadonly();

  // بەڕێوەبردنی کلاود و پاشکۆکانی گەڕانەوە (Callbacks)
  private readonly authSuccessCallbacks: ((user: User, token: string) => void)[] = [];
  private readonly authFailureCallbacks: (() => void)[] = [];
  private rawFirebaseUser: User | null = null;
  private currentAccessToken: string | null = null;
  private currentFirebaseIdToken: string | null = null;

  constructor() {
    if (this.isBrowser) {
      this.restoreCachedSession();
      this.initFirebaseAuthListener();
    } else {
      // لە دۆخی SSR ڕاستەوخۆ بارکردن دەوەستێنرێت تا هەڵە ڕوونەدات
      this.loadingSignal.set(false);
    }
  }

  /**
   * بارکردنەوەی هەژماری بەکارهێنەر لە کۆگای پارێزراو بۆ خێراکردنی نیشاندان
   */
  private async restoreCachedSession(): Promise<void> {
    try {
      const cached = await SecureStorageUtils.getSecureItem<UserProfile>(AuthService.AUTH_STORAGE_KEY);
      if (cached && !this.currentUserSignal()) {
        this.currentUserSignal.set(cached);
      }
    } catch (err) {
      console.warn('شکست لە هێنانەوەی زانیاری پارێزراو:', err);
    }
  }

  /**
   * لۆژیکی گوازراوە لە src/app/firebase-auth.ts
   */
  private initFirebaseAuthListener(): void {
    try {
      initAuth(
        (user: User, token: string) => {
          this.rawFirebaseUser = user;
          this.currentAccessToken = token;
          this.currentFirebaseIdToken = token;

          const profile: UserProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            accessToken: token,
            emailVerified: user.emailVerified
          };

          this.currentUserSignal.set(profile);
          this.loadingSignal.set(false);
          SecureStorageUtils.saveSecureItem(AuthService.AUTH_STORAGE_KEY, profile);

          for (const cb of this.authSuccessCallbacks) {
            cb(user, token);
          }
        },
        () => {
          this.rawFirebaseUser = null;
          this.currentAccessToken = null;
          this.currentFirebaseIdToken = null;
          this.currentUserSignal.set(null);
          this.loadingSignal.set(false);
          SecureStorageUtils.clearSecureItem(AuthService.AUTH_STORAGE_KEY);

          for (const cb of this.authFailureCallbacks) {
            cb();
          }
        }
      );
    } catch (err) {
      console.warn('هەڵە لە چالاککردنی گوێگری Firebase Auth:', err);
      this.loadingSignal.set(false);
    }
  }

  /**
   * چوونەژوورەوەی پارێزراو بە هەژماری Google
   */
  async signInWithGoogle(): Promise<{ user: User; accessToken: string; profile: UserProfile } | null> {
    if (!this.isBrowser) return null;

    try {
      this.loadingSignal.set(true);
      const result = await googleSignIn();
      if (!result) {
        return null;
      }

      this.rawFirebaseUser = result.user;
      this.currentAccessToken = result.accessToken;
      this.currentFirebaseIdToken = result.idToken;

      const profile: UserProfile = {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        accessToken: result.accessToken,
        emailVerified: result.user.emailVerified
      };

      this.currentUserSignal.set(profile);
      await SecureStorageUtils.saveSecureItem(AuthService.AUTH_STORAGE_KEY, profile);

      for (const cb of this.authSuccessCallbacks) {
        cb(result.user, result.accessToken);
      }

      return {
        user: result.user,
        accessToken: result.accessToken,
        profile
      };
    } catch (error) {
      console.error('هەڵەی چوونەژوورەوە لە ڕێگەی Google:', error);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * دەرچوون لە هەژمار و پاککردنەوەی داتای پارێزراو
   */
  async signOutUser(): Promise<void> {
    if (!this.isBrowser) return;

    try {
      await logoutUser();
    } catch (err) {
      console.error('هەڵە لە دەرچوونی بەکارهێنەر:', err);
    }

    SecureStorageUtils.clearSecureItem(AuthService.AUTH_STORAGE_KEY);
    this.rawFirebaseUser = null;
    this.currentAccessToken = null;
    this.currentFirebaseIdToken = null;
    this.currentUserSignal.set(null);

    for (const cb of this.authFailureCallbacks) {
      cb();
    }
  }

  /**
   * هاوتایی لەگەڵ میتۆدی signOutی پێشوو
   */
  async signOut(): Promise<void> {
    await this.signOutUser();
  }

  /**
   * بەستنەوەی گوێگری دۆخی Firebase Auth بۆ بەشە کۆنەکان
   */
  initGoogleAuth(
    onUserChanged: (user: User | null, token: string | null) => void,
    onLoggedOut: () => void
  ): void {
    this.authSuccessCallbacks.push((user, token) => onUserChanged(user, token));
    this.authFailureCallbacks.push(onLoggedOut);

    if (this.isBrowser && this.currentUserSignal()) {
      onUserChanged(this.rawFirebaseUser, this.currentAccessToken);
    }
  }

  /**
   * وەرگرتنی تۆکنی بەردەست
   */
  getAccessToken(): string | null {
    return this.currentAccessToken;
  }

  async getFirebaseIdToken(): Promise<string | null> {
    if (this.currentFirebaseIdToken) return this.currentFirebaseIdToken;
    this.currentFirebaseIdToken = await getFirebaseIdToken();
    return this.currentFirebaseIdToken;
  }

  /**
   * بەڕێوەبردنی دۆخی بەکارهێنانی تاقیکاری و پرۆ (Trial & Premium Status)
   */
  getTrialStatus(): TrialStatus {
    let dailyGenerationsCount = TRIAL_CONFIG.DEFAULT_DAILY_COUNT;
    let isPremiumUser = false;

    if (this.isBrowser && typeof localStorage !== 'undefined') {
      try {
        const storedCount = localStorage.getItem(STORAGE_KEYS.DAILY_COUNT);
        if (storedCount !== null) {
          dailyGenerationsCount = parseInt(storedCount, 10);
        } else {
          localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, String(dailyGenerationsCount));
        }

        const storedPremium = localStorage.getItem(STORAGE_KEYS.PREMIUM_ACTIVE);
        if (storedPremium === 'true') {
          isPremiumUser = true;
        }
      } catch (e) {
        console.error('هەڵە لە خوێندنەوەی دۆخی تاقیکاری لە localStorage:', e);
      }
    }

    return {
      dailyGenerationsCount,
      dailyLimit: TRIAL_CONFIG.DAILY_LIMIT,
      isPremiumUser
    };
  }

  incrementDailyCount(currentCount: number, limit: number): number {
    const newCount = Math.min(currentCount + 1, limit);
    if (this.isBrowser && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, String(newCount));
      } catch (e) {
        console.error(e);
      }
    }
    return newCount;
  }

  resetDailyCount(): void {
    if (this.isBrowser && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.DAILY_COUNT, '0');
      } catch (e) {
        console.error(e);
      }
    }
  }

  setPremiumActive(active: boolean): void {
    if (this.isBrowser && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEYS.PREMIUM_ACTIVE, active ? 'true' : 'false');
      } catch (e) {
        console.error(e);
      }
    }
  }
}
