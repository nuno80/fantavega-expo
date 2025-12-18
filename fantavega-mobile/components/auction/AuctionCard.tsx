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
            style={{ width: 100, height: 100 }}
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
        <View className="flex-1 justify-between p-3">
          {/* Header: Name + Team */}
          <View>
            <Text className="text-lg font-bold text-white" numberOfLines={1}>
              {auction.playerName}
            </Text>
            <Text className="text-sm text-gray-400">{auction.playerTeam}</Text>
          </View>

          {/* Current Bid */}
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-gray-500">Offerta attuale</Text>
              <Text className="text-xl font-bold text-primary-400">
                {auction.currentBid} 💰
              </Text>
            </View>

            {/* Current Bidder */}
            {auction.currentBidderName && (
              <View className="items-end">
                <Text className="text-xs text-gray-500">Miglior offerente</Text>
                <Text className="text-sm font-medium text-white" numberOfLines={1}>
                  {auction.currentBidderName}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Timer */}
        <View className="justify-center pr-3">
          <AuctionTimer scheduledEndTime={auction.scheduledEndTime} size="small" />
        </View>
      </View>
    </Pressable>
  );
};
