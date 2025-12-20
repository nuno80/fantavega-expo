// components/auction/MyRosterTab.tsx
import { FlashList } from "@shopify/flash-list";
import { Anchor, Shield, Target, User } from "lucide-react-native";
import React from 'react';
import { Text, View } from 'react-native';

// Data structure for roster items
interface PlayerSlot {
  id: string;
  type: 'empty' | 'assigned' | 'auction';
  role: string;
  player?: {
    name: string;
    team: string;
    price: number;
  };
  auction?: {
    currentBid: number;
    timer: number;
  };
}

// Union type for FlashList items (headers + players)
type ListItem =
  | { itemType: 'header'; title: string; id: string }
  | { itemType: 'player'; data: PlayerSlot };

interface MyRosterTabProps {
  rosterData: PlayerSlot[];
  leagueSlots: any;
}

export function MyRosterTab({ rosterData, leagueSlots }: MyRosterTabProps) {

  // Helper to get icon by role (unused for now, kept for future use)
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'P': return <Shield size={16} color="#eab308" />;
      case 'D': return <Anchor size={16} color="#22c55e" />;
      case 'C': return <Target size={16} color="#3b82f6" />;
      case 'A': return <User size={16} color="#ef4444" />;
      default: return <User size={16} color="gray" />;
    }
  };

  // Flatten sections into a single list for FlashList
  const flatData: ListItem[] = [
    { itemType: 'header', title: 'Portieri', id: 'header-P' },
    ...rosterData.filter(p => p.role === 'P').map(p => ({ itemType: 'player' as const, data: p })),
    { itemType: 'header', title: 'Difensori', id: 'header-D' },
    ...rosterData.filter(p => p.role === 'D').map(p => ({ itemType: 'player' as const, data: p })),
    { itemType: 'header', title: 'Centrocampisti', id: 'header-C' },
    ...rosterData.filter(p => p.role === 'C').map(p => ({ itemType: 'player' as const, data: p })),
    { itemType: 'header', title: 'Attaccanti', id: 'header-A' },
    ...rosterData.filter(p => p.role === 'A').map(p => ({ itemType: 'player' as const, data: p })),
  ];

  const renderItem = ({ item }: { item: ListItem }) => {
    // Render section header
    if (item.itemType === 'header') {
      return (
        <Text className="text-gray-400 font-bold mt-4 mb-2 uppercase text-xs tracking-wider">
          {item.title}
        </Text>
      );
    }

    // Render player slot
    const slot = item.data;
    return (
      <View className="bg-dark-card mb-2 p-3 rounded-xl border border-gray-800 flex-row items-center justify-between">
        <View className="flex-row items-center gap-3">
          <View className="w-8 h-8 rounded-full bg-gray-800 items-center justify-center">
            <Text className="font-bold text-gray-500 text-xs">{slot.role}</Text>
          </View>
          <View>
            {slot.type === 'assigned' ? (
              <>
                <Text className="text-white font-bold">{slot.player?.name}</Text>
                <Text className="text-gray-500 text-xs">{slot.player?.team}</Text>
              </>
            ) : slot.type === 'auction' ? (
              <>
                <Text className="text-amber-400 font-bold">In Asta...</Text>
                <Text className="text-gray-500 text-xs">Offerta: {slot.auction?.currentBid}</Text>
              </>
            ) : (
              <Text className="text-gray-600 italic">Slot Vuoto</Text>
            )}
          </View>
        </View>

        <View>
          {slot.type === 'assigned' && (
            <Text className="text-white font-bold bg-gray-800 px-2 py-1 rounded text-xs">{slot.player?.price} 💰</Text>
          )}
          {slot.type === 'auction' && (
            <Text className="text-amber-400 font-bold text-xs">{slot.auction?.timer}s</Text>
          )}
        </View>
      </View>
    );
  };

  const getItemType = (item: ListItem) => item.itemType;

  return (
    <View className="flex-1 bg-dark-bg px-4">
      <FlashList
        data={flatData}
        renderItem={renderItem}
        keyExtractor={(item) => item.itemType === 'header' ? item.id : item.data.id}
        getItemType={getItemType}
        contentContainerStyle={{ paddingBottom: 24 }}
      />
    </View>
  );
}
