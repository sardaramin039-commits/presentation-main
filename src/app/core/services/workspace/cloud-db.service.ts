import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  Firestore,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  getDocFromServer,
  getDoc
} from 'firebase/firestore';
import { Slide } from '../../models/presentation.model';
import firebaseConfig from '../../../../../firebase-applet-config.json';

export interface FirebasePresentation {
  id: string;
  title: string;
  topic: string;
  academicLevel: 'qutabxana' | 'bachelor' | 'postgrad';
  createdAt: string;
  slides: Slide[];
  executiveSummary?: string;
  slideTheme?: string;
  exportTheme?: string;
  transitionStyle?: string;
}

export interface UserPreferences {
  isPremiumUser: boolean;
  dailyGenerationsCount: number;
  lastGenerationDate: string;
}

// Function to safely obtain Firestore instance in client environment
function getSafeFirestore(): Firestore | null {
  if (typeof window === 'undefined') return null;
  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    return getFirestore(app);
  } catch (e) {
    console.warn('Firebase Firestore initialization skipped or failed:', e);
    return null;
  }
}

export const db: Firestore | null = getSafeFirestore();

/**
 * Validates connection to firestore server securely
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  const firestore = db || getSafeFirestore();
  if (!firestore) return false;

  try {
    const testDocRef = doc(firestore, 'test', 'connection');
    await getDocFromServer(testDocRef);
    console.log('Firebase connection validated successfully.');
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore client is currently offline. Please check network or config.');
    } else {
      console.warn('Firestore connection warning (could be running first-time):', error);
    }
    return false;
  }
}

/**
 * Saves a presentation to firestore under user's nested collection
 */
export async function savePresentationToCloud(userId: string, presentation: FirebasePresentation): Promise<void> {
  const firestore = db || getSafeFirestore();
  if (!firestore) return;
  const docRef = doc(firestore, 'users', userId, 'presentations', presentation.id);
  await setDoc(docRef, presentation, { merge: true });
}

/**
 * Loads all presentations for a specific user from cloud
 */
export async function loadPresentationsFromCloud(userId: string): Promise<FirebasePresentation[]> {
  const firestore = db || getSafeFirestore();
  if (!firestore) return [];
  const colRef = collection(firestore, 'users', userId, 'presentations');
  const snap = await getDocs(colRef);
  const presentations: FirebasePresentation[] = [];
  snap.forEach((docSnap) => {
    presentations.push(docSnap.data() as FirebasePresentation);
  });
  return presentations;
}

/**
 * Deletes a cloud-saved presentation
 */
export async function deletePresentationFromCloud(userId: string, presentationId: string): Promise<void> {
  const firestore = db || getSafeFirestore();
  if (!firestore) return;
  const docRef = doc(firestore, 'users', userId, 'presentations', presentationId);
  await deleteDoc(docRef);
}

/**
 * Saves the user preference states to cloud
 */
export async function savePreferencesToCloud(userId: string, prefs: UserPreferences): Promise<void> {
  const firestore = db || getSafeFirestore();
  if (!firestore) return;
  const docRef = doc(firestore, 'users', userId, 'preferences', 'config');
  await setDoc(docRef, prefs, { merge: true });
}

/**
 * Loads user preferences from cloud
 */
export async function loadPreferencesFromCloud(userId: string): Promise<UserPreferences | null> {
  const firestore = db || getSafeFirestore();
  if (!firestore) return null;
  const docRef = doc(firestore, 'users', userId, 'preferences', 'config');
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as UserPreferences;
  }
  return null;
}

@Injectable({
  providedIn: 'root'
})
export class CloudDbService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  async validateConnection(): Promise<boolean> {
    if (!this.isBrowser) return false;
    return validateFirestoreConnection();
  }

  async savePresentation(userId: string, presentation: FirebasePresentation): Promise<void> {
    if (!this.isBrowser) return;
    return savePresentationToCloud(userId, presentation);
  }

  async loadPresentations(userId: string): Promise<FirebasePresentation[]> {
    if (!this.isBrowser) return [];
    return loadPresentationsFromCloud(userId);
  }

  async deletePresentation(userId: string, presentationId: string): Promise<void> {
    if (!this.isBrowser) return;
    return deletePresentationFromCloud(userId, presentationId);
  }

  async savePreferences(userId: string, prefs: UserPreferences): Promise<void> {
    if (!this.isBrowser) return;
    return savePreferencesToCloud(userId, prefs);
  }

  async loadPreferences(userId: string): Promise<UserPreferences | null> {
    if (!this.isBrowser) return null;
    return loadPreferencesFromCloud(userId);
  }
}
