// contexts/AuthContext.tsx
// Firebase Authentication Context con DEV_MODE bypass
// Supporta: Email/Password, Google Sign-In, Apple Sign-In

import { auth } from "@/lib/firebase";
import {
  registerForPushNotifications,
  savePushTokenToFirebase,
} from "@/services/notification.service";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from "expo-apple-authentication";
import * as Crypto from "expo-crypto";
import {
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  signInWithCredential,
  signInWithEmailAndPassword,
  updateProfile,
  User,
} from "firebase/auth";
import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

// ============================================
// DEV MODE CONFIGURATION
// ============================================

/**
 * DEV_MODE_ENABLED: abilita il bypass auth per sviluppo.
 * - Usa __DEV__ (React Native built-in) → automaticamente false in produzione
 * - Imposta false per testare auth reale in dev
 */
const DEV_MODE_ENABLED = __DEV__ && true; // ← Cambia a false per testare auth reale

/**
 * UTENTI DEV REALI - Creali in Firebase Console:
 * 1. Vai su https://console.firebase.google.com/project/fantavega/authentication/users
 * 2. Clicca "Add user"
 * 3. Email: dev1@fantavega.test, Password: test123456
 * 4. Copia l'UID generato e incollalo qui sotto
 *
 * Credenziali dev:
 * - Email: dev1@fantavega.test → dev5@fantavega.test
 * - Password: test123456
 */
export const DEV_MOCK_USERS = [
  {
    uid: "RBjfydirZURMJvFuhgBl25c43sz1",
    displayName: "Mario Rossi",
    email: "dev1@fantavega.test",
    photoURL: null,
  },
  {
    uid: "Itn7H708ryQ01Fwx7GtgstGxHu53",
    displayName: "Luigi Bianchi",
    email: "dev2@fantavega.test",
    photoURL: null,
  },
  {
    uid: "tQ5tfhjrbShJT1ZOD8eR7rgQyR12",
    displayName: "Paolo Verdi",
    email: "dev3@fantavega.test",
    photoURL: null,
  },
  {
    uid: "4yqS1kT1CyZChzeWOWxKFfqJWno1",
    displayName: "Andrea Neri",
    email: "dev4@fantavega.test",
    photoURL: null,
  },
  {
    uid: "HRGpOMTGEfhHhaBpOhuwB03oOAs2",
    displayName: "Marco Gialli",
    email: "dev5@fantavega.test",
    photoURL: null,
  },
] as const;

export type DevMockUser = (typeof DEV_MOCK_USERS)[number];


// ============================================
// TYPES
// ============================================

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDevMode: boolean;

  // Auth methods
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;

  // DEV_MODE methods
  setDevMockUser: (user: DevMockUser) => void;
  toggleDevMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// PROVIDER
// ============================================

