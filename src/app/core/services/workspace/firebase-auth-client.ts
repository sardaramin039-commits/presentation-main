import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  Auth
} from 'firebase/auth';
import firebaseConfig from '../../../../../firebase-applet-config.json';

// Keep Google OAuth and Firebase ID tokens separate: they serve different APIs.
let cachedAccessToken: string | null = null;
let cachedFirebaseIdToken: string | null = null;

/**
 * Safely retrieves or initializes the Firebase Auth instance
 */
export function getSafeAuth(): Auth | null {
  if (typeof window === 'undefined') return null;
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return getAuth(app);
  } catch (error) {
    console.warn('Firebase Auth initialization warning:', error);
    return null;
  }
}

export const auth: Auth | null = getSafeAuth();

/**
 * Initializes the auth listener to keep cache in sync
 */
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  const currentAuth = auth || getSafeAuth();
  if (!currentAuth) {
    if (onAuthFailure) onAuthFailure();
    return () => {
      // Unsubscribe no-op when Firebase Auth is unavailable in SSR
    };
  }

  return onAuthStateChanged(currentAuth, async (user: User | null) => {
    if (user) {
      try {
        cachedFirebaseIdToken = await user.getIdToken();
        if (onAuthSuccess && cachedFirebaseIdToken) onAuthSuccess(user, cachedFirebaseIdToken);
      } catch (error) {
        console.warn('Failed to refresh Firebase ID token:', error);
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      cachedFirebaseIdToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Executes a popup-based login to Google and gains Slides/Drive permission scopes
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string; idToken: string } | null> => {
  const currentAuth = auth || getSafeAuth();
  if (!currentAuth) {
    throw new Error('Firebase Auth is not available in current environment.');
  }

  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/presentations');
  provider.addScope('https://www.googleapis.com/auth/drive.file');

  try {
    const result = await signInWithPopup(currentAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign in.');
    }
    cachedAccessToken = credential.accessToken;
    cachedFirebaseIdToken = await result.user.getIdToken(true);
    return { user: result.user, accessToken: cachedAccessToken, idToken: cachedFirebaseIdToken };
  } catch (error: unknown) {
    console.error('Kurdish App Google Sign in error:', error);
    throw error;
  }
};

/**
 * Fetches the currently cached access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const getFirebaseIdToken = async (): Promise<string | null> => {
  if (cachedFirebaseIdToken) return cachedFirebaseIdToken;
  const currentAuth = auth || getSafeAuth();
  const user = currentAuth?.currentUser;
  if (!user) return null;
  cachedFirebaseIdToken = await user.getIdToken();
  return cachedFirebaseIdToken;
};

/**
 * Signs the user out and clears the memory cache
 */
export const logoutUser = async (): Promise<void> => {
  const currentAuth = auth || getSafeAuth();
  if (currentAuth) {
    await signOut(currentAuth);
  }
  cachedAccessToken = null;
  cachedFirebaseIdToken = null;
};
