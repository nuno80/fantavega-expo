// app/(auth)/login.tsx
// Schermata Login completa con Email/Password, Google, Apple

import { DEV_MOCK_USERS, DevMockUser, useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

// ============================================
// VALIDATION SCHEMA
// ============================================

const LoginSchema = z.object({
  email: z.string().email("Email non valida"),
  password: z.string().min(6, "Password minimo 6 caratteri"),
});

type LoginFormData = z.infer<typeof LoginSchema>;

// ============================================
// COMPONENT
// ============================================

export default function LoginScreen() {
  const {
    signInWithEmail,
    signInWithGoogle,
    signInWithApple,
    isLoading,
    isDevMode,
    setDevMockUser,
    toggleDevMode,
  } = useAuth();

  const [error, setError] = useState<string | null>(null);
  const [showDevSelector, setShowDevSelector] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // ============================================
  // HANDLERS
  // ============================================

  const onSubmit = async (data: LoginFormData) => {
    setError(null);
    try {
      await signInWithEmail(data.email, data.password);
      router.replace("/(tabs)");
    } catch (err: any) {
      if (err.code === "auth/invalid-credential") {
        setError("Email o password non corretti");
      } else if (err.code === "auth/user-not-found") {
        setError("Utente non trovato");
      } else {
        setError(err.message || "Errore durante il login");
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Errore durante Google Sign-In");
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    try {
      await signInWithApple();
      router.replace("/(tabs)");
    } catch (err: any) {
      setError(err.message || "Errore durante Apple Sign-In");
    }
  };

  const handleDevMockUser = (user: DevMockUser) => {
    setDevMockUser(user);
    setShowDevSelector(false);
    router.replace("/(tabs)");
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <ScrollView
      className="flex-1 bg-dark-bg"
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="flex-1 justify-center px-6 py-12">
        {/* Header */}
        <View className="items-center mb-10">
          <Text className="text-4xl font-bold text-white mb-2">Fantavega</Text>
          <Text className="text-gray-400 text-lg">Accedi al tuo account</Text>
        </View>

        {/* DEV MODE Banner */}
        {isDevMode && (
          <Pressable
            onPress={() => setShowDevSelector(!showDevSelector)}
            className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 mb-6"
          >
            <Text className="text-yellow-500 font-bold text-center">
              🔧 DEV MODE ATTIVO
            </Text>
            <Text className="text-yellow-400 text-sm text-center mt-1">
              Tocca per selezionare un utente di test
            </Text>
          </Pressable>
        )}

        {/* DEV Mock User Selector */}
        {isDevMode && showDevSelector && (
          <View className="bg-dark-card rounded-xl p-4 mb-6">
            <Text className="text-white font-bold mb-3">
              Seleziona Utente Test
            </Text>
            {DEV_MOCK_USERS.map((user) => (
              <Pressable
                key={user.uid}
                onPress={() => handleDevMockUser(user)}
                className="bg-dark-bg p-3 rounded-lg mb-2"
              >
                <Text className="text-white font-semibold">
                  {user.displayName}
                </Text>
                <Text className="text-gray-400 text-sm">{user.email}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={toggleDevMode}
              className="mt-3 p-3 border border-gray-600 rounded-lg"
            >
              <Text className="text-gray-400 text-center">
                Passa ad Auth Reale
              </Text>
            </Pressable>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
            <Text className="text-red-500 text-center">{error}</Text>
          </View>
        )}

        {/* Email/Password Form */}
        <View className="gap-4 mb-6">
          {/* Email */}
          <View>
            <Text className="text-gray-400 mb-2">Email</Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-dark-card text-white px-4 py-3 rounded-xl border border-gray-700"
                  placeholder="la.tua@email.com"
                  placeholderTextColor="#666"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              )}
            />
            {errors.email && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </Text>
            )}
          </View>

          {/* Password */}
          <View>
            <Text className="text-gray-400 mb-2">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-dark-card text-white px-4 py-3 rounded-xl border border-gray-700"
                  placeholder="••••••••"
                  placeholderTextColor="#666"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="password"
                />
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </Text>
            )}
          </View>
        </View>

        {/* Login Button */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
          className={`py-4 rounded-xl mb-6 ${isLoading ? "bg-primary/50" : "bg-primary"
            }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center font-bold text-lg">
              Accedi
            </Text>
          )}
        </Pressable>

        {/* Divider */}
        <View className="flex-row items-center mb-6">
          <View className="flex-1 h-px bg-gray-700" />
          <Text className="text-gray-500 mx-4">oppure</Text>
          <View className="flex-1 h-px bg-gray-700" />
        </View>

        {/* Social Buttons */}
        <View className="gap-3 mb-8">
          {/* Google */}
          <Pressable
            onPress={handleGoogleSignIn}
            disabled={isLoading}
            className="bg-white py-4 rounded-xl flex-row items-center justify-center"
          >
            <Text className="text-xl mr-2">🔷</Text>
            <Text className="text-gray-800 font-semibold">
              Continua con Google
            </Text>
          </Pressable>

          {/* Apple (iOS only) */}
          {Platform.OS === "ios" && (
            <Pressable
              onPress={handleAppleSignIn}
              disabled={isLoading}
              className="bg-black border border-gray-600 py-4 rounded-xl flex-row items-center justify-center"
            >
              <Text className="text-xl mr-2">🍎</Text>
              <Text className="text-white font-semibold">
                Continua con Apple
              </Text>
            </Pressable>
          )}
        </View>

        {/* Sign Up Link */}
        <Pressable onPress={() => router.push({ pathname: "/(auth)/signup" as any })}>
          <Text className="text-gray-400 text-center">
            Non hai un account?{" "}
            <Text className="text-primary font-semibold">Registrati</Text>
          </Text>
        </Pressable>

        {/* DEV Toggle (only visible in __DEV__) */}
        {__DEV__ && !isDevMode && (
          <Pressable onPress={toggleDevMode} className="mt-8">
            <Text className="text-gray-600 text-center text-sm">
              🔧 Attiva DEV MODE
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
