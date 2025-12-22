// app/auction/[id].tsx
// Dettaglio singola asta - SOLO BIDDING
// I tab Rosa/Manager sono ora nella pagina della lega

import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { BidBottomSheet } from "@/components/auction/BidBottomSheet";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useCurrentUser } from "@/contexts/AuthContext";
import { useAuction } from "@/hooks/useAuction";
import { useUserAutoBid } from "@/hooks/useAutoBid";
import { useComplianceCheck } from "@/hooks/useCompliance";
import { useLeague } from "@/hooks/useLeague";
import { placeBid, setAutoBid } from "@/services/bid.service";
import { PlayerRole, ROLE_COLORS } from "@/types";


import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Bot, Info, Settings2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AuctionDetailScreen() {
  const { id: auctionId, leagueId } = useLocalSearchParams<{
    id: string;
    leagueId: string;
  }>();
  const router = useRouter();

  const { currentUserId, currentUser } = useCurrentUser();
  const { auction, isLoading, error } = useAuction(leagueId ?? null, auctionId ?? null);

  // Auto-bid dell'utente per questa asta
  const { maxAmount: userAutoBidMax, isActive: hasActiveAutoBid } = useUserAutoBid(
    leagueId ?? null,
    auctionId ?? null,
    currentUserId
  );

  // Recupera dati lega per check compliance
  const { data: league } = useLeague(leagueId ?? "");

  // 🔴 TRIGGER COMPLIANCE CHECK all'accesso della pagina asta
  // Verifica se l'utente rispetta i requisiti di rosa e applica penalità se necessario
  const { result: complianceResult } = useComplianceCheck(
    leagueId ?? null,
    currentUserId,
    league?.status
  );

  const [isBidSheetOpen, setIsBidSheetOpen] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [isAutoBidModalOpen, setIsAutoBidModalOpen] = useState(false);
  const [autoBidAmount, setAutoBidAmount] = useState("");
  const insets = useSafeAreaInsets();


  // Mantieni lo schermo acceso durante la visualizzazione dell'asta
  // Wrapped in try-catch per evitare crash in Expo Go
  useEffect(() => {
    let active = true;
    activateKeepAwakeAsync().catch(() => {
      // Silently ignore - non-critical feature
    });
    return () => {
      if (active) {
        deactivateKeepAwake();
        active = false;
      }
    };
  }, []);

  const handlePlaceBid = async (amount: number, maxAmount?: number) => {
    if (!leagueId || !auctionId || !auction) return;
    setIsBidding(true);
    try {
      const result = await placeBid({
        leagueId,
        auctionId,
        userId: currentUserId,
        username: currentUser?.username ?? "Manager",
        amount,
        bidType: "manual",
        maxAmount,
      });

      if (result.success) {
        setIsBidSheetOpen(false);
        if (maxAmount) {
          Alert.alert("✅ Offerta + Auto-bid", `Offerta ${amount} con max ${maxAmount}`);
        }
      } else {
        Alert.alert("Errore offerta", result.message);
      }
    } catch (e) {
      Alert.alert("Errore", "Impossibile piazzare l'offerta");
    } finally {
      setIsBidding(false);
    }
  };

  const handleQuickBid = async (increment: number) => {
    if (!auction) return;
    const newAmount = auction.currentBid + increment;
    await handlePlaceBid(newAmount);
  };

  const handleSetAutoBid = async () => {
    if (!leagueId || !auctionId || !auction) return;
    const maxAmount = parseInt(autoBidAmount, 10);
    if (isNaN(maxAmount) || maxAmount <= auction.currentBid) {
      Alert.alert("Errore", `L'auto-bid deve essere maggiore di ${auction.currentBid}`);
      return;
    }
    try {
      await setAutoBid({
        leagueId,
        auctionId,
        userId: currentUserId,
        username: currentUser?.username ?? "Manager",
        maxAmount,
      });
      setIsAutoBidModalOpen(false);
      setAutoBidAmount("");
      Alert.alert("✅ Auto-Bid Attivato", `Il sistema offrirà automaticamente fino a ${maxAmount} crediti`);
    } catch (e) {
      Alert.alert("Errore", "Impossibile attivare auto-bid");
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  if (error || !auction) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg p-6">
        <Text className="text-5xl mb-4">❌</Text>
        <Text className="text-white text-lg font-semibold">Asta non trovata</Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-xl bg-primary-600 px-6 py-3"
        >
          <Text className="text-white font-semibold">Torna indietro</Text>
        </Pressable>
      </View>
    );
  }

  const roleColor = ROLE_COLORS[auction.playerRole as PlayerRole] || "#6b7280";
  const isHighestBidder = auction.currentBidderId === currentUserId;
  const userBudget = 500; // TODO: get from participant data

  return (
    <View className="flex-1 bg-dark-bg">
      <Stack.Screen
        options={{
          headerTitle: "",
          headerStyle: { backgroundColor: "#0f0f0f" },
          headerTintColor: "#fff",
        }}
      />

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Player Card */}
        <View className="items-center p-6">
          <View className="relative">
            <PlayerAvatar
              playerName={auction.playerName}
              playerTeam={auction.playerTeam}
              role={auction.playerRole as PlayerRole}
              size="xlarge"
              photoUrl={auction.playerPhotoUrl}
            />
            <View
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-4 py-1"
              style={{ backgroundColor: roleColor }}
            >
              <Text className="font-bold text-white">{auction.playerRole}</Text>
            </View>
          </View>

          <Text className="mt-6 text-2xl font-bold text-white">{auction.playerName}</Text>
          <Text className="text-gray-400">{auction.playerTeam}</Text>
        </View>

        {/* Timer */}
        <View className="items-center mb-6">
          <AuctionTimer scheduledEndTime={auction.scheduledEndTime} size="large" />
        </View>

        {/* Status Banner */}
        <View className={`mx-6 mb-6 rounded-2xl p-5 ${isHighestBidder ? "bg-green-900/30" : "bg-dark-card"}`}>
          <View className="flex-row items-center justify-center">
            {isHighestBidder ? (
              <>
                <Text className="text-3xl mr-3">✅</Text>
                <View>
                  <Text className="text-lg font-bold text-green-400">Stai vincendo!</Text>
                  <Text className="text-sm text-gray-400">Attendi la scadenza del timer</Text>
                </View>
              </>
            ) : (
              <>
                <Info size={28} color="#818cf8" />
                <View className="ml-3">
                  <Text className="text-lg font-bold text-white">Fai un'offerta</Text>
                  <Text className="text-sm text-gray-400">Leader: {auction.currentBidderName ?? "Nessuno"}</Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Current Bid Display */}
        <View className="mx-6 mb-4 rounded-2xl bg-dark-card p-5">
          <Text className="text-center text-sm text-gray-400 uppercase tracking-wider">Offerta Attuale</Text>
          <Text className="text-center text-4xl font-bold text-primary-400 my-2">
            {auction.currentBid} 💰
          </Text>
          <Text className="text-center text-sm text-gray-500">
            di {auction.currentBidderName ?? "Nessun offerente"}
          </Text>
        </View>

        {/* Auto-Bid Indicator */}
        {hasActiveAutoBid && userAutoBidMax && (
          <View className="mx-6 mb-6 rounded-2xl bg-indigo-900/30 p-4 flex-row items-center">
            <Bot size={24} color="#818cf8" />
            <View className="ml-3 flex-1">
              <Text className="text-indigo-300 font-semibold">🤖 Auto-Bid Attivo</Text>
              <Text className="text-indigo-400 text-sm">Max: {userAutoBidMax} crediti</Text>
            </View>
            <View className="bg-indigo-600/30 px-3 py-1 rounded-full">
              <Text className="text-indigo-300 text-xs font-semibold">ATTIVO</Text>
            </View>
          </View>
        )}

        {/* Quick Bid Buttons */}
        <View className="mx-6 mb-6 flex-row gap-3">
          {[1, 5, 10].map((inc) => {
            const newAmount = auction.currentBid + inc;
            const canAfford = newAmount <= userBudget;
            return (
              <Pressable
                key={inc}
                onPress={() => handleQuickBid(inc)}
                disabled={!canAfford || isBidding}
                className={`flex-1 items-center justify-center rounded-xl py-4 ${canAfford ? "bg-indigo-600 active:opacity-80" : "bg-gray-700 opacity-50"}`}
              >
                <Text className="font-bold text-white text-lg">+{inc}</Text>
                <Text className="text-xs text-gray-300">({newAmount})</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Budget Info */}
        <View className="mx-6 flex-row justify-between rounded-xl bg-dark-card p-4">
          <View className="items-center flex-1">
            <Text className="text-xs text-gray-500 uppercase">Tuo Budget</Text>
            <Text className="text-xl font-bold text-white">{userBudget}</Text>
          </View>
          <View className="w-px bg-gray-700" />
          <View className="items-center flex-1">
            <Text className="text-xs text-gray-500 uppercase">Max Rilancio</Text>
            <Text className="text-xl font-bold text-white">{userBudget}</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons with Safe Area */}
      <View
        className="absolute bottom-0 left-0 right-0 p-4 bg-dark-bg border-t border-gray-800"
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
      >
        <View className="flex-row gap-3">
          {/* Auto-Bid Button */}
          <Pressable
            onPress={() => {
              setAutoBidAmount(userAutoBidMax ? String(userAutoBidMax) : String((auction?.currentBid ?? 0) + 10));
              setIsAutoBidModalOpen(true);
            }}
            className="rounded-xl bg-indigo-700 p-4 active:opacity-80 items-center justify-center"
          >
            <Bot size={24} color="#fff" />
          </Pressable>

          {/* Main Bid Button */}
          <Pressable
            onPress={() => setIsBidSheetOpen(true)}
            className="flex-1 rounded-xl bg-primary-600 p-4 active:opacity-80"
          >
            <Text className="text-center text-lg font-bold text-white">
              💰 Fai un'offerta
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Bid Modal */}
      <BidBottomSheet
        isOpen={isBidSheetOpen}
        onClose={() => setIsBidSheetOpen(false)}
        playerName={auction.playerName}
        currentBid={auction.currentBid}
        userBudget={userBudget}
        onPlaceBid={handlePlaceBid}
        isLoading={isBidding}
        existingAutoBid={userAutoBidMax}
      />

      {/* Auto-Bid Modal */}
      <Modal
        visible={isAutoBidModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAutoBidModalOpen(false)}
      >
        <Pressable
          className="flex-1 bg-black/70 items-center justify-center"
          onPress={() => setIsAutoBidModalOpen(false)}
        >
          <Pressable
            className="bg-dark-card rounded-2xl p-6 mx-6 w-80"
            onPress={() => { }} // Prevent close on inner tap
          >
            <View className="flex-row items-center mb-4">
              <Bot size={28} color="#818cf8" />
              <Text className="text-white text-xl font-bold ml-3">Auto-Bid</Text>
            </View>

            <Text className="text-gray-400 mb-4">
              Imposta il massimo che sei disposto a pagare. Il sistema offrirà automaticamente per te.
            </Text>

            <Text className="text-gray-500 text-sm mb-2">
              Offerta attuale: {auction.currentBid} crediti
            </Text>

            <TextInput
              value={autoBidAmount}
              onChangeText={setAutoBidAmount}
              keyboardType="number-pad"
              placeholder="Max crediti..."
              placeholderTextColor="#6b7280"
              className="bg-gray-800 text-white rounded-xl p-4 text-lg mb-4"
            />

            {hasActiveAutoBid && (
              <View className="bg-indigo-900/40 rounded-xl p-3 mb-4 flex-row items-center">
                <Settings2 size={16} color="#818cf8" />
                <Text className="text-indigo-300 text-sm ml-2">
                  Auto-bid attivo: max {userAutoBidMax}
                </Text>
              </View>
            )}

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => setIsAutoBidModalOpen(false)}
                className="flex-1 rounded-xl bg-gray-700 p-4"
              >
                <Text className="text-center text-white font-semibold">Annulla</Text>
              </Pressable>
              <Pressable
                onPress={handleSetAutoBid}
                className="flex-1 rounded-xl bg-indigo-600 p-4"
              >
                <Text className="text-center text-white font-bold">
                  {hasActiveAutoBid ? "Aggiorna" : "Attiva"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
