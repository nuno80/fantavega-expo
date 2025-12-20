// components/auction/OtherManagersTab.tsx
import { FlashList } from "@shopify/flash-list";
import { ChevronRight, DollarSign, Users } from "lucide-react-native";
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ManagerSummary {
  id: string;
  name: string;
  teamName: string;
  budgetLeft: number;
  totalBudget: number;
  slotsFilled: number;
  totalSlots: number;
}

interface OtherManagersTabProps {
  managers: ManagerSummary[];
  onManagerPress: (managerId: string) => void;
}

export function OtherManagersTab({ managers, onManagerPress }: OtherManagersTabProps) {

  const renderItem = ({ item }: { item: ManagerSummary }) => (
    <TouchableOpacity
      onPress={() => onManagerPress(item.id)}
      className="bg-dark-card mb-3 p-4 rounded-xl border border-gray-800 flex-row items-center justify-between"
    >
      <View className="flex-1">
        <Text className="text-white font-bold text-lg mb-1">{item.teamName}</Text>
        <Text className="text-gray-400 text-xs">{item.name}</Text>
      </View>

      <View className="flex-row items-center gap-4">
        <View className="items-end">
          <View className="flex-row items-center gap-1">
            <DollarSign size={12} color="#818cf8" />
            <Text className="text-indigo-400 font-bold">{item.budgetLeft}</Text>
          </View>
          <View className="flex-row items-center gap-1 mt-1">
            <Users size={12} color="#9ca3af" />
            <Text className="text-gray-400 text-xs">{item.slotsFilled}/{item.totalSlots}</Text>
          </View>
        </View>
        <ChevronRight size={20} color="#4b5563" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-dark-bg px-4 py-4">
      <FlashList
        data={managers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text className="text-gray-500 text-center mt-10">Nessun altro manager trovato</Text>
        }
      />
    </View>
  );
}
