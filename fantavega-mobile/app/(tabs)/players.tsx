// app/(tabs)/players.tsx
// Players screen with FlashList, TanStack Query, search, and auction initiation

import { CallPlayerModal } from "@/components/auction/CallPlayerModal";
import { PlayerCard } from "@/components/players/PlayerCard";
import { usePlayers, usePlayerSearch } from "@/hooks/usePlayer";
import { useLeagueStore } from "@/stores/leagueStore";
import type { Player } from "@/types/schemas";
import { FlashList } from "@shopify/flash-list";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";

export default function PlayersScreen() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { currentLeagueId, currentLeague } = useLeagueStore();
  const isSearching = searchTerm.length >= 2;

  // Use search query when searching, otherwise use all players
  const searchQuery = usePlayerSearch(searchTerm);
  const playersQuery = usePlayers();

  // Handle player press - open modal for auction
  const handlePlayerPress = (player: Player) => {
    if (!currentLeagueId) {
      // No league selected - could show alert
      console.log("No league selected");
      return;
    }

    // Check if league is in auction mode
    if (currentLeague?.status !== "draft_active" && currentLeague?.status !== "repair_active") {
      console.log("League not in auction mode");
      return;
    }

    setSelectedPlayer(player);
    setIsModalVisible(true);
  };

  // Loading state
  const isLoading = isSearching ? searchQuery.isLoading : playersQuery.isLoading;

  // Error state
  const error = isSearching ? searchQuery.error : playersQuery.error;

  // Players to display
  const players: Player[] = isSearching
    ? (searchQuery.data ?? [])
    : (playersQuery.data ?? []);

  // Check if can start auction
  const canStartAuction = currentLeague?.status === "draft_active" || currentLeague?.status === "repair_active";

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

        {/* League Context Banner */}
        {currentLeague && (
          <View className="mt-2 flex-row items-center justify-between rounded-lg bg-dark-card px-3 py-2">
            <Text className="text-sm text-gray-400">
              {currentLeague.name}
            </Text>
            <View className={`rounded-full px-2 py-0.5 ${canStartAuction ? "bg-green-600/20" : "bg-gray-600/20"}`}>
              <Text className={`text-xs ${canStartAuction ? "text-green-400" : "text-gray-400"}`}>
                {canStartAuction ? "🎯 Asta attiva" : "⏳ In attesa"}
              </Text>
            </View>
          </View>
        )}

        {!currentLeague && (
          <View className="mt-2 rounded-lg bg-amber-600/20 px-3 py-2">
            <Text className="text-center text-sm text-amber-400">
              Seleziona una lega dalla Home per chiamare giocatori all'asta
            </Text>
          </View>
        )}
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

      {/* Players List - FlashList for better performance */}
      {!isLoading && !error && players.length > 0 && (
        <FlashList
          data={players}
          renderItem={({ item }) => (
            <PlayerCard player={item} onPress={handlePlayerPress} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Call Player Modal */}
      <CallPlayerModal
        visible={isModalVisible}
        player={selectedPlayer}
        leagueId={currentLeagueId}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedPlayer(null);
        }}
      />
    </View>
  );
}
