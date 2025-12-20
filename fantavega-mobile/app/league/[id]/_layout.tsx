// app/league/[id]/_layout.tsx
// Layout per lega con TAB IN ALTO (evita conflitto con barra navigazione Android)
// Usa Slot + tab manuali invece di Tabs component

import { useLeague } from "@/hooks/useLeague";
import { Slot, useLocalSearchParams, usePathname, useRouter } from "expo-router";
import { Gavel, Settings, Users, UserSquare } from "lucide-react-native";
import { useEffect } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TABS = [
  { name: "auctions", label: "Aste", icon: Gavel },
  { name: "roster", label: "Rosa", icon: UserSquare },
  { name: "managers", label: "Manager", icon: Users },
] as const;

export default function LeagueTabLayout() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: league, isLoading } = useLeague(id ?? "");
  const router = useRouter();
  const pathname = usePathname();

  // Determina tab attivo dal pathname
  const activeTab = TABS.find((t) => pathname.includes(t.name))?.name ?? "auctions";

  // Redirect a auctions se siamo sulla route base (senza tab specifico)
  useEffect(() => {
    if (pathname === `/league/${id}` && !isLoading) {
      router.replace(`/league/${id}/auctions`);
    }
  }, [pathname, id, isLoading, router]);

  const handleTabPress = (tabName: string) => {
    router.replace(`/league/${id}/${tabName}`);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-dark-bg" edges={["top"]}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-[#0f0f1a]">
        <Pressable onPress={() => router.back()} className="p-2">
          <Text className="text-2xl text-white">←</Text>
        </Pressable>
        <Text className="text-lg font-bold text-white flex-1 text-center">
          {league?.name ?? "Lega"}
        </Text>
        <Pressable
          onPress={() => router.push(`/league/${id}/settings`)}
          className="p-2"
        >
          <Settings size={22} color="#9ca3af" />
        </Pressable>
      </View>

      {/* Tab Bar IN ALTO */}
      <View className="flex-row bg-[#1a1a2e] border-b border-gray-700">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.name;
          const Icon = tab.icon;
          return (
            <Pressable
              key={tab.name}
              onPress={() => handleTabPress(tab.name)}
              className="flex-1 items-center py-3"
            >
              <Icon size={20} color={isActive ? "#818cf8" : "#6b7280"} />
              <Text
                className={`mt-1 text-xs font-semibold ${isActive ? "text-indigo-400" : "text-gray-500"
                  }`}
              >
                {tab.label}
              </Text>
              {isActive && (
                <View className="absolute bottom-0 left-4 right-4 h-0.5 bg-indigo-500 rounded-full" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Contenuto Tab */}
      <View className="flex-1">
        <Slot />
      </View>
    </SafeAreaView>
  );
}
