// app/league/[id]/settings.tsx
// Impostazioni lega - Solo per Admin (creatore)

import { useCurrentUser } from "@/contexts/AuthContext";
import { useLeague, useLeagueParticipants } from "@/hooks/useLeague";
import { removeParticipant, updateLeague, updateLeagueStatus } from "@/services/league.service";
import { CreateLeagueFormSchema, type League } from "@/types/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Clipboard from "expo-clipboard";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
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

// Schema per update (solo campi modificabili)
const UpdateLeagueSchema = CreateLeagueFormSchema.partial();

// Status labels
const STATUS_LABELS: Record<string, string> = {
  participants_joining: "Iscrizioni aperte",
  draft_active: "Asta in corso",
  repair_active: "Riparazioni",
  market_closed: "Mercato chiuso",
  completed: "Completata",
};

export default function LeagueSettingsScreen() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUserId } = useCurrentUser();

  const { data: league, isLoading, refetch } = useLeague(leagueId ?? "");
  const { data: participants, refetch: refetchParticipants } = useLeagueParticipants(leagueId ?? "");

  const [isSaving, setIsSaving] = useState(false);

  // Se la lega non ha un codice invito, ne generiamo uno e lo salviamo
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  // Quando la lega si carica, controlliamo se ha già un codice
  // Se non ce l'ha, ne generiamo uno e lo salviamo nel DB
  useEffect(() => {
    if (!league || !leagueId) return;

    if (league.inviteCode) {
      setInviteCode(league.inviteCode);
    } else {
      // Genera e salva il codice per leghe vecchie
      const newCode = generateInviteCode();
      setInviteCode(newCode);
      updateLeague(leagueId, { inviteCode: newCode }).catch(console.error);
    }
  }, [league, leagueId]);

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(UpdateLeagueSchema),
    values: league ? {
      name: league.name,
      leagueType: league.leagueType,
      initialBudgetPerManager: league.initialBudgetPerManager,
      slotsP: league.slotsP,
      slotsD: league.slotsD,
      slotsC: league.slotsC,
      slotsA: league.slotsA,
    } : undefined,
  });

  // Loading
  if (isLoading || !league) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // Guard: Solo admin può vedere questa pagina
  const isAdmin = league.adminCreatorId === currentUserId;
  if (!isAdmin) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg p-6">
        <Text className="text-4xl mb-4">🔒</Text>
        <Text className="text-white text-lg text-center">
          Solo l'amministratore può modificare le impostazioni
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 bg-primary rounded-xl px-6 py-3"
        >
          <Text className="text-white font-semibold">Torna indietro</Text>
        </Pressable>
      </View>
    );
  }

  const onSubmit = async (data: Partial<League>) => {
    if (!leagueId) return;
    setIsSaving(true);
    try {
      await updateLeague(leagueId, data);
      await refetch();
      Alert.alert("Salvato!", "Impostazioni aggiornate con successo");
    } catch (error) {
      Alert.alert("Errore", "Impossibile salvare le impostazioni");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveParticipant = (userId: string, name: string) => {
    Alert.alert(
      "Rimuovi partecipante",
      `Sei sicuro di voler rimuovere ${name} dalla lega?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Rimuovi",
          style: "destructive",
          onPress: async () => {
            try {
              await removeParticipant(leagueId!, userId);
              await refetchParticipants();
            } catch (error) {
              Alert.alert("Errore", "Impossibile rimuovere il partecipante");
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: "Impostazioni Lega",
          headerStyle: { backgroundColor: "#0f0f0f" },
          headerTintColor: "#fff",
        }}
      />

      <ScrollView className="flex-1 bg-dark-bg">
        <View className="p-4">
          {/* Header */}
          <View className="flex-row items-center mb-6">
            <Text className="text-2xl">⚙️</Text>
            <Text className="text-xl font-bold text-white ml-2">
              Impostazioni
            </Text>
          </View>

          {/* Nome Lega */}
          <View className="mb-4">
            <Text className="text-white font-semibold mb-2">Nome Lega</Text>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className="bg-dark-card text-white p-4 rounded-xl"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Nome della lega"
                  placeholderTextColor="#6b7280"
                />
              )}
            />
            {errors.name && (
              <Text className="text-red-400 mt-1 text-sm">{errors.name.message}</Text>
            )}
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
                  value={String(value ?? "")}
                  onChangeText={(t) => onChange(Number(t) || 0)}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor="#6b7280"
                />
              )}
            />
          </View>

          {/* Slots */}
          <View className="mb-6">
            <Text className="text-white font-semibold mb-3">Slot Rosa</Text>
            <View className="bg-dark-card rounded-xl p-4">
              <View className="flex-row justify-around">
                {(["P", "D", "C", "A"] as const).map((role) => (
                  <Controller
                    key={role}
                    control={control}
                    name={`slots${role}` as "slotsP" | "slotsD" | "slotsC" | "slotsA"}
                    render={({ field: { onChange, value } }) => (
                      <View className="items-center">
                        <View className={`h-10 w-10 items-center justify-center rounded-full bg-role-${role} mb-2`}>
                          <Text className="text-white font-bold">{role}</Text>
                        </View>
                        <TextInput
                          className="bg-dark-bg text-white text-center w-12 p-2 rounded-lg"
                          value={String(value ?? "")}
                          onChangeText={(t) => onChange(Number(t) || 0)}
                          keyboardType="numeric"
                        />
                      </View>
                    )}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Save Button */}
          {isDirty && (
            <Pressable
              onPress={handleSubmit(onSubmit)}
              disabled={isSaving}
              className={`mb-6 p-4 rounded-xl items-center ${isSaving ? "bg-gray-600" : "bg-green-600 active:opacity-80"
                }`}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold">💾 Salva Modifiche</Text>
              )}
            </Pressable>
          )}

          {/* League Status Management */}
          <View className="bg-dark-card rounded-xl p-4 mb-6">
            <Text className="text-white font-semibold mb-2">📊 Stato Lega</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Stato attuale: <Text className="text-primary-500 font-semibold">{STATUS_LABELS[league.status] ?? league.status}</Text>
            </Text>

            <View className="gap-2">
              {/* Start Auction Button */}
              {league.status === "participants_joining" && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Avvia Asta",
                      "Sei sicuro di voler avviare l'asta? I partecipanti non potranno più unirsi.",
                      [
                        { text: "Annulla", style: "cancel" },
                        {
                          text: "Avvia",
                          style: "default",
                          onPress: async () => {
                            try {
                              await updateLeagueStatus(leagueId!, "draft_active");
                              await refetch();
                              Alert.alert("✅ Asta Avviata", "L'asta è ora attiva!");
                            } catch (error) {
                              Alert.alert("Errore", "Impossibile avviare l'asta");
                            }
                          },
                        },
                      ]
                    );
                  }}
                  className="bg-green-600 p-4 rounded-xl flex-row items-center justify-center active:opacity-80"
                >
                  <Text className="text-2xl mr-2">🚀</Text>
                  <Text className="text-white font-bold text-lg">Avvia Asta</Text>
                </Pressable>
              )}

              {/* Pause/Resume Auction */}
              {league.status === "draft_active" && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Chiudi Mercato",
                      "Vuoi chiudere il mercato principale e passare alle riparazioni?",
                      [
                        { text: "Annulla", style: "cancel" },
                        {
                          text: "Chiudi",
                          onPress: async () => {
                            try {
                              await updateLeagueStatus(leagueId!, "repair_active");
                              await refetch();
                              Alert.alert("Mercato Chiuso", "Ora siete in fase riparazioni");
                            } catch (error) {
                              Alert.alert("Errore", "Impossibile aggiornare stato");
                            }
                          },
                        },
                      ]
                    );
                  }}
                  className="bg-amber-600 p-4 rounded-xl flex-row items-center justify-center active:opacity-80"
                >
                  <Text className="text-2xl mr-2">🔧</Text>
                  <Text className="text-white font-bold">Passa a Riparazioni</Text>
                </Pressable>
              )}

              {/* Complete League */}
              {(league.status === "repair_active" || league.status === "draft_active") && (
                <Pressable
                  onPress={() => {
                    Alert.alert(
                      "Completa Lega",
                      "Questa azione terminerà definitivamente la lega. Continuare?",
                      [
                        { text: "Annulla", style: "cancel" },
                        {
                          text: "Completa",
                          style: "destructive",
                          onPress: async () => {
                            try {
                              await updateLeagueStatus(leagueId!, "completed");
                              await refetch();
                              Alert.alert("Lega Completata", "La lega è stata archiviata");
                            } catch (error) {
                              Alert.alert("Errore", "Impossibile completare la lega");
                            }
                          },
                        },
                      ]
                    );
                  }}
                  className="bg-gray-600 p-4 rounded-xl flex-row items-center justify-center active:opacity-80"
                >
                  <Text className="text-2xl mr-2">✅</Text>
                  <Text className="text-white font-bold">Completa Lega</Text>
                </Pressable>
              )}

              {/* Completed state info */}
              {league.status === "completed" && (
                <View className="bg-dark-bg p-4 rounded-xl">
                  <Text className="text-gray-400 text-center">
                    ✅ Questa lega è stata completata e archiviata
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Invite Code Section */}
          <View className="bg-dark-card rounded-xl p-4 mb-6">
            <Text className="text-white font-semibold mb-2">🔗 Codice Invito</Text>
            <Text className="text-gray-400 text-sm mb-3">
              Condividi questo codice per invitare altri manager
            </Text>
            <View className="bg-dark-bg rounded-lg p-4 flex-row items-center justify-between">
              <Text className="text-white text-xl font-mono font-bold">
                {inviteCode}
              </Text>
              <Pressable
                onPress={async () => {
                  if (inviteCode) {
                    await Clipboard.setStringAsync(inviteCode);
                    Alert.alert("Copiato!", "Codice copiato negli appunti");
                  }
                }}
                className="bg-primary px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-semibold">Copia</Text>
              </Pressable>
            </View>
          </View>

          {/* Participants Management */}
          <View className="bg-dark-card rounded-xl p-4 mb-8">
            <Text className="text-white font-semibold mb-4">
              👥 Gestione Partecipanti ({participants?.length ?? 0})
            </Text>

            {participants && participants.length > 0 ? (
              participants.map((p) => {
                const isCurrentUserAdmin = p.userId === league.adminCreatorId;
                return (
                  <View
                    key={p.userId}
                    className="flex-row items-center justify-between bg-dark-bg rounded-xl p-3 mb-2"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="h-10 w-10 items-center justify-center rounded-full bg-primary-600 mr-3">
                        <Text className="text-white">👤</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-white font-semibold">
                          {p.managerTeamName ?? "Manager"}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          Budget: {p.currentBudget} cr
                        </Text>
                      </View>
                      {isCurrentUserAdmin && (
                        <View className="bg-yellow-600/30 px-2 py-1 rounded-full mr-2">
                          <Text className="text-yellow-400 text-xs">Admin</Text>
                        </View>
                      )}
                    </View>

                    {!isCurrentUserAdmin && (
                      <Pressable
                        onPress={() => handleRemoveParticipant(p.userId, p.managerTeamName ?? "Manager")}
                        className="bg-red-600/20 p-2 rounded-lg"
                      >
                        <Text className="text-red-400">✕</Text>
                      </Pressable>
                    )}
                  </View>
                );
              })
            ) : (
              <Text className="text-gray-400 text-center">
                Nessun partecipante
              </Text>
            )}
          </View>

          {/* Danger Zone */}
          <View className="bg-red-900/20 border border-red-800 rounded-xl p-4 mb-8">
            <Text className="text-red-400 font-semibold mb-2">⚠️ Zona Pericolosa</Text>
            <Pressable
              onPress={() => {
                Alert.alert(
                  "Elimina Lega",
                  "Questa azione è irreversibile. Sei sicuro?",
                  [
                    { text: "Annulla", style: "cancel" },
                    {
                      text: "Elimina", style: "destructive", onPress: () => {
                        // TODO: Implement deleteLeague
                        Alert.alert("Info", "Funzionalità in arrivo");
                      }
                    },
                  ]
                );
              }}
              className="bg-red-600/30 p-3 rounded-lg"
            >
              <Text className="text-red-400 text-center font-semibold">
                🗑️ Elimina Lega
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

// Genera codice invito casuale
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
