// components/auction/BiddingInterface.tsx
// Interfaccia per piazzare offerte (manual + quick)
// Best Practice: Haptic feedback, validazione client-side, stati loading

import {
  checkBudgetClientSide,
  MOCK_USER_ID,
  MOCK_USERNAME,
  placeBid,
  placeQuickBid,
} from "@/services/bid.service";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";

interface BiddingInterfaceProps {
  leagueId: string;
  auctionId: string;
  currentBid: number;
  currentBidderId: string | null | undefined; // nullish da Zod schema
  // Budget info (passato dal parent, in futuro da auth context)
  userBudget?: number;
  userLockedCredits?: number;
  onBidPlaced?: () => void;
}

export const BiddingInterface = ({
  leagueId,
  auctionId,
  currentBid,
  currentBidderId,
  userBudget = 500, // Mock default
  userLockedCredits = 0,
  onBidPlaced,
}: BiddingInterfaceProps) => {
  const [customAmount, setCustomAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Calcola se l'utente sta già vincendo
  const isCurrentWinner = currentBidderId === MOCK_USER_ID;
  const myCurrentBid = isCurrentWinner ? currentBid : 0;

  // Quick bid amounts
  const quickBids = [1, 5, 10] as const;

  // Budget check client-side
  const checkBudget = (proposedBid: number) => {
    return checkBudgetClientSide(
      userBudget,
      userLockedCredits,
      proposedBid,
      myCurrentBid
    );
  };

  // Handler per quick bid
  const handleQuickBid = async (increment: 1 | 5 | 10) => {
    const newAmount = currentBid + increment;
    const budgetCheck = checkBudget(newAmount);

    if (!budgetCheck.canBid) {
      Alert.alert("Budget insufficiente", budgetCheck.reason);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await placeQuickBid(
        leagueId,
        auctionId,
        MOCK_USER_ID,
        MOCK_USERNAME,
        currentBid,
        increment
      );

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onBidPlaced?.();
      } else {
        Alert.alert("Errore", result.message);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      Alert.alert("Errore", "Impossibile piazzare l'offerta");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler per bid manuale
  const handleManualBid = async () => {
    const amount = parseInt(customAmount, 10);

    if (isNaN(amount) || amount <= currentBid) {
      Alert.alert("Errore", `L'offerta deve essere maggiore di ${currentBid}`);
      return;
    }

    const budgetCheck = checkBudget(amount);
    if (!budgetCheck.canBid) {
      Alert.alert("Budget insufficiente", budgetCheck.reason);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsLoading(true);

    try {
      const result = await placeBid({
        leagueId,
        auctionId,
        userId: MOCK_USER_ID,
        username: MOCK_USERNAME,
        amount,
        bidType: "manual",
      });

      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCustomAmount("");
        onBidPlaced?.();
      } else {
        Alert.alert("Errore", result.message);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (error) {
      Alert.alert("Errore", "Impossibile piazzare l'offerta");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="bg-dark-card p-4 rounded-2xl">
      {/* Budget Display */}
      <View className="mb-4 flex-row justify-between">
        <Text className="text-gray-400">Budget disponibile</Text>
        <Text className="text-lg font-bold text-primary-400">
          {userBudget - userLockedCredits} 💰
        </Text>
      </View>

      {/* Current Winner Badge */}
      {isCurrentWinner && (
        <View className="mb-4 rounded-xl bg-green-900/50 p-3">
          <Text className="text-center text-green-400">
            ✅ Sei il miglior offerente con {currentBid} crediti
          </Text>
        </View>
      )}

      {/* Quick Bid Buttons */}
      <View className="mb-4">
        <Text className="mb-2 text-sm text-gray-400">Offerta rapida</Text>
        <View className="flex-row justify-between">
          {quickBids.map((increment) => {
            const newAmount = currentBid + increment;
            const canAfford = checkBudget(newAmount).canBid;

            return (
              <Pressable
                key={increment}
                onPress={() => handleQuickBid(increment)}
                disabled={isLoading || !canAfford}
                className={`flex-1 mx-1 rounded-xl py-3 ${canAfford
                  ? "bg-primary-600 active:bg-primary-700"
                  : "bg-gray-700 opacity-50"
                  }`}
              >
                <Text className="text-center text-white font-bold">
                  +{increment}
                </Text>
                <Text className="text-center text-xs text-gray-300">
                  ({newAmount})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Manual Bid Input */}
      <View>
        <Text className="mb-2 text-sm text-gray-400">Offerta personalizzata</Text>
        <View className="flex-row">
          <TextInput
            className="flex-1 mr-2 rounded-xl bg-dark-bg px-4 py-3 text-white"
            placeholder={`Min: ${currentBid + 1}`}
            placeholderTextColor="#6b7280"
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={setCustomAmount}
            editable={!isLoading}
          />
          <Pressable
            onPress={handleManualBid}
            disabled={isLoading || !customAmount}
            className={`rounded-xl px-6 py-3 ${customAmount && !isLoading
              ? "bg-green-600 active:bg-green-700"
              : "bg-gray-700 opacity-50"
              }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-bold text-white">Offri</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};
