// components/auction/BidBottomSheet.tsx
// Modal per offerte - Versione compatibile con Fabric (New Architecture)
// Usa Modal nativo invece di @gorhom/bottom-sheet per evitare crash Fabric

import * as Haptics from "expo-haptics";
import { Bot, Check, X } from "lucide-react-native";
import { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface BidBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  playerName: string;
  currentBid: number;
  userBudget: number;
  onPlaceBid: (amount: number, maxAmount?: number) => Promise<void>;
  isLoading: boolean;
  existingAutoBid?: number | null;
}

export function BidBottomSheet({
  isOpen,
  onClose,
  playerName,
  currentBid,
  userBudget,
  onPlaceBid,
  isLoading,
  existingAutoBid,
}: BidBottomSheetProps) {
  const [customAmount, setCustomAmount] = useState<string>("");
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState<string>("");

  const quickBids = [1, 5, 10];

  const handleQuickBid = async (increment: number) => {
    const newAmount = currentBid + increment;
    if (newAmount > userBudget) {
      Alert.alert("Budget insufficiente", `Hai solo ${userBudget} crediti.`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const maxAmount = useAutoBid ? parseInt(maxBidAmount, 10) : undefined;
    if (useAutoBid && maxAmount) {
      if (maxAmount < newAmount) {
        Alert.alert("Errore", "Il massimo auto-bid deve essere >= alla tua offerta.");
        return;
      }
      if (maxAmount > userBudget) {
        Alert.alert("Budget insufficiente", `Il massimo non può superare ${userBudget}.`);
        return;
      }
    }

    await Haptics.selectionAsync();
    await onPlaceBid(newAmount, maxAmount);
  };

  const handleManualBid = async () => {
    const amount = parseInt(customAmount, 10);
    if (isNaN(amount) || amount <= currentBid) {
      Alert.alert("Errore", "L'offerta deve essere superiore a quella attuale.");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (amount > userBudget) {
      Alert.alert("Budget insufficiente", `Hai solo ${userBudget} crediti.`);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const maxAmount = useAutoBid ? parseInt(maxBidAmount, 10) : undefined;
    if (useAutoBid && maxAmount) {
      if (isNaN(maxAmount) || maxAmount < amount) {
        Alert.alert("Errore", "Il massimo auto-bid deve essere >= alla tua offerta.");
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      if (maxAmount > userBudget) {
        Alert.alert("Budget insufficiente", `Il massimo non può superare ${userBudget}.`);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onPlaceBid(amount, maxAmount);
    setCustomAmount("");
    setMaxBidAmount("");
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable onPress={onClose} className="flex-1 bg-black/60" />

        <View className="rounded-t-3xl bg-[#1e1e2e] p-6">
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View className="mb-4 flex-row items-center justify-between border-b border-gray-700 pb-4">
              <View>
                <Text className="text-sm text-gray-400">Fai un'offerta per</Text>
                <Text className="text-xl font-bold text-white">{playerName}</Text>
              </View>
              <View className="flex-row items-center">
                <View className="items-end mr-3">
                  <Text className="text-sm text-gray-400">Attuale</Text>
                  <Text className="text-xl font-bold text-green-400">
                    {currentBid} 💰
                  </Text>
                </View>
                <Pressable onPress={onClose} className="p-2 rounded-full bg-gray-800">
                  <X size={20} color="#9ca3af" />
                </Pressable>
              </View>
            </View>

            {/* Quick Bids */}
            <View className="mb-4 flex-row justify-between gap-2">
              {quickBids.map((inc) => {
                const canAfford = currentBid + inc <= userBudget;
                return (
                  <TouchableOpacity
                    key={inc}
                    onPress={() => handleQuickBid(inc)}
                    disabled={isLoading || !canAfford}
                    className={`flex-1 items-center justify-center rounded-xl py-3 ${canAfford ? "bg-indigo-600" : "bg-gray-700 opacity-50"}`}
                  >
                    <Text className="font-bold text-white">+{inc}</Text>
                    <Text className="text-xs text-gray-300">({currentBid + inc})</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Manual Input */}
            <View className="mb-4">
              <Text className="mb-2 text-sm text-gray-400">O inserisci importo</Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 rounded-xl bg-[#11111a] p-4 text-lg text-white"
                  placeholder={`Min: ${currentBid + 1}`}
                  placeholderTextColor="#6b7280"
                  keyboardType="number-pad"
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={handleManualBid}
                  disabled={isLoading || !customAmount}
                  className={`items-center justify-center rounded-xl px-6 ${customAmount && !isLoading ? "bg-green-600" : "bg-gray-700 opacity-50"}`}
                >
                  <Check size={24} color="white" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Auto-Bid Section */}
            <View className="mb-4 rounded-xl bg-indigo-900/30 p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center">
                  <Bot size={20} color="#818cf8" />
                  <Text className="ml-2 font-semibold text-indigo-300">
                    Auto-Bid (eBay-style)
                  </Text>
                </View>
                <Switch
                  value={useAutoBid}
                  onValueChange={setUseAutoBid}
                  trackColor={{ false: "#374151", true: "#4f46e5" }}
                  thumbColor={useAutoBid ? "#a5b4fc" : "#9ca3af"}
                />
              </View>

              {existingAutoBid && !useAutoBid && (
                <View className="mb-2 rounded-lg bg-green-900/30 p-2">
                  <Text className="text-xs text-green-400">
                    ✅ Hai già un auto-bid attivo: max {existingAutoBid} crediti
                  </Text>
                </View>
              )}

              {useAutoBid && (
                <>
                  <Text className="mb-2 text-xs text-gray-400">
                    Il sistema rilancerà automaticamente fino al tuo massimo
                  </Text>
                  <TextInput
                    className="rounded-xl bg-[#11111a] p-4 text-white border border-indigo-600"
                    placeholder="Massimo auto-bid..."
                    placeholderTextColor="#6b7280"
                    keyboardType="number-pad"
                    value={maxBidAmount}
                    onChangeText={setMaxBidAmount}
                    editable={!isLoading}
                  />
                  <Text className="mt-1 text-xs text-gray-500">
                    Pagherai solo 1 in più del secondo miglior offerente
                  </Text>
                </>
              )}
            </View>

            {/* Budget Info */}
            <View className="items-center pb-4">
              <Text className="text-sm text-gray-400">
                Budget disponibile:{" "}
                <Text className="font-bold text-indigo-400">{userBudget}</Text>
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
