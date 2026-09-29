import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  type User,
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, rtdb } from '../firebase/config';
import type { UserRole } from '../types';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  /** Still resolving the initial auth state or the role lookup. */
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  /** Creates the account, writes its role to /users/{uid}, and signs in. */
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  /** Emails a password-reset link. Resolves even if the address is unknown (no account enumeration). */
  resetPassword: (email: string) => Promise<void>;
  /** Switches the signed-in account between farmer and producer. */
  changeRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, role: null, loading: true });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, role: null, loading: false });
        return;
      }
      try {
        const snap = await get(ref(rtdb, `users/${user.uid}/role`));
        const role = (snap.exists() ? (snap.val() as UserRole) : 'farmer');
        setState({ user, role, loading: false });
      } catch {
        // Realtime Database unreachable/misconfigured — still let them in as a farmer
        // rather than locking the whole app out.
        setState({ user, role: 'farmer', loading: false });
      }
    });
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signup = async (email: string, password: string, name: string, role: UserRole) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
    await set(ref(rtdb, `users/${cred.user.uid}`), {
      name: name.trim() || null,
      role,
      createdAt: Date.now(),
    });
    setState({ user: cred.user, role, loading: false });
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      // Don't reveal whether an account exists for this address.
      const code = (err as { code?: string })?.code ?? '';
      if (code.includes('user-not-found')) return;
      throw err;
    }
  };

  const changeRole = async (newRole: UserRole) => {
    if (!auth.currentUser) throw new Error('Not signed in');
    await set(ref(rtdb, `users/${auth.currentUser.uid}/role`), newRole);
    setState((s) => ({ ...s, role: newRole }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, resetPassword, changeRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
