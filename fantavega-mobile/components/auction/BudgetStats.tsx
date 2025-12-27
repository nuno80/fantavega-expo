// components/auction/BudgetStats.tsx
// Componente per visualizzare le 4 metriche del budget

import { Info } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";

interface BudgetStatsProps {
  disponibili: number;
  spesi: number;
  dispAutoBid: number;
  bloccati: number;
}

export function BudgetStats({ disponibili, spesi, dispAutoBid, bloccati }: BudgetStatsProps) {
  const [showTooltip, setShowTooltip] = useState<string | null>(null);

  const stats = [
    {
      label: "DISP.",
      value: disponibili,
      color: "text-green-400",
      tooltip: "Crediti disponibili per offerte manuali"
    },
    {
      label: "SPESI",
      value: spesi,
      color: "text-gray-400",
      tooltip: "Crediti già spesi per giocatori acquistati"
    },
    {
      label: "DISP. A-BID",
      value: dispAutoBid,
      color: "text-indigo-400",
      tooltip: "Crediti disponibili per auto-bid (esclusi bloccati)"
    },
    {
      label: "BLOCCATI",
      value: bloccati,
      color: "text-amber-400",
      tooltip: "Crediti bloccati da auto-bid attivi"
    },
  ];

  return (
    <View className="flex-row justify-between rounded-xl bg-dark-card p-3 border border-gray-800">
      {stats.map((stat, index) => (
        <Pressable
          key={stat.label}
          onPress={() => setShowTooltip(showTooltip === stat.label ? null : stat.label)}
          className="items-center flex-1"
        >
          <View className="flex-row items-center gap-1">
            <Text className="text-[10px] text-gray-500 uppercase font-medium">{stat.label}</Text>
            <Info size={10} color="#6b7280" />
          </View>
          <Text className={`text-lg font-bold ${stat.color}`}>{stat.value}</Text>

          {/* Tooltip */}
          {showTooltip === stat.label && (
            <View className="absolute top-12 bg-gray-900 p-2 rounded-lg z-10 w-36">
              <Text className="text-xs text-gray-300 text-center">{stat.tooltip}</Text>
            </View>
          )}
        </Pressable>
      ))}
    </View>
  );
}
