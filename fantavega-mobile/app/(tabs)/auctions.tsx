import { Text, View } from "react-native";

// Empty state for now - will be replaced with real auction data
const mockAuctions: never[] = [];

export default function AuctionsScreen() {
  if (mockAuctions.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg p-6">
        <View className="w-full items-center rounded-2xl bg-dark-card p-8">
          <Text className="mb-4 text-5xl">🎯</Text>
          <Text className="mb-2 text-center text-xl font-semibold text-white">
            Nessuna Asta Attiva
          </Text>
          <Text className="text-center text-sm leading-5 text-gray-400">
            Le aste appariranno qui quando una lega sarà in fase attiva
          </Text>
        </View>
      </View>
    );
  }

  // When we have auctions, use FlashList
  return (
    <View className="flex-1 bg-dark-bg">
      {/* FlashList will be implemented when we have real data */}
      <Text className="p-4 text-white">Aste disponibili...</Text>
    </View>
  );
}
