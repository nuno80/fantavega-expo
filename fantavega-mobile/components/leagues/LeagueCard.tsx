// components/leagues/LeagueCard.tsx
// League card component for dashboard

import type { League } from "@/types/schemas";
import { Pressable, Text, View } from "react-native";

interface LeagueCardProps {
  league: League;
  onPress?: (league: League) => void;
}

const STATUS_LABELS: Record<League["status"], string> = {
  participants_joining: "Iscrizioni aperte",
  draft_active: "Asta in corso",
  repair_active: "Riparazioni",
  market_closed: "Mercato chiuso",
};

const STATUS_COLORS: Record<League["status"], string> = {
  participants_joining: "#22c55e", // green
  draft_active: "#f59e0b", // amber
  repair_active: "#3b82f6", // blue
  market_closed: "#8b5cf6", // purple (final state)
};

export function LeagueCard({ league, onPress }: LeagueCardProps) {
  const statusColor = STATUS_COLORS[league.status];

  return (
    <Pressable
      onPress={() => onPress?.(league)}
      className="mx-4 mb-4 rounded-2xl bg-dark-card p-5 active:opacity-80"
    >
      {/* Header */}
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="flex-1 text-xl font-bold text-white" numberOfLines={1}>
          {league.name}
        </Text>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: statusColor }}
        >
          <Text className="text-xs font-semibold text-white">
            {STATUS_LABELS[league.status]}
          </Text>
        </View>
      </View>

      {/* Stats */}
      <View className="flex-row justify-between">
        <View className="items-center">
          <Text className="text-2xl font-bold text-primary-500">
            {league.initialBudgetPerManager}
          </Text>
          <Text className="text-xs text-gray-400">Budget</Text>
        </View>
        <View className="items-center">
          <Text className="text-2xl font-bold text-white">
            {league.slotsP + league.slotsD + league.slotsC + league.slotsA}
          </Text>
          <Text className="text-xs text-gray-400">Slot Rosa</Text>
        </View>
        <View className="items-center">
          <Text className="text-lg font-semibold text-gray-300">
            {league.leagueType === "classic" ? "Classic" : "Mantra"}
          </Text>
          <Text className="text-xs text-gray-400">Tipo</Text>
        </View>
      </View>

      {/* Slots breakdown */}
      <View className="mt-4 flex-row justify-around rounded-xl bg-dark-bg p-3">
        <View className="items-center">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-role-P">
            <Text className="font-bold text-white">{league.slotsP}</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-500">P</Text>
        </View>
        <View className="items-center">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-role-D">
            <Text className="font-bold text-white">{league.slotsD}</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-500">D</Text>
        </View>
        <View className="items-center">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-role-C">
            <Text className="font-bold text-white">{league.slotsC}</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-500">C</Text>
        </View>
        <View className="items-center">
          <View className="h-8 w-8 items-center justify-center rounded-full bg-role-A">
            <Text className="font-bold text-white">{league.slotsA}</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-500">A</Text>
        </View>
      </View>
    </Pressable>
  );
}
