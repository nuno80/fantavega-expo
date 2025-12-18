// app/auction/[id].tsx
// Dettaglio singola asta con bidding interface
// Best Practice: Dynamic route, real-time updates, expo-image

import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { BiddingInterface } from "@/components/auction/BiddingInterface";
import { useAuction } from "@/hooks/useAuction";
import { getBidHistory } from "@/services/bid.service";
import { PlayerRole, ROLE_COLORS } from "@/types";
import { Bid } from "@/types/schemas";
import { Image } from "expo-image";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

export default function AuctionDetailScreen() {
  const { id: auctionId, leagueId } = useLocalSearchParams<{
    id: string;
    leagueId: string;
  }>();

  const { auction, isLoading, error } = useAuction(leagueId ?? null, auctionId ?? null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Carica storico offerte
  useEffect(() => {
    if (!leagueId || !auctionId) return;

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const history = await getBidHistory(leagueId, auctionId);
        setBidHistory(history);
      } catch (err) {
        console.error("Failed to load bid history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [leagueId, auctionId, auction?.currentBid]);

  // Loading state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  // Error state
  if (error || !auction) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg p-6">
        <Text className="mb-4 text-4xl">❌</Text>
        <Text className="text-center text-lg text-white">
          {error?.message || "Asta non trovata"}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 rounded-xl bg-primary-600 px-6 py-3"
        >
          <Text className="font-semibold text-white">Torna indietro</Text>
        </Pressable>
      </View>
    );
  }

  const roleColor = ROLE_COLORS[auction.playerRole as PlayerRole] || "#6b7280";

  return (
    <>
      <Stack.Screen
        options={{
          title: auction.playerName,
          headerStyle: { backgroundColor: "#0f0f0f" },
          headerTintColor: "#fff",
        }}
      />

      <ScrollView className="flex-1 bg-dark-bg">
        {/* Player Header */}
        <View className="items-center p-6">
          {/* Photo */}
          <View className="relative mb-4">
            <Image
              source={
                auction.playerPhotoUrl
                  ? { uri: auction.playerPhotoUrl }
                  : require("@/assets/icon.png")
              }
              style={{ width: 150, height: 150, borderRadius: 75 }}
              contentFit="cover"
            />
            {/* Role Badge */}
            <View
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full px-4 py-1"
              style={{ backgroundColor: roleColor }}
            >
              <Text className="font-bold text-white">{auction.playerRole}</Text>
            </View>
          </View>

          {/* Name & Team */}
          <Text className="text-2xl font-bold text-white">
            {auction.playerName}
          </Text>
          <Text className="text-gray-400">{auction.playerTeam}</Text>

          {/* Timer */}
          <View className="mt-4">
            <AuctionTimer scheduledEndTime={auction.scheduledEndTime} size="large" />
          </View>
        </View>

        {/* Current Bid Section */}
        <View className="mx-4 mb-4 rounded-2xl bg-dark-card p-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-sm text-gray-500">Offerta attuale</Text>
              <Text className="text-3xl font-bold text-primary-400">
                {auction.currentBid} 💰
              </Text>
            </View>
            {auction.currentBidderName && (
              <View className="items-end">
                <Text className="text-sm text-gray-500">Miglior offerente</Text>
                <Text className="text-lg font-semibold text-white">
                  {auction.currentBidderName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bidding Interface */}
        <View className="mx-4 mb-4">
          <BiddingInterface
            leagueId={leagueId!}
            auctionId={auctionId!}
            currentBid={auction.currentBid}
            currentBidderId={auction.currentBidderId}
          />
        </View>

        {/* Bid History */}
        <View className="mx-4 mb-8 rounded-2xl bg-dark-card p-4">
          <Text className="mb-3 text-lg font-semibold text-white">
            📜 Storico Offerte
          </Text>

          {historyLoading ? (
            <ActivityIndicator size="small" color="#4f46e5" />
          ) : bidHistory.length === 0 ? (
            <Text className="text-center text-gray-400">
              Nessuna offerta ancora
            </Text>
          ) : (
            bidHistory.slice(0, 10).map((bid, index) => (
              <View
                key={`${bid.bidTime}-${index}`}
                className="flex-row items-center justify-between border-b border-gray-800 py-2 last:border-b-0"
              >
                <View className="flex-row items-center">
                  <Text className="text-white">{bid.username}</Text>
                  {bid.bidType !== "manual" && (
                    <View className="ml-2 rounded bg-gray-700 px-1.5 py-0.5">
                      <Text className="text-xs text-gray-400">{bid.bidType}</Text>
                    </View>
                  )}
                </View>
                <Text className="font-bold text-primary-400">{bid.amount} 💰</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </>
  );
}
