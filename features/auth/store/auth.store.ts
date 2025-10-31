// features/auth/store/auth.store.ts
import { firebaseSignIn, firebaseSignOut } from '@/features/auth/services/auth.service';
import { AuthUser, SignInPayload } from '@/features/auth/types';
import { create } from 'zustand';
import { storageClear } from '@/core/storage/storage';
import { apolloClient } from '@/core/graphql/apolloClient';
import { ME_QUERY } from '@/core/graphql/queries';

type AuthState = {
  user?: AuthUser;
  signingIn: boolean;
  error?: string;
  signIn: (payload: SignInPayload) => Promise<boolean>;
  hydrateUserFromGraphQL: () => Promise<void>;
  signOut: () => Promise<void>;
  isSignedIn: () => boolean;
  hydrated: boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: undefined,
  signingIn: false,
  error: undefined,
  hydrated: false,

  async signIn(payload) {
    set({ signingIn: true, error: undefined });
    try {
      const user = await firebaseSignIn(payload);
      // Set provisional user from Firebase; details will be enriched by hydrateUserFromGraphQL()
      set({ user, signingIn: false });
      return true;
    } catch (error) {
      set({
        signingIn: false,
        error: 'Incorrect email or password. Please verify and try again.',
      });
      return false;
    }
  },

  async hydrateUserFromGraphQL() {
    try {
      const { data } = await apolloClient.query<{ me: Partial<AuthUser> | null}>({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      });
      const me = data?.me ?? undefined;
      if (!me) return;
      const current = get().user ?? {} as AuthUser;
      set({
        user: {
          ...current,
          ...me,
          name: me.name ?? current.name ?? 'No Name',
          email: me.email ?? current.email ?? '',
          phone: (me as any).phone ?? current.phone ?? '',
          gender: (me as any).gender ?? current.gender ?? 'N/A',
        },
        hydrated: true,
      });
    } catch {
      // Ignore hydration errors silently
    }
  },

  async signOut() {
    await firebaseSignOut();
    await storageClear();
    set({ user: undefined, error: undefined, hydrated: false });
  },

  isSignedIn() {
    return Boolean(get().user);
  },
}));
