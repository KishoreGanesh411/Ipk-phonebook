// features/auth/services/auth.service.ts
import { auth } from '@/core/firebase/firebaseConfig';
import { AuthUser, SignInPayload } from '@/features/auth/types';
import { signInWithEmailAndPassword } from 'firebase/auth';

export async function firebaseSignIn({ email, password }: SignInPayload): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(auth, email.trim(), password);

  const user = result.user;
  const token = await user.getIdToken();

  return {
    email: user.email ?? '',
    name: user.displayName ?? 'No Name',
    phone: user.phoneNumber ?? '',
    gender: 'N/A',
    department: 'N/A',
    uid: user.uid,
    token,
  };
}

export async function firebaseSignOut(): Promise<void> {
  await auth.signOut();
}
