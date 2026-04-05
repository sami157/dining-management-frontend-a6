'use client'

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
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
  appUserResolved: boolean;
  setResolvedAppUser: (appUser: AppUser | null) => void;
  createUser: (input: CreateUserInput) => Promise<AppUser>;
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
  const mobile = profile?.mobile?.trim();
  const profileImage = profile?.profileImage?.trim() ?? user.photoURL?.trim() ?? undefined;

  return {
    firebaseUid: user.uid,
    name: deriveName(user, profile),
    email: deriveEmail(user, profile),
    ...(mobile ? { mobile } : {}),
    ...(profileImage ? { profileImage } : {}),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [appUserLoading, setAppUserLoading] = useState(false);
  const [appUserResolved, setAppUserResolved] = useState(false);
  const authSyncRequestRef = useRef(0);

  const syncUser = useCallback(async (
    firebaseUser: User,
    profile?: SyncProfile,
    requestId?: number
  ) => {
    setAppUserLoading(true);
    setAppUserResolved(false);

    try {
      try {
        const currentAppUser = await getCurrentAppUser(firebaseUser);
        if (!requestId || requestId === authSyncRequestRef.current) {
          setAppUser(currentAppUser);
        }
        return currentAppUser;
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }

        await registerAppUser(buildRegistrationPayload(firebaseUser, profile), firebaseUser);
        const currentAppUser = await getCurrentAppUser(firebaseUser);
        if (!requestId || requestId === authSyncRequestRef.current) {
          setAppUser(currentAppUser);
        }
        return currentAppUser;
      }
    } finally {
      if (!requestId || requestId === authSyncRequestRef.current) {
        setAppUserLoading(false);
        setAppUserResolved(true);
      }
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const requestId = ++authSyncRequestRef.current;
      setUser(currentUser);

      if (!currentUser) {
        setAppUser(null);
        setAppUserLoading(false);
        setAppUserResolved(true);
        setLoading(false);
        return;
      }

      setLoading(true);

      void syncUser(currentUser, undefined, requestId)
        .catch(() => {
          if (requestId !== authSyncRequestRef.current) {
            return;
          }

          setAppUser(null);
        })
        .finally(() => {
          if (requestId !== authSyncRequestRef.current) {
            return;
          }

          setLoading(false);
        });
    });

    return unsubscribe;
  }, [syncUser]);

  const value: AuthContextValue = {
    user,
    appUser,
    role: appUser?.role ?? null,
    loading,
    appUserLoading,
    appUserResolved,
    setResolvedAppUser: (nextAppUser) => {
      setAppUser(nextAppUser);
      setAppUserLoading(false);
      setAppUserResolved(true);
    },
    createUser: async ({ name, email, password, mobile, profileImage }) => {
      const credential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(credential.user, {
        displayName: name,
        photoURL: profileImage,
      });

      setUser(credential.user);
      const registeredAppUser = await registerAppUser(
        buildRegistrationPayload(credential.user, {
          name,
          email,
          mobile,
          profileImage,
        }),
        credential.user
      );
      setAppUser(registeredAppUser);
      setAppUserLoading(false);
      setAppUserResolved(true);

      return registeredAppUser;
    },
    signIn: async (email, password) => {
      const credential = await signInWithEmailAndPassword(auth, email, password);

      setUser(credential.user);
      return credential.user;
    },
    signInWithGoogle: async () => {
      const credential = await signInWithPopup(auth, googleProvider);

      setUser(credential.user);
      return credential.user;
    },
    refreshAppUser: async () => {
      if (!auth.currentUser) {
        setAppUser(null);
        setAppUserResolved(true);
        return null;
      }

      return syncUser(auth.currentUser);
    },
    logOut: async () => {
      await signOut(auth);
      setUser(null);
      setAppUser(null);
      setAppUserLoading(false);
      setAppUserResolved(true);
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
