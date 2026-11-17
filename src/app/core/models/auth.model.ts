import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  accessToken?: string | null;
  emailVerified?: boolean;
}

export interface UserAuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  errorMessage: string;
}

export interface TrialStatus {
  dailyGenerationsCount: number;
  dailyLimit: number;
  isPremiumUser: boolean;
}
