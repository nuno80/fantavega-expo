// app/(auth)/signup.tsx
// Schermata registrazione con Email/Password

import { useAuth } from "@/contexts/AuthContext";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
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

const SignUpSchema = z
  .object({
    displayName: z.string().min(2, "Nome minimo 2 caratteri"),
    email: z.string().email("Email non valida"),
    password: z.string().min(6, "Password minimo 6 caratteri"),
    confirmPassword: z.string().min(6, "Conferma password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Le password non coincidono",
    path: ["confirmPassword"],
  });

type SignUpFormData = z.infer<typeof SignUpSchema>;

// ============================================
// COMPONENT
// ============================================

export default function SignUpScreen() {
  const { signUpWithEmail, isLoading, isDevMode } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // ============================================
  // HANDLERS
  // ============================================

  const onSubmit = async (data: SignUpFormData) => {
    setError(null);
    try {
      await signUpWithEmail(data.email, data.password, data.displayName);
      router.replace("/(tabs)");
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("Email già registrata");
      } else if (err.code === "auth/weak-password") {
        setError("Password troppo debole");
      } else {
        setError(err.message || "Errore durante la registrazione");
      }
    }
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
          <Text className="text-gray-400 text-lg">Crea il tuo account</Text>
        </View>

        {/* DEV MODE Banner */}
        {isDevMode && (
          <View className="bg-yellow-500/20 border border-yellow-500 rounded-xl p-4 mb-6">
            <Text className="text-yellow-500 font-bold text-center">
              🔧 DEV MODE ATTIVO
            </Text>
            <Text className="text-yellow-400 text-sm text-center mt-1">
              La registrazione è simulata
            </Text>
          </View>
        )}

        {/* Error Message */}
        {error && (
          <View className="bg-red-500/20 border border-red-500 rounded-xl p-4 mb-6">
            <Text className="text-red-500 text-center">{error}</Text>
          </View>
        )}

        {/* Form */}
        <View className="gap-4 mb-6">
          {/* Display Name */}
          <View>
            <Text className="text-gray-400 mb-2">Nome</Text>
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  className="bg-dark-card text-white px-4 py-3 rounded-xl border border-gray-700"
                  placeholder="Il tuo nome"
                  placeholderTextColor="#666"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              )}
            />
            {errors.displayName && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.displayName.message}
              </Text>
            )}
          </View>

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
                  autoComplete="password-new"
                />
              )}
            />
            {errors.password && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </Text>
            )}
          </View>

          {/* Confirm Password */}
          <View>
            <Text className="text-gray-400 mb-2">Conferma Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
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
                  autoComplete="password-new"
                />
              )}
            />
            {errors.confirmPassword && (
              <Text className="text-red-500 text-sm mt-1">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>
        </View>

        {/* Sign Up Button */}
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
              Registrati
            </Text>
          )}
        </Pressable>

        {/* Login Link */}
        <Pressable onPress={() => router.back()}>
          <Text className="text-gray-400 text-center">
            Hai già un account?{" "}
            <Text className="text-primary font-semibold">Accedi</Text>
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
