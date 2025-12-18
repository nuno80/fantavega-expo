// app/league/join.tsx
// Schermata per unirsi a una lega tramite codice invito

import { addParticipant, getLeagueByInviteCode } from "@/services/league.service";
import { useUserStore } from "@/stores/userStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { z } from "zod";

const JoinLeagueSchema = z.object({
  code: z.string().length(6, "Il codice deve essere di 6 caratteri").toUpperCase(),
  teamName: z.string().min(2, "Nome team richiesto (min 2 caratteri)"),
});

type JoinLeagueForm = z.infer<typeof JoinLeagueSchema>;

export default function JoinLeagueScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUserId, currentUser } = useUserStore();
  const [isJoining, setIsJoining] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<JoinLeagueForm>({
    resolver: zodResolver(JoinLeagueSchema),
    defaultValues: {
      code: "",
      teamName: currentUser.username ?? "",
    },
  });

  const onSubmit = async (data: JoinLeagueForm) => {
    setIsJoining(true);
    try {
      // Cerca la lega con questo codice
      const league = await getLeagueByInviteCode(data.code.toUpperCase());

      if (!league) {
        Alert.alert("Errore", "Codice invito non valido");
        setIsJoining(false);
        return;
      }

      if (league.status !== "participants_joining") {
        Alert.alert("Errore", "Le iscrizioni per questa lega sono chiuse");
        setIsJoining(false);
        return;
      }

      // Aggiungi il partecipante
      await addParticipant(
        league.id,
        currentUserId,
        data.teamName,
        league.initialBudgetPerManager
      );

      // Invalida la cache per aggiornare liste
      await queryClient.invalidateQueries({ queryKey: ["leagues"] });
      await queryClient.invalidateQueries({ queryKey: ["league-participants", league.id] });

      Alert.alert("Benvenuto!", `Sei entrato in "${league.name}"`, [
        { text: "OK", onPress: () => router.replace(`/league/${league.id}`) },
      ]);
    } catch (error) {
      console.error("Join league error:", error);
      Alert.alert("Errore", "Impossibile unirsi alla lega");
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Unisciti a una Lega",
          headerStyle: { backgroundColor: "#0f0f0f" },
          headerTintColor: "#fff",
        }}
      />

      <View className="flex-1 bg-dark-bg p-4">
        {/* Header */}
        <View className="items-center mb-8 mt-4">
          <Text className="text-4xl mb-2">🎟️</Text>
          <Text className="text-xl font-bold text-white">
            Hai un codice invito?
          </Text>
          <Text className="text-gray-400 text-center mt-2">
            Inserisci il codice ricevuto dall'amministratore della lega
          </Text>
        </View>

        {/* Codice Input */}
        <View className="mb-4">
          <Text className="text-white font-semibold mb-2">Codice Invito</Text>
          <Controller
            control={control}
            name="code"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="bg-dark-card text-white text-center text-2xl font-mono tracking-widest p-4 rounded-xl"
                placeholder="ABC123"
                placeholderTextColor="#6b7280"
                autoCapitalize="characters"
                maxLength={6}
                value={value}
                onChangeText={(text) => onChange(text.toUpperCase())}
              />
            )}
          />
          {errors.code && (
            <Text className="text-red-400 mt-1 text-sm text-center">
              {errors.code.message}
            </Text>
          )}
        </View>

        {/* Team Name Input */}
        <View className="mb-6">
          <Text className="text-white font-semibold mb-2">Nome del tuo Team</Text>
          <Controller
            control={control}
            name="teamName"
            render={({ field: { onChange, value } }) => (
              <TextInput
                className="bg-dark-card text-white p-4 rounded-xl"
                placeholder="Es. FC Campioni"
                placeholderTextColor="#6b7280"
                value={value}
                onChangeText={onChange}
              />
            )}
          />
          {errors.teamName && (
            <Text className="text-red-400 mt-1 text-sm">
              {errors.teamName.message}
            </Text>
          )}
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={handleSubmit(onSubmit)}
          disabled={isJoining}
          className={`p-4 rounded-xl items-center ${isJoining ? "bg-gray-600" : "bg-primary active:opacity-80"
            }`}
        >
          {isJoining ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-lg">Unisciti alla Lega</Text>
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
    </>
  );
}
