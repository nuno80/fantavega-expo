// components/auction/AuctionLiveTab.tsx
import { AlertCircle, CheckCircle } from "lucide-react-native";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { AuctionCard } from "./AuctionCard";
// import * as Haptics from "expo-haptics"; // Uncomment when needed

interface AuctionLiveTabProps {
  auction: any; // Type to be defined properly
  userBudget: number;
  onOpenBidSheet: () => void;
  isHighestBidder: boolean;
  onPlaceQuickBid: (amount: number) => Promise<void>;
}

export function AuctionLiveTab({
  auction,
  userBudget,
  onOpenBidSheet,
  isHighestBidder,
}: AuctionLiveTabProps) {
  if (!auction) {
    return (
      <View className="flex-1 items-center justify-center p-8 bg-dark-bg">
        <Text className="text-xl font-bold text-white mb-2">Nessuna asta attiva</Text>
        <Text className="text-gray-400 text-center">
          In attesa che un manager chiami un giocatore...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-bg px-4 py-6" showsVerticalScrollIndicator={false}>
      {/* Active Auction Card */}
      <View className="mb-8">
        <AuctionCard
          auctionId={auction.id}
          auction={auction}
          onPress={() => { }} // No navigation needed here
        />
      </View>

      {/* Action Area */}
      <View className="bg-dark-card rounded-2xl p-6 shadow-lg border border-gray-800">

        {isHighestBidder ? (
          <View className="items-center mb-6">
            <View className="bg-green-900/50 rounded-full px-6 py-3 flex-row items-center gap-2 mb-2">
              <CheckCircle size={20} color="#4ade80" />
              <Text className="text-green-400 font-bold text-lg">Stai vincendo!</Text>
            </View>
            <Text className="text-gray-400 text-sm">
              Attendi la scadenza del timer
            </Text>
          </View>
        ) : (
          <View className="items-center mb-6">
            <View className="bg-amber-900/30 rounded-full px-6 py-2 flex-row items-center gap-2 mb-2">
              <AlertCircle size={16} color="#fbbf24" />
              <Text className="text-amber-400 font-medium">È il momento di rilanciare</Text>
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={onOpenBidSheet}
          className={`w-full py-4 rounded-xl items-center justify-center ${isHighestBidder ? "bg-gray-700 opacity-50" : "bg-indigo-600"
            }`}
          disabled={isHighestBidder}
        >
          <Text className="text-white font-bold text-lg">
            {isHighestBidder ? "Offerta Attuale Leader" : "Fai un'offerta"}
          </Text>
        </TouchableOpacity>

        {/* Budget Info */}
        <View className="flex-row justify-between items-center mt-6 pt-6 border-t border-gray-700">
          <View>
            <Text className="text-gray-400 text-xs uppercase tracking-wider">Tuo Budget</Text>
            <Text className="text-white font-bold text-xl">{userBudget}</Text>
          </View>
          <View className="items-end">
            <Text className="text-gray-400 text-xs uppercase tracking-wider">Max Rilancio</Text>
            <Text className="text-white font-bold text-xl">{userBudget - (auction.current_highest_bid_amount || 0)}</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}
