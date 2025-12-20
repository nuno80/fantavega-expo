// app/auction/[id].tsx
// Dettaglio singola asta - SOLO BIDDING
// I tab Rosa/Manager sono ora nella pagina della lega

import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { BidBottomSheet } from "@/components/auction/BidBottomSheet";
import { useAuction } from "@/hooks/useAuction";
import { placeBid } from "@/services/bid.service";
import { useUserStore } from "@/stores/userStore";
import { PlayerRole, ROLE_COLORS } from "@/types";
import { Image } from "expo-image";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Info } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View
} from "react-native";

export default function AuctionDetailScreen() {
  const { id: auctionId, leagueId } = useLocalSearchParams<{
    id: string;
    leagueId: string;
  }>();
  const router = useRouter();

  const { currentUserId, currentUser } = useUserStore();
  const { auction, isLoading, error } = useAuction(leagueId ?? null, auctionId ?? null);

  const [isBidSheetOpen, setIsBidSheetOpen] = useState(false);
  const [isBidding, setIsBidding] = useState(false);

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
            <Image
              source={
                auction.playerPhotoUrl
                  ? { uri: auction.playerPhotoUrl }
                  : require("@/assets/icon.png")
              }
              style={{ width: 140, height: 140, borderRadius: 70 }}
              contentFit="cover"
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
        <View className="mx-6 mb-6 rounded-2xl bg-dark-card p-5">
          <Text className="text-center text-sm text-gray-400 uppercase tracking-wider">Offerta Attuale</Text>
          <Text className="text-center text-4xl font-bold text-primary-400 my-2">
            {auction.currentBid} 💰
          </Text>
          <Text className="text-center text-sm text-gray-500">
            di {auction.currentBidderName ?? "Nessun offerente"}
          </Text>
        </View>

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

      {/* Bottom Action Button */}
      <View className="absolute bottom-0 left-0 right-0 p-4 bg-dark-bg border-t border-gray-800">
        <Pressable
          onPress={() => setIsBidSheetOpen(true)}
          className="rounded-xl bg-primary-600 p-4 active:opacity-80"
        >
          <Text className="text-center text-lg font-bold text-white">
            💰 Fai un'offerta
          </Text>
        </Pressable>
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
      />
    </View>
  );
}
