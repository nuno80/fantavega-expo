// components/auction/CallPlayerModal.tsx
// Modal per avviare un'asta su un giocatore (con opzione Auto-Bid)

import { useCurrentUser } from "@/contexts/AuthContext";
import { createAuction } from "@/services/auction.service";
import { placeBid } from "@/services/bid.service";
import { ROLE_COLORS } from "@/types";
import type { Player } from "@/types/schemas";
import { useRouter } from "expo-router";
import { Bot } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

interface CallPlayerModalProps {
  visible: boolean;
  player: Player | null;
  leagueId: string | null;
  onClose: () => void;
}

export function CallPlayerModal({
  visible,
  player,
  leagueId,
  onClose,
}: CallPlayerModalProps) {
  const router = useRouter();
  const { currentUserId, currentUser } = useCurrentUser();

  const [bidAmount, setBidAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Auto-bid state
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState("");

  // Get current user's team name
  const teamName = currentUser?.username ?? "Team";

  const handleStartAuction = async () => {
    if (!player || !leagueId || !currentUserId) {
      Alert.alert("Errore", "Dati mancanti per avviare l'asta");
      return;
    }

    const amount = parseInt(bidAmount, 10);
    if (isNaN(amount) || amount < 1) {
      Alert.alert("Errore", "Inserisci un importo valido (minimo 1)");
      return;
    }

    // Validazione auto-bid
    const maxAmount = useAutoBid ? parseInt(maxBidAmount, 10) : undefined;
    if (useAutoBid && maxAmount) {
      if (isNaN(maxAmount) || maxAmount < amount) {
        Alert.alert("Errore", "Il massimo auto-bid deve essere >= alla tua offerta.");
        return;
      }
    }

    setIsLoading(true);
    try {
      // 1. Crea l'asta
      const auctionId = await createAuction(leagueId, {
        playerId: player.id,
        playerName: player.name,
        playerRole: player.role,
        playerTeam: player.team,
        playerPhotoUrl: player.photoUrl ?? null,
        scheduledEndTime: Date.now() + 1440 * 60 * 1000, // 24h default
      });

      // 2. Piazza la prima offerta (con auto-bid se attivo)
      const bidResult = await placeBid({
        leagueId,
        auctionId,
        userId: currentUserId,
        username: teamName,
        amount,
        bidType: "manual",
        maxAmount, // undefined se auto-bid non attivo
      });

      if (!bidResult.success) {
        throw new Error(bidResult.message);
      }

      // 3. Chiudi modale e naviga all'asta
      onClose();
      setBidAmount("");
      setMaxBidAmount("");
      setUseAutoBid(false);

      router.push({
        pathname: "/auction/[id]",
        params: { id: auctionId, leagueId },
      });
    } catch (error) {
      console.error("Error starting auction:", error);
      Alert.alert("Errore", "Impossibile avviare l'asta. Riprova.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!player) return null;

  const roleColor = ROLE_COLORS[player.role];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="rounded-t-3xl bg-dark-bg p-6">
          {/* Header */}
          <View className="mb-6 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-white">
              🎯 Chiama all'Asta
            </Text>
            <Pressable onPress={onClose} className="p-2">
              <Text className="text-2xl text-gray-400">✕</Text>
            </Pressable>
          </View>

          {/* Player Info */}
          <View className="mb-6 flex-row items-center rounded-xl bg-dark-card p-4">
            <View
              className="mr-4 h-16 w-16 items-center justify-center rounded-full"
              style={{ backgroundColor: roleColor }}
            >
              <Text className="text-2xl font-bold text-white">{player.role}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-white">{player.name}</Text>
              <Text className="text-sm text-gray-400">{player.team}</Text>
            </View>
            <View className="items-end">
              <Text className="text-xl font-bold text-primary-500">
                {player.currentQuotation}
              </Text>
              <Text className="text-xs text-gray-500">QTA</Text>
            </View>
          </View>

          {/* Bid Input */}
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-white">
              💰 La tua offerta iniziale
            </Text>
            <TextInput
              className="h-14 rounded-xl bg-dark-card px-4 text-center text-2xl font-bold text-white"
              placeholder={player.currentQuotation.toString()}
              placeholderTextColor="#6b7280"
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="number-pad"
            />
            <Text className="mt-2 text-center text-xs text-gray-500">
              Suggerito: {player.currentQuotation} crediti (quotazione)
            </Text>
          </View>

          {/* Quick Amounts */}
          <View className="mb-4 flex-row justify-around">
            {[1, player.currentQuotation, player.currentQuotation + 5].map((amount, index) => (
              <Pressable
                key={`quick-${index}-${amount}`}
                onPress={() => setBidAmount(amount.toString())}
                className="rounded-lg bg-dark-card px-4 py-2 active:opacity-80"
              >
                <Text className="font-semibold text-white">{amount}</Text>
              </Pressable>
            ))}
          </View>

          {/* Auto-Bid Section */}
          <View className="mb-4 rounded-xl bg-indigo-900/30 p-4">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center">
                <Bot size={20} color="#818cf8" />
                <Text className="ml-2 font-semibold text-indigo-300">
                  🤖 Auto-Bid
                </Text>
              </View>
              <Switch
                value={useAutoBid}
                onValueChange={setUseAutoBid}
                trackColor={{ false: "#374151", true: "#4f46e5" }}
                thumbColor={useAutoBid ? "#a5b4fc" : "#9ca3af"}
              />
            </View>

            {useAutoBid && (
              <>
                <Text className="mb-2 text-xs text-gray-400">
                  Il sistema rilancerà automaticamente fino al tuo massimo
                </Text>
                <TextInput
                  className="rounded-xl bg-[#11111a] p-3 text-white border border-indigo-600"
                  placeholder="Massimo auto-bid..."
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  value={maxBidAmount}
                  onChangeText={setMaxBidAmount}
                />
                <Text className="mt-1 text-xs text-gray-500">
                  Pagherai solo 1 in più del secondo miglior offerente
                </Text>
              </>
            )}
          </View>

          {/* Start Auction Button */}
          <Pressable
            onPress={handleStartAuction}
            disabled={isLoading || !bidAmount}
            className={`rounded-xl p-4 ${isLoading || !bidAmount ? "bg-gray-600" : "bg-green-600 active:opacity-80"
              }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-lg font-bold text-white">
                🚀 Avvia Asta
              </Text>
            )}
          </Pressable>

          {/* Info */}
          <Text className="mt-4 text-center text-xs text-gray-500">
            L'asta durerà 24 ore. Altri manager potranno rilanciare.
          </Text>
        </View>
      </View>
    </Modal>
  );
}
