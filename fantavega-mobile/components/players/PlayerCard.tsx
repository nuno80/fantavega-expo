// components/players/PlayerCard.tsx
// Player card component with role colors and quotation

import { PlayerAvatar } from "@/components/PlayerAvatar";
import { ROLE_COLORS } from "@/types";
import type { Player } from "@/types/schemas";
import { Pressable, Text, View } from "react-native";

interface PlayerCardProps {
  player: Player;
  onPress?: (player: Player) => void;
}

export function PlayerCard({ player, onPress }: PlayerCardProps) {
  const roleColor = ROLE_COLORS[player.role];

  return (
    <Pressable
      onPress={() => onPress?.(player)}
      className="mx-4 mb-3 flex-row items-center rounded-xl bg-dark-card p-4 active:opacity-80"
    >
      {/* Player Photo */}
      <View className="mr-4">
        <PlayerAvatar
          playerName={player.name}
          playerTeam={player.team}
          role={player.role}
          size="medium"
          photoUrl={player.photoUrl}
        />
      </View>

      {/* Player Info */}
      <View className="flex-1">
        <Text className="text-base font-semibold text-white" numberOfLines={1}>
          {player.name}
        </Text>
        <View className="mt-1 flex-row items-center">
          <View
            className="mr-2 rounded px-2 py-0.5"
            style={{ backgroundColor: roleColor }}
          >
            <Text className="text-xs font-medium text-white">
              {player.role}
            </Text>
          </View>
          <Text className="text-sm text-gray-400">{player.team}</Text>
        </View>
      </View>

      {/* Quotation */}
      <View className="items-end">
        <Text className="text-lg font-bold text-primary-500">
          {player.currentQuotation}
        </Text>
        <Text className="text-xs text-gray-500">crediti</Text>
      </View>
    </Pressable>
  );
}
