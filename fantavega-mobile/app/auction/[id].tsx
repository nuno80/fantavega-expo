// app/auction/[id].tsx
// Dettaglio singola asta - Thumb-Zone UI
// Pulsanti: Menu, +1, Offri con conferma

import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { BidBottomSheet } from "@/components/auction/BidBottomSheet";
import { BudgetStats } from "@/components/auction/BudgetStats";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useCurrentUser } from "@/contexts/AuthContext";
import { useAuction } from "@/hooks/useAuction";
import { useUserAutoBid } from "@/hooks/useAutoBid";
import { useUserBudget } from "@/hooks/useBudget";
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
  const { result: complianceResult } = useComplianceCheck(
    leagueId ?? null,
    currentUserId,
    league?.status
  );

  const [isBidSheetOpen, setIsBidSheetOpen] = useState(false);
  const [isBidding, setIsBidding] = useState(false);
  const [isAutoBidModalOpen, setIsAutoBidModalOpen] = useState(false);
  const [autoBidAmount, setAutoBidAmount] = useState("");
  // Pending bid state for confirmation flow
  const [pendingBid, setPendingBid] = useState<number>(0);
  const insets = useSafeAreaInsets();

  // Budget data reale da Firebase
  const budget = useUserBudget(leagueId ?? null, league?.initialBudgetPerManager ?? 500);
  const userBudget = budget.availableBudget;


  // Mantieni lo schermo acceso durante la visualizzazione dell'asta
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

  // Sync pending bid when current bid changes
  useEffect(() => {
    if (auction?.currentBid) {
      setPendingBid(auction.currentBid + 1);
    }
  }, [auction?.currentBid]);

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

          <Text className="mt-6 text-2xl font-bold text-white leading-tight">{auction.playerName}</Text>
          <Text className="text-gray-400 text-base">{auction.playerTeam}</Text>
        </View>

        {/* Timer */}
        <View className="items-center mb-4">
          <AuctionTimer scheduledEndTime={auction.scheduledEndTime} size="large" />
        </View>

        {/* Status Banner */}
        <View className={`mx-6 mb-4 rounded-2xl p-4 ${isHighestBidder ? "bg-green-900/30" : "bg-dark-card"}`}>
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

        {/* Current Bid Display - COMPACT */}
        <View className="mx-6 mb-2 rounded-xl bg-dark-card p-3">
          <Text className="text-center text-xs text-gray-400 uppercase tracking-wider">Offerta Attuale</Text>
          <Text className="text-center text-3xl font-bold text-primary-400 my-1">
            {auction.currentBid} 💰
          </Text>
          <Text className="text-center text-xs text-gray-500">
            di {auction.currentBidderName ?? "Nessun offerente"}
          </Text>
        </View>

        {/* Auto-Bid Indicator */}
        {hasActiveAutoBid && userAutoBidMax && (
          <View className="mx-6 mb-4 rounded-2xl bg-indigo-900/30 p-3 flex-row items-center">
            <Bot size={24} color="#818cf8" />
            <View className="ml-3 flex-1">
              <Text className="text-indigo-300 font-semibold text-sm">🤖 Auto-Bid Attivo</Text>
              <Text className="text-indigo-400 text-xs">Max: {userAutoBidMax} crediti</Text>
            </View>
            <View className="bg-indigo-600/30 px-3 py-1 rounded-full">
              <Text className="text-indigo-300 text-[10px] font-semibold">ATTIVO</Text>
            </View>
          </View>
        )}

        {/* Budget Stats - 4 metriche */}
        <View className="mx-6">
          <BudgetStats
            disponibili={budget.availableBudget}
            spesi={budget.spentCredits}
            dispAutoBid={budget.availableForAutoBid}
            bloccati={budget.totalBlocked}
          />
        </View>
      </ScrollView>

      {/* Bottom Action Buttons - Thumb-Zone First */}
      <View
        className="absolute bottom-0 left-0 right-0 py-4 bg-dark-bg border-t border-gray-800"
        style={{ paddingBottom: Math.max(insets.bottom + 8, 24) }}
      >
        <View className="flex-row gap-2 items-center px-4">
          {/* 1. Options/Menu Button */}
          <Pressable
            onPress={() => setIsBidSheetOpen(true)}
            className="w-16 h-16 rounded-xl bg-gray-800 border border-gray-700 active:opacity-80 items-center justify-center relative shadow-sm"
          >
            <Settings2 size={24} color="#9ca3af" />
            <Text className="absolute bottom-1 text-[8px] text-gray-400 font-bold tracking-wide">MENU</Text>
          </Pressable>

          {/* 2. +1 Increment Button */}
          <Pressable
            onPress={() => setPendingBid(p => p + 1)}
            disabled={isBidding}
            className="w-20 h-16 rounded-xl bg-gray-700 active:bg-gray-600 active:opacity-80 items-center justify-center border-b-4 border-gray-900 shadow-sm"
          >
            <Text className="text-white text-2xl font-bold">+1</Text>
          </Pressable>

          {/* 3. CONFIRM Button - Largest & Green */}
          <Pressable
            onPress={() => handlePlaceBid(pendingBid)}
            disabled={isBidding || pendingBid > userBudget}
            className={`flex-1 h-16 rounded-xl active:translate-y-1 active:border-b-0 items-center justify-center flex-row shadow-lg border-b-4 border-green-800 ${pendingBid <= userBudget && !isBidding
              ? "bg-green-600"
              : "bg-gray-700 opacity-50 border-gray-900"
              }`}
          >
            <View className="items-center">
              <Text className="text-white text-[10px] font-bold uppercase tracking-widest opacity-90">
                OFFRI
              </Text>
              <Text className="text-white text-2xl font-black leading-6">
                {pendingBid}
              </Text>
            </View>
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
            onPress={() => { }}
          >
            <View className="flex-row items-center mb-4">
              <Bot size={28} color="#818cf8" />
              <Text className="text-white text-xl font-bold ml-3">Auto-Bid</Text>
            </View>

            <Text className="text-gray-400 mb-4">
              Imposta il massimo che sei disposto a pagare.
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
