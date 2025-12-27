// components/auction/BidBottomSheet.tsx
// Modal per offerte - Versione con flusso di conferma
// Usa pendingBid state + pulsante conferma esplicito

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
  const [pendingBid, setPendingBid] = useState<number>(currentBid + 1);
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [maxBidAmount, setMaxBidAmount] = useState<string>("");

  // Sync pendingBid if it becomes invalid
  if (isOpen && pendingBid <= currentBid) {
    setPendingBid(currentBid + 1);
  }

  const handleAdjustBid = (adjustment: number) => {
    const newVal = pendingBid + adjustment;
    if (newVal <= currentBid) {
      Alert.alert("Offerta non valida", "L'offerta deve essere superiore all'attuale.");
      return;
    }
    if (newVal > userBudget) {
      Alert.alert("Budget insufficiente", "Non hai abbastanza crediti.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setPendingBid(newVal);
    Haptics.selectionAsync();
  };

  const handleConfirmStandardBid = async () => {
    if (pendingBid <= currentBid) {
      Alert.alert("Errore", "L'offerta deve essere superiore a quella attuale.");
      return;
    }
    if (pendingBid > userBudget) {
      Alert.alert("Budget insufficiente", "Non hai abbastanza crediti.");
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onPlaceBid(pendingBid);
  };

  const handleConfirmAutoBid = async () => {
    const max = parseInt(maxBidAmount, 10);
    if (isNaN(max) || max < pendingBid) {
      Alert.alert("Errore Auto-Bid", "Il tetto massimo deve essere maggiore o uguale alla tua offerta iniziale.");
      return;
    }
    if (max > userBudget) {
      Alert.alert("Budget insufficiente", `Non puoi superare i tuoi ${userBudget} crediti.`);
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await onPlaceBid(pendingBid, max);
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

        <View className="rounded-t-3xl bg-[#1e1e2e] p-6 pb-10 shadow-2xl">
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View className="mb-6 flex-row items-center justify-between border-b border-gray-700 pb-4">
              <View>
                <Text className="text-gray-400 text-xs uppercase tracking-wider">Offerta per</Text>
                <Text className="text-2xl font-black text-white">{playerName}</Text>
              </View>
              <Pressable onPress={onClose} className="p-2 rounded-full bg-gray-800 active:bg-gray-700">
                <X size={24} color="#9ca3af" />
              </Pressable>
            </View>

            {/* Current Info Row */}
            <View className="flex-row justify-between mb-8 px-2">
              <View>
                <Text className="text-gray-500 text-xs uppercase font-bold">Attuale</Text>
                <Text className="text-2xl font-bold text-gray-300">{currentBid} <Text className="text-base text-gray-500">cr</Text></Text>
              </View>
              <View className="items-end">
                <Text className="text-gray-500 text-xs uppercase font-bold">Tuo Budget</Text>
                <Text className={`text-2xl font-bold ${userBudget < pendingBid ? "text-red-500" : "text-indigo-400"}`}>
                  {userBudget} <Text className="text-base text-gray-500">cr</Text>
                </Text>
              </View>
            </View>

            {/* MAIN BID CONTROLS */}
            <View className="items-center mb-8">
              {/* Big Number Selector */}
              <View className="flex-row items-center justify-center gap-6 mb-6 w-full">
                <TouchableOpacity
                  onPress={() => handleAdjustBid(-1)}
                  className="w-14 h-14 rounded-full bg-gray-800 items-center justify-center border border-gray-700 active:bg-gray-700"
                >
                  <Text className="text-3xl text-gray-400 font-bold">-</Text>
                </TouchableOpacity>

                <View className="items-center w-32">
                  <Text className="text-5xl font-black text-white tracking-tighter">{pendingBid}</Text>
                  <Text className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Crediti</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleAdjustBid(1)}
                  className="w-14 h-14 rounded-full bg-green-600 items-center justify-center shadow-lg active:bg-green-500"
                >
                  <Text className="text-3xl text-white font-bold">+</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Increments */}
              <View className="flex-row gap-3 w-full justify-center">
                {[5, 10, 20].map(val => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => handleAdjustBid(val)}
                    className="bg-gray-800 px-5 py-2 rounded-lg border border-gray-700 active:bg-gray-700"
                  >
                    <Text className="text-gray-300 font-bold">+{val}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* CONFIRM BUTTON (Standard) */}
            {!useAutoBid && (
              <TouchableOpacity
                onPress={handleConfirmStandardBid}
                disabled={isLoading || pendingBid > userBudget}
                className={`w-full py-4 rounded-xl items-center shadow-lg mb-6 flex-row justify-center gap-2 ${isLoading || pendingBid > userBudget
                  ? 'bg-gray-800 opacity-50'
                  : 'bg-green-600 active:bg-green-500'
                  }`}
              >
                {isLoading ? (
                  <Text className="text-white font-bold">Attendere...</Text>
                ) : (
                  <>
                    <Check size={24} color="white" strokeWidth={3} />
                    <Text className="text-white text-xl font-black uppercase tracking-wider">
                      CONFERMA {pendingBid}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* AUTO BID SECTION */}
            <View className={`border-t border-gray-800 pt-6 mt-2 ${useAutoBid ? 'opacity-100' : 'opacity-80'}`}>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center gap-2">
                  <View className="p-2 rounded-lg bg-indigo-900/40">
                    <Bot size={20} color="#818cf8" />
                  </View>
                  <View>
                    <Text className="text-white font-bold text-base">Auto-Bid Assistant</Text>
                    <Text className="text-gray-500 text-xs">Rilancia automaticamente per te</Text>
                  </View>
                </View>
                <Switch
                  value={useAutoBid}
                  onValueChange={(val) => {
                    setUseAutoBid(val);
                    Haptics.selectionAsync();
                  }}
                  trackColor={{ false: "#374151", true: "#4f46e5" }}
                  thumbColor={useAutoBid ? "#a5b4fc" : "#9ca3af"}
                />
              </View>

              {useAutoBid && (
                <View className="bg-indigo-900/20 rounded-xl p-4 border border-indigo-500/30">
                  <Text className="text-indigo-200 text-sm mb-3 font-medium">
                    Fino a quanto vuoi rilanciare?
                  </Text>

                  <View className="flex-row items-center gap-3 mb-4">
                    <TextInput
                      className="flex-1 bg-[#11111a] text-white text-xl font-bold p-4 rounded-xl border border-indigo-500/50"
                      placeholder={`Min: ${pendingBid}`}
                      placeholderTextColor="#6b7280"
                      keyboardType="number-pad"
                      value={maxBidAmount}
                      onChangeText={setMaxBidAmount}
                      autoFocus
                    />
                    <Text className="text-gray-400 font-bold">MAX</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleConfirmAutoBid}
                    className="bg-indigo-600 w-full py-4 rounded-xl items-center shadow-lg active:bg-indigo-500"
                  >
                    <Text className="text-white font-bold text-lg uppercase tracking-wide">
                      ATTIVA AUTO-BID
                    </Text>
                  </TouchableOpacity>
                  <Text className="text-center text-gray-500 text-[10px] mt-3">
                    Partirà con un'offerta di {pendingBid}, poi rilancerà +1 automaticamente.
                  </Text>
                </View>
              )}
            </View>

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