// Configura Google Sign-In (chiamato una volta all'init)
GoogleSignin.configure({
  // Web client ID da Firebase Console → Authentication → Sign-in method → Google
  webClientId:
    "201333299716-qu4mu32m3gcob4e8loo3i3m3b4laul6r.apps.googleusercontent.com",
  offlineAccess: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useDevMode, setUseDevMode] = useState(DEV_MODE_ENABLED);

  // Converti Firebase User a AuthUser
  const mapFirebaseUser = (firebaseUser: User): AuthUser => ({
    uid: firebaseUser.uid,
    email: firebaseUser.email,
    displayName: firebaseUser.displayName,
    photoURL: firebaseUser.photoURL,
  });

  // ============================================
  // AUTH STATE LISTENER
  // ============================================

  useEffect(() => {
    // Se in DEV_MODE, salta Firebase auth e usa mock user
    if (useDevMode) {
      setUser({
        uid: DEV_MOCK_USERS[0].uid,
        email: DEV_MOCK_USERS[0].email,
        displayName: DEV_MOCK_USERS[0].displayName,
        photoURL: DEV_MOCK_USERS[0].photoURL,
      });
      setIsLoading(false);
      return;
    }

    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser(mapFirebaseUser(firebaseUser));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, [useDevMode]);

  // ============================================
  // PUSH NOTIFICATIONS REGISTRATION
  // ============================================

  useEffect(() => {
    // Registra per push solo se utente autenticato e non in loading
    if (!user || isLoading) return;

    const registerPush = async () => {
      try {
        const token = await registerForPushNotifications();
        if (token) {
          await savePushTokenToFirebase(user.uid, token);
          console.log("Push token registered for user:", user.uid);
        }
      } catch (error) {
        console.error("Failed to register push token:", error);
      }
    };

    registerPush();
  }, [user?.uid, isLoading]);

  // ============================================
  // EMAIL/PASSWORD AUTH
  // ============================================

  const signInWithEmail = async (email: string, password: string) => {
    if (useDevMode) {
      console.log("[DEV_MODE] signInWithEmail bypassed");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    if (useDevMode) {
      console.log("[DEV_MODE] signUpWithEmail bypassed");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      // Aggiorna displayName dopo la creazione
      await updateProfile(userCredential.user, { displayName });
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // GOOGLE SIGN-IN
  // ============================================

  const signInWithGoogle = async () => {
    if (useDevMode) {
      console.log("[DEV_MODE] signInWithGoogle bypassed");
      return;
    }

    setIsLoading(true);
    try {
      // Check if Google Play Services are available
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // Sign in with Google
      const signInResult = await GoogleSignin.signIn();

      // Get the ID token
      const idToken = signInResult.data?.idToken;
      if (!idToken) {
        throw new Error("No ID token received from Google Sign-In");
      }

      // Create Firebase credential
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign in to Firebase
      await signInWithCredential(auth, googleCredential);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Google Sign-In cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        console.log("Google Sign-In already in progress");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        console.error("Play services not available");
      } else {
        console.error("Google Sign-In error:", error);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // APPLE SIGN-IN (iOS only)
  // ============================================

  const signInWithApple = async () => {
    if (useDevMode) {
      console.log("[DEV_MODE] signInWithApple bypassed");
      return;
    }

    if (Platform.OS !== "ios") {
      console.warn("Apple Sign-In is only available on iOS");
      return;
    }

    setIsLoading(true);
    try {
      // Generate nonce for security
      const nonce = Math.random().toString(36).substring(2, 10);
      const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        nonce
      );

      // Request Apple credentials
      const appleCredential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
        nonce: hashedNonce,
      });

      const { identityToken } = appleCredential;
      if (!identityToken) {
        throw new Error("No identity token received from Apple");
      }

      // Create Firebase credential
      const provider = new OAuthProvider("apple.com");
      const credential = provider.credential({
        idToken: identityToken,
        rawNonce: nonce,
      });

      // Sign in to Firebase
      const userCredential = await signInWithCredential(auth, credential);

      // Apple only provides name on first sign-in, so save it
      if (appleCredential.fullName && !userCredential.user.displayName) {
        const displayName = [
          appleCredential.fullName.givenName,
          appleCredential.fullName.familyName,
        ]
          .filter(Boolean)
          .join(" ");

        if (displayName) {
          await updateProfile(userCredential.user, { displayName });
        }
      }
    } catch (error: any) {
      if (error.code === "ERR_REQUEST_CANCELED") {
        console.log("Apple Sign-In cancelled");
      } else {
        console.error("Apple Sign-In error:", error);
        throw error;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // SIGN OUT
  // ============================================

  const signOut = async () => {
    if (useDevMode) {
      // In DEV_MODE, just reset to first mock user
      setUser({
        uid: DEV_MOCK_USERS[0].uid,
        email: DEV_MOCK_USERS[0].email,
        displayName: DEV_MOCK_USERS[0].displayName,
        photoURL: DEV_MOCK_USERS[0].photoURL,
      });
      return;
    }

    setIsLoading(true);
    try {
      // Sign out from Google if signed in
      try {
        await GoogleSignin.signOut();
      } catch {
        // Ignore if not signed in with Google
      }

      // Sign out from Firebase
      await firebaseSignOut(auth);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // DEV MODE CONTROLS
  // ============================================

  const setDevMockUser = (mockUser: DevMockUser) => {
    if (!useDevMode) {
      console.warn("setDevMockUser called but DEV_MODE is disabled");
      return;
    }

    setUser({
      uid: mockUser.uid,
      email: mockUser.email,
      displayName: mockUser.displayName,
      photoURL: mockUser.photoURL,
    });
  };

  const toggleDevMode = () => {
    if (!DEV_MODE_ENABLED) {
      console.warn("toggleDevMode called but DEV_MODE_ENABLED is false");
      return;
    }

    setUseDevMode((prev) => !prev);
    setIsLoading(true); // Will trigger useEffect to re-initialize
  };

  // ============================================
  // CONTEXT VALUE
  // ============================================

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDevMode: useDevMode,

    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    signOut,

    setDevMockUser,
    toggleDevMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// HOOK
// ============================================

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// ============================================
// HELPER EXPORTS (per compatibilità con codice esistente)
// ============================================

/**
 * Hook per ottenere solo userId e username, compatibile con vecchio useUserStore
 * Facilita transizione graduale
 */
export function useCurrentUser() {
  const { user } = useAuth();
  return {
    currentUserId: user?.uid ?? "",
    currentUser: user
      ? {
        id: user.uid,
        username: user.displayName ?? "Utente",
        email: user.email,
        avatarUrl: user.photoURL,
      }
      : null,
  };
}
