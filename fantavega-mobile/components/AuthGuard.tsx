// components/AuthGuard.tsx
// Protegge le route che richiedono autenticazione
// Redirige a /login se l'utente non è autenticato

import { useAuth } from "@/contexts/AuthContext";
import { Redirect } from "expo-router";
import { ReactNode } from "react";
import { ActivityIndicator, View } from "react-native";

interface AuthGuardProps {
  children: ReactNode;
}

/**
 * Wrapper per proteggere route che richiedono autenticazione.
 * - Se loading → mostra spinner
 * - Se non autenticato → redirect a /login
 * - Altrimenti → render children
 *
 * @example
 * // In un layout file:
 * export default function ProtectedLayout() {
 *   return (
 *     <AuthGuard>
 *       <Stack>...</Stack>
 *     </AuthGuard>
 *   );
 * }
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { isLoading, isAuthenticated, isDevMode } = useAuth();

  // Durante il caricamento, mostra spinner
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // In DEV_MODE, bypassa completamente la protezione
  if (isDevMode) {
    return <>{children}</>;
  }

  // Se non autenticato, redirige a login
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Utente autenticato, mostra contenuto
  return <>{children}</>;
}
