// components/auction/AuctionCard.tsx
// Card per visualizzare un'asta nella lista
// Best Practice: expo-image per performance, NativeWind per stili

import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { PlayerRole, ROLE_COLORS } from "@/types";
import { LiveAuction } from "@/types/schemas";
import { Image } from "expo-image";
import { Pressable, Text, View } from "react-native";

interface AuctionCardProps {
  auctionId: string;
  auction: LiveAuction;
  onPress?: (auctionId: string) => void;
}

export const AuctionCard = ({
  auctionId,
  auction,
  onPress,
}: AuctionCardProps) => {
  const roleColor = ROLE_COLORS[auction.playerRole as PlayerRole] || "#6b7280";

  return (
    <Pressable
      onPress={() => onPress?.(auctionId)}
      className="mx-4 mb-3 overflow-hidden rounded-2xl bg-dark-card active:opacity-90"
    >
      <View className="flex-row">
        {/* Player Photo */}
        <View className="relative">
          <Image
            source={
              auction.playerPhotoUrl
                ? { uri: auction.playerPhotoUrl }
                : require("@/assets/icon.png")
            }
            style={{ width: 90, height: 90 }}
            contentFit="cover"
          />
          {/* Role Badge */}
          <View
            className="absolute bottom-1 left-1 rounded-full px-2 py-0.5"
            style={{ backgroundColor: roleColor }}
          >
            <Text className="text-xs font-bold text-white">
              {auction.playerRole}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View className="flex-1 p-3">
          {/* Header: Name + Team */}
          <View className="mb-1">
            <Text className="text-base font-bold text-white" numberOfLines={1}>
              {auction.playerName}
            </Text>
            <Text className="text-xs text-gray-400">{auction.playerTeam}</Text>
          </View>

          {/* Bid Info - Stacked layout */}
          <View className="flex-row items-end justify-between mt-1">
            {/* Current Bid */}
            <View>
              <Text className="text-[10px] text-gray-500 uppercase">Offerta</Text>
              <View className="flex-row items-center">
                <Text className="text-lg font-bold text-primary-400">
                  {auction.currentBid}
                </Text>
                <Text className="ml-1 text-sm">💰</Text>
              </View>
            </View>

            {/* Current Bidder */}
            <View className="items-end flex-shrink">
              <Text className="text-[10px] text-gray-500 uppercase">Leader</Text>
              <Text
                className="text-sm font-medium text-green-400"
                numberOfLines={1}
              >
                {auction.currentBidderName || "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Timer - Right side */}
        <View className="justify-center px-3 bg-dark-bg/50">
          <AuctionTimer scheduledEndTime={auction.scheduledEndTime} size="small" />
        </View>
      </View>
    </Pressable>
  );
};
