import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  auth,
  isFirebaseConfigured,
  loginWithGooglePopup,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  onAuthStateChanged,
} from '../services/firebase';
import { setAuthTokenProvider } from '../services/api';

export type UserRole = 'RESEARCHER' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  isAnonymous?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  isFirebaseConfigured: boolean;
  signInWithGoogle: (targetRole?: UserRole) => Promise<void>;
  signInWithEmail: (email: string, pass: string, targetRole?: UserRole) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string, targetRole?: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_USER_STORAGE_KEY = 'pharmalens_user_session';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Configure api token provider
  useEffect(() => {
    setAuthTokenProvider(async () => {
      if (auth?.currentUser) {
        return await auth.currentUser.getIdToken();
      }
      return token || (user?.role === 'ADMIN' ? 'dev-token-admin' : 'dev-token-researcher');
    });
  }, [token, user]);

  useEffect(() => {
    if (isFirebaseConfigured && auth) {
      const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          // Determine role (default RESEARCHER, or ADMIN if email matches admin list or custom claims)
          const isAdmin =
            fbUser.email?.toLowerCase().includes('admin') ||
            fbUser.email === 'admin@pharmalens.io' ||
            fbUser.email === 'lead.researcher@pharmalens.io';

          setUser({
            uid: fbUser.uid,
            email: fbUser.email || 'user@pharmalens.io',
            displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Researcher',
            photoURL: fbUser.photoURL || undefined,
            role: isAdmin ? 'ADMIN' : 'RESEARCHER',
            isAnonymous: fbUser.isAnonymous,
          });
        } else {
          setUser(null);
          setToken(null);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Check for saved user session in localStorage
      const savedUser = localStorage.getItem(DEV_USER_STORAGE_KEY);
      if (savedUser) {
        try {
          const parsed: UserProfile = JSON.parse(savedUser);
          setUser(parsed);
          setToken(parsed.role === 'ADMIN' ? 'dev-token-admin' : 'dev-token-researcher');
        } catch {
          localStorage.removeItem(DEV_USER_STORAGE_KEY);
          setUser(null);
          setToken(null);
        }
      } else {
        // No auto-login: user must log in through role login page
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = async (targetRole: UserRole = 'RESEARCHER') => {
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        const fbUser = await loginWithGooglePopup();
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        const isAdmin = fbUser.email?.toLowerCase().includes('admin') || targetRole === 'ADMIN';
        const profile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || 'Clinical Researcher',
          photoURL: fbUser.photoURL || undefined,
          role: isAdmin ? 'ADMIN' : 'RESEARCHER',
        };
        setUser(profile);
      } else {
        const profile: UserProfile = {
          uid: `google-${Date.now()}`,
          email: targetRole === 'ADMIN' ? 'admin.lead@pharmalens.io' : 'researcher@pharmalens.io',
          displayName: targetRole === 'ADMIN' ? 'Compliance Lead (Google Auth)' : 'Dr. Sarah Lin (Google Auth)',
          role: targetRole,
        };
        setUser(profile);
        const mockToken = targetRole === 'ADMIN' ? 'dev-token-admin' : 'dev-token-researcher';
        setToken(mockToken);
        localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithEmail = async (
    email: string,
    pass: string,
    targetRole: UserRole = 'RESEARCHER'
  ) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        const fbUser = await loginWithEmail(email, pass);
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        const isAdmin = email.toLowerCase().includes('admin') || targetRole === 'ADMIN';
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: fbUser.displayName || email.split('@')[0],
          role: isAdmin ? 'ADMIN' : 'RESEARCHER',
        });
      } else {
        // Institutional credential sign-in
        const isAdmin = targetRole === 'ADMIN' || email.toLowerCase().includes('admin');
        const role: UserRole = isAdmin ? 'ADMIN' : 'RESEARCHER';
        const displayName = email.split('@')[0].replace('.', ' ').replace(/^./, (str) => str.toUpperCase());

        const profile: UserProfile = {
          uid: `user-${Date.now()}`,
          email,
          displayName: role === 'ADMIN' ? `${displayName} (Admin)` : `Dr. ${displayName}`,
          role,
        };
        setUser(profile);
        const mockToken = role === 'ADMIN' ? 'dev-token-admin' : 'dev-token-researcher';
        setToken(mockToken);
        localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    pass: string,
    name: string,
    targetRole: UserRole = 'RESEARCHER'
  ) => {
    setLoading(true);
    try {
      if (isFirebaseConfigured) {
        const fbUser = await registerWithEmail(email, pass, name);
        const idToken = await fbUser.getIdToken();
        setToken(idToken);
        const isAdmin = email.toLowerCase().includes('admin') || targetRole === 'ADMIN';
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: name || email.split('@')[0],
          role: isAdmin ? 'ADMIN' : 'RESEARCHER',
        });
      } else {
        const isAdmin = targetRole === 'ADMIN' || email.toLowerCase().includes('admin');
        const role: UserRole = isAdmin ? 'ADMIN' : 'RESEARCHER';
        const profile: UserProfile = {
          uid: `user-${Date.now()}`,
          email,
          displayName: name,
          role,
        };
        setUser(profile);
        const mockToken = role === 'ADMIN' ? 'dev-token-admin' : 'dev-token-researcher';
        setToken(mockToken);
        localStorage.setItem(DEV_USER_STORAGE_KEY, JSON.stringify(profile));
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    if (auth) {
      await logoutUser();
    }
    localStorage.removeItem(DEV_USER_STORAGE_KEY);
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isFirebaseConfigured,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
