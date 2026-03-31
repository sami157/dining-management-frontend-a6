'use client'

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { auth, googleProvider } from "@/firebase/firebase.init";
import {
  getCurrentAppUser,
  isNotFoundError,
  registerAppUser,
} from "@/lib/api/auth";
import type { AppUser, UserRole } from "@/lib/types/app-user";

type SyncProfile = {
  name?: string;
  email?: string;
  mobile?: string;
  profileImage?: string;
};

type CreateUserInput = {
  name: string;
  email: string;
  password: string;
  mobile?: string;
  profileImage?: string;
};

type AuthContextValue = {
  user: User | null;
  appUser: AppUser | null;
  role: UserRole | null;
  loading: boolean;
  appUserLoading: boolean;
  createUser: (input: CreateUserInput) => Promise<User>;
  signIn: (email: string, password: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  refreshAppUser: () => Promise<AppUser | null>;
  logOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function deriveName(user: User, profile?: SyncProfile) {
  return (
    profile?.name ??
    user.displayName ??
    user.email?.split("@")[0] ??
    "Dining User"
  );
}

function deriveEmail(user: User, profile?: SyncProfile) {
  const email = profile?.email ?? user.email;

  if (!email) {
    throw new Error("A verified email is required to sync this account.");
  }

  return email;
}

function buildRegistrationPayload(user: User, profile?: SyncProfile) {
  return {
    firebaseUid: user.uid,
    name: deriveName(user, profile),
    email: deriveEmail(user, profile),
    mobile: profile?.mobile ?? "",
    profileImage: profile?.profileImage ?? user.photoURL ?? "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [appUserLoading, setAppUserLoading] = useState(false);

  const syncUser = useCallback(async (firebaseUser: User, profile?: SyncProfile) => {
    setAppUserLoading(true);

    try {
      try {
        const currentAppUser = await getCurrentAppUser();
        setAppUser(currentAppUser);
        return currentAppUser;
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }

        await registerAppUser(buildRegistrationPayload(firebaseUser, profile));
        const currentAppUser = await getCurrentAppUser();
        setAppUser(currentAppUser);
        return currentAppUser;
      }
    } finally {
      setAppUserLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (!currentUser) {
        setAppUser(null);
        setAppUserLoading(false);
        setLoading(false);
        return;
      }

      try {
        await syncUser(currentUser);
      } catch {
        setAppUser(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [syncUser]);

  const value: AuthContextValue = {
    user,
    appUser,
    role: appUser?.role ?? null,
    loading,
    appUserLoading,
    createUser: async ({ name, email, password, mobile, profileImage }) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(credential.user, {
        displayName: name,
        photoURL: profileImage,
      });

      setUser(credential.user);
      await syncUser(credential.user, { name, email, mobile, profileImage });

      return credential.user;
    },
    signIn: async (email, password) => {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      setUser(credential.user);
      await syncUser(credential.user, { email });

      return credential.user;
    },
    signInWithGoogle: async () => {
      const credential = await signInWithPopup(auth, googleProvider);

      setUser(credential.user);
      await syncUser(credential.user);

      return credential.user;
    },
    refreshAppUser: async () => {
      if (!auth.currentUser) {
        setAppUser(null);
        return null;
      }

      return syncUser(auth.currentUser);
    },
    logOut: async () => {
      await signOut(auth);
      setUser(null);
      setAppUser(null);
      setAppUserLoading(false);
    },
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
