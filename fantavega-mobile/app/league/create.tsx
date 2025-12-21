// app/league/create.tsx
// Screen per creare una nuova lega

import { useCurrentUser } from "@/contexts/AuthContext";
import { createLeague } from "@/services/league.service";
import { CreateLeagueFormSchema, type CreateLeagueForm } from "@/types/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Href, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function CreateLeagueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUserId } = useCurrentUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeagueForm>({
    resolver: zodResolver(CreateLeagueFormSchema),
    defaultValues: {
      name: "",
      leagueType: "classic",
      initialBudgetPerManager: 500,
      slotsP: 3,
      slotsD: 8,
      slotsC: 8,
      slotsA: 6,
    },
  });

  const onSubmit = async (data: CreateLeagueForm) => {
    setIsSubmitting(true);
    try {
      // Genera codice invito
      const inviteCode = generateInviteCode();

      const leagueId = await createLeague({
        ...data,
        status: "participants_joining",
        activeAuctionRoles: null,
        minBid: 1,
        timerDurationMinutes: 1440, // 24 ore default
        adminCreatorId: currentUserId,
        inviteCode,
      });

      // Invalida la cache delle leghe per aggiornare la Home
      await queryClient.invalidateQueries({ queryKey: ["leagues"] });

      Alert.alert("Successo!", `Lega creata!\nCodice invito: ${inviteCode}`, [
        { text: "OK", onPress: () => router.replace(`/league/${leagueId}` as Href) },
      ]);
    } catch (error) {
      Alert.alert("Errore", "Impossibile creare la lega");
      console.error("Create league error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Genera codice invito casuale
  function generateInviteCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      <View className="p-4">
        {/* Header */}
        <Text className="text-2xl font-bold text-white mb-2">
          🏆 Crea Nuova Lega
        </Text>
        <Text className="text-gray-400 mb-6">
          Configura la tua lega d'asta fantacalcio
        </Text>

        {/* Nome Lega */}
        <View className="mb-4">
          <Text className="text-white font-semibold mb-2">Nome Lega *</Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                className="bg-dark-card text-white p-4 rounded-xl"
                placeholder="Es. Fantacalcio Amici 2025"
                placeholderTextColor="#6b7280"
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
              />
            )}
          />
          {errors.name && (
            <Text className="text-red-400 mt-1 text-sm">{errors.name.message}</Text>
          )}
        </View>

        {/* Tipo Lega */}
        <View className="mb-4">
          <Text className="text-white font-semibold mb-2">Tipo Lega</Text>
          <Controller
            control={control}
            name="leagueType"
            render={({ field: { onChange, value } }) => (
              <View className="flex-row gap-3">
                <Pressable
                  onPress={() => onChange("classic")}
                  className={`flex-1 p-4 rounded-xl border-2 ${value === "classic"
                    ? "bg-primary/20 border-primary"
                    : "bg-dark-card border-gray-700"
                    }`}
                >
                  <Text className={`text-center font-semibold ${value === "classic" ? "text-primary" : "text-white"
                    }`}>
                    Classic
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => onChange("mantra")}
                  className={`flex-1 p-4 rounded-xl border-2 ${value === "mantra"
                    ? "bg-primary/20 border-primary"
                    : "bg-dark-card border-gray-700"
                    }`}
                >
                  <Text className={`text-center font-semibold ${value === "mantra" ? "text-primary" : "text-white"
                    }`}>
                    Mantra
                  </Text>
                </Pressable>
              </View>
            )}
          />
        </View>

        {/* Budget */}
        <View className="mb-4">
          <Text className="text-white font-semibold mb-2">Budget Iniziale</Text>
          <Controller
            control={control}
            name="initialBudgetPerManager"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="bg-dark-card text-white p-4 rounded-xl"
                placeholder="500"
                placeholderTextColor="#6b7280"
                keyboardType="numeric"
                onChangeText={(text) => onChange(Number(text) || 0)}
                value={String(value)}
              />
            )}
          />
          {errors.initialBudgetPerManager && (
            <Text className="text-red-400 mt-1 text-sm">
              {errors.initialBudgetPerManager.message}
            </Text>
          )}
        </View>

        {/* Slots */}
        <View className="mb-6">
          <Text className="text-white font-semibold mb-3">Slot Rosa</Text>
          <View className="bg-dark-card rounded-xl p-4">
            <View className="flex-row justify-around">
              {(["P", "D", "C", "A"] as const).map((role) => {
                const fieldName = `slots${role}` as keyof CreateLeagueForm;
                return (
                  <Controller
                    key={role}
                    control={control}
                    name={fieldName}
                    render={({ field: { onChange, value } }) => (
                      <View className="items-center">
                        <View className={`h-10 w-10 items-center justify-center rounded-full bg-role-${role} mb-2`}>
                          <Text className="text-white font-bold">{role}</Text>
                        </View>
                        <TextInput
                          className="bg-dark-bg text-white text-center w-12 p-2 rounded-lg"
                          keyboardType="numeric"
                          onChangeText={(text) => onChange(Number(text) || 0)}
                          value={String(value)}
                        />
                      </View>
                    )}
                  />
                );
              })}
            </View>
          </View>
        </View>

        {/* Submit */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          className={`p-4 rounded-xl items-center ${isSubmitting ? "bg-gray-600" : "bg-primary active:opacity-80"
            }`}
        >
          {isSubmitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Crea Lega</Text>
          )}
        </Pressable>

        {/* Cancel */}
        <Pressable
          onPress={() => router.back()}
          className="mt-3 p-4 items-center"
        >
          <Text className="text-gray-400">Annulla</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
