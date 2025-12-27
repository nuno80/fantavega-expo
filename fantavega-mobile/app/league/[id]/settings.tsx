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
  Modal,
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
};

// Status icons
const STATUS_ICONS: Record<string, string> = {
  participants_joining: "📥",
  draft_active: "🚀",
  repair_active: "🔧",
  market_closed: "✅",
};

// Available statuses for dropdown
const AVAILABLE_STATUSES = [
  { value: "participants_joining", label: "Iscrizioni aperte", icon: "📥", description: "I manager possono unirsi" },
  { value: "draft_active", label: "Asta in corso", icon: "🚀", description: "Asta principale attiva" },
  { value: "repair_active", label: "Riparazioni", icon: "🔧", description: "Fase di riparazione" },
  { value: "market_closed", label: "Mercato chiuso", icon: "✅", description: "Lega chiusa/archiviata" },
];

export default function LeagueSettingsScreen() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { currentUserId } = useCurrentUser();

  const { data: league, isLoading, refetch } = useLeague(leagueId ?? "");
  const { data: participants, refetch: refetchParticipants } = useLeagueParticipants(leagueId ?? "");

  const [isSaving, setIsSaving] = useState(false);
  const [isStatusPickerOpen, setIsStatusPickerOpen] = useState(false);

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

  // Budget può essere modificato SOLO in fase participants_joining
  const canEditBudget = league.status === "participants_joining";

  const onSubmit = async (data: Partial<League>) => {
    if (!leagueId) return;

    // Validazione: budget può solo AUMENTARE, mai diminuire
    if (data.initialBudgetPerManager !== undefined &&
      data.initialBudgetPerManager < league.initialBudgetPerManager) {
      Alert.alert(
        "Errore",
        `Il budget può solo essere aumentato.\nValore attuale: ${league.initialBudgetPerManager}\nValore minimo consentito: ${league.initialBudgetPerManager}`
      );
      return;
    }

    // Validazione: budget non modificabile se asta in corso
    if (!canEditBudget && data.initialBudgetPerManager !== league.initialBudgetPerManager) {
      Alert.alert(
        "Errore",
        "Il budget può essere modificato solo nella fase 'Iscrizioni aperte'."
      );
      return;
    }

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

  const handleStatusChange = async (newStatus: string) => {
    const statusInfo = AVAILABLE_STATUSES.find(s => s.value === newStatus);

    Alert.alert(
      `Cambia a "${statusInfo?.label}"?`,
      statusInfo?.description ?? "Sei sicuro di voler cambiare lo stato?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Conferma",
          style: newStatus === "market_closed" ? "destructive" : "default",
          onPress: async () => {
            try {
              await updateLeagueStatus(leagueId!, newStatus as "participants_joining" | "draft_active" | "repair_active" | "market_closed");
              await refetch();
              setIsStatusPickerOpen(false);
              Alert.alert("✅ Stato Aggiornato", `La lega è ora in stato "${statusInfo?.label}"`);
            } catch (error) {
              Alert.alert("Errore", "Impossibile aggiornare lo stato");
            }
          },
        },
      ]
    );
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
            {!canEditBudget && (
              <View className="bg-amber-900/30 rounded-lg p-2 mb-2">
                <Text className="text-amber-400 text-xs text-center">
                  ⚠️ Modificabile solo in fase "Iscrizioni aperte"
                </Text>
              </View>
            )}
            <Controller
              control={control}
              name="initialBudgetPerManager"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  className={`p-4 rounded-xl ${canEditBudget ? 'bg-dark-card text-white' : 'bg-gray-800 text-gray-500'}`}
                  value={String(value ?? "")}
                  onChangeText={(t) => {
                    const newValue = Number(t) || 0;
                    // Blocca diminuzione lato UI
                    if (newValue >= league.initialBudgetPerManager) {
                      onChange(newValue);
                    }
                  }}
                  keyboardType="numeric"
                  placeholder="500"
                  placeholderTextColor="#6b7280"
                  editable={canEditBudget}
                />
              )}
            />
            {canEditBudget && (
              <Text className="text-gray-500 text-xs mt-1">
                ℹ️ Il budget può solo essere aumentato (min: {league.initialBudgetPerManager})
              </Text>
            )}
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

            {/* Dropdown Selector */}
            <Pressable
              onPress={() => setIsStatusPickerOpen(true)}
              className="bg-dark-bg border border-gray-700 rounded-xl p-4 flex-row items-center justify-between active:opacity-80"
            >
              <View className="flex-row items-center">
                <Text className="text-2xl mr-3">{STATUS_ICONS[league.status] ?? "📋"}</Text>
                <Text className="text-white font-semibold">{STATUS_LABELS[league.status] ?? league.status}</Text>
              </View>
              <Text className="text-gray-400">▼</Text>
            </Pressable>

            {league.status === "market_closed" && (
              <View className="bg-dark-bg p-3 rounded-xl mt-3">
                <Text className="text-gray-400 text-center text-sm">
                  ✅ Questa lega è stata chiusa e archiviata
                </Text>
              </View>
            )}
          </View>

          {/* Status Picker Modal */}
          <Modal
            visible={isStatusPickerOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsStatusPickerOpen(false)}
          >
            <Pressable
              className="flex-1 bg-black/70 items-center justify-center"
              onPress={() => setIsStatusPickerOpen(false)}
            >
              <Pressable
                className="bg-dark-card rounded-2xl p-4 mx-6 w-80"
                onPress={() => { }}
              >
                <Text className="text-white text-lg font-bold mb-4 text-center">
                  Seleziona Stato Lega
                </Text>

                {AVAILABLE_STATUSES.map((status) => {
                  const isCurrentStatus = league.status === status.value;
                  return (
                    <Pressable
                      key={status.value}
                      onPress={() => handleStatusChange(status.value)}
                      disabled={isCurrentStatus}
                      className={`flex-row items-center p-4 rounded-xl mb-2 ${isCurrentStatus
                        ? "bg-primary-600/30 border border-primary-500"
                        : "bg-dark-bg active:opacity-80"
                        }`}
                    >
                      <Text className="text-2xl mr-3">{status.icon}</Text>
                      <View className="flex-1">
                        <Text className={`font-semibold ${isCurrentStatus ? "text-primary-400" : "text-white"}`}>
                          {status.label}
                        </Text>
                        <Text className="text-gray-400 text-xs">{status.description}</Text>
                      </View>
                      {isCurrentStatus && (
                        <Text className="text-primary-400 text-xs">✓ Attuale</Text>
                      )}
                    </Pressable>
                  );
                })}

                <Pressable
                  onPress={() => setIsStatusPickerOpen(false)}
                  className="mt-2 p-3 rounded-xl bg-gray-700"
                >
                  <Text className="text-white text-center font-semibold">Annulla</Text>
                </Pressable>
              </Pressable>
            </Pressable>
          </Modal>

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

          {/* Data Transfer Section */}
          <View className="bg-dark-card rounded-xl p-4 mb-6">
            <Text className="text-white font-semibold mb-2">📦 Trasferimento Dati</Text>
            <Text className="text-gray-400 text-sm mb-4">
              Esporta o importa le rose in formato CSV
            </Text>
            <View className="gap-3">
              <Pressable
                onPress={() => router.push({
                  pathname: "/league/[id]/export",
                  params: { id: leagueId }
                })}
                className="bg-blue-600 p-4 rounded-xl flex-row items-center justify-center active:opacity-80"
              >
                <Text className="text-2xl mr-2">📤</Text>
                <Text className="text-white font-bold">Esporta Rose</Text>
              </Pressable>
              <Pressable
                onPress={() => router.push({
                  pathname: "/league/[id]/import",
                  params: { id: leagueId }
                })}
                className="bg-green-600 p-4 rounded-xl flex-row items-center justify-center active:opacity-80"
              >
                <Text className="text-2xl mr-2">📥</Text>
                <Text className="text-white font-bold">Importa Rose</Text>
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
