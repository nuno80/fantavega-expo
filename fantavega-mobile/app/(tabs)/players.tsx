// app/(tabs)/players.tsx
// Players screen with FlatList, TanStack Query, and search

import { PlayerCard } from "@/components/players/PlayerCard";
import { usePlayers, usePlayerSearch } from "@/hooks/usePlayer";
import type { Player } from "@/types/schemas";
import { useState } from "react";
import { ActivityIndicator, FlatList, Text, TextInput, View } from "react-native";

export default function PlayersScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const isSearching = searchTerm.length >= 2;

  // Use search query when searching, otherwise use all players
  const searchQuery = usePlayerSearch(searchTerm);
  const playersQuery = usePlayers();

  // Handle player press
  const handlePlayerPress = (player: Player) => {
    // TODO: Navigate to player detail / auction
    console.log("Player pressed:", player.name);
  };

  // Loading state
  const isLoading = isSearching ? searchQuery.isLoading : playersQuery.isLoading;

  // Error state
  const error = isSearching ? searchQuery.error : playersQuery.error;

  // Players to display
  const players: Player[] = isSearching
    ? (searchQuery.data ?? [])
    : (playersQuery.data ?? []);

  return (
    <View className="flex-1 bg-dark-bg">
      {/* Search Input */}
      <View className="p-4">
        <TextInput
          className="h-12 rounded-xl border border-dark-border bg-dark-card px-4 text-base text-white"
          placeholder="Cerca giocatore... (min 2 caratteri)"
          placeholderTextColor="#6b7280"
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Loading State */}
      {isLoading && (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="mt-4 text-gray-400">Caricamento giocatori...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="mb-2 text-5xl">❌</Text>
          <Text className="text-center text-lg font-semibold text-white">
            Errore di caricamento
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-400">
            {error.message}
          </Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && !error && players.length === 0 && (
        <View className="flex-1 items-center justify-center p-8">
          <Text className="mb-4 text-5xl">⚽</Text>
          <Text className="text-center text-lg font-semibold text-white">
            {isSearching ? "Nessun risultato" : "Nessun giocatore"}
          </Text>
          <Text className="mt-2 text-center text-sm text-gray-400">
            {isSearching
              ? `Nessun giocatore trovato per "${searchTerm}"`
              : "Aggiungi giocatori al database per iniziare"}
          </Text>
        </View>
      )}

      {/* Players List - using FlatList (FlashList has TypeScript issues) */}
      {!isLoading && !error && players.length > 0 && (
        <FlatList
          data={players}
          renderItem={({ item }) => (
            <PlayerCard player={item} onPress={handlePlayerPress} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
}
