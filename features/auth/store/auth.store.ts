import { create } from "zustand";

import { signInMock } from "@/features/auth/services/auth.service";
import { AuthUser, SignInPayload } from "@/features/auth/types";

type AuthState = {
  user?: AuthUser;
  signingIn: boolean;
  error?: string;
  signIn: (payload: SignInPayload) => Promise<boolean>;
  signOut: () => void;
  isSignedIn: () => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: undefined,
  signingIn: false,
  error: undefined,
  async signIn(payload) {
    set({ signingIn: true, error: undefined });
    try {
      const user = await signInMock(payload);
      set({ user, signingIn: false });
      return true;
    } catch (error) {
      set({
        signingIn: false,
        error: error instanceof Error ? error.message : "Unable to sign in"
      });
      return false;
    }
  },
  signOut() {
    set({ user: undefined });
  },
  isSignedIn() {
    return Boolean(get().user);
  }
}));