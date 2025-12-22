// app/league/[id]/players.tsx
// Tab Giocatori: lista giocatori con possibilità di chiamare asta
// Versione specifica per lega con leagueId dal contesto

import { CallPlayerModal } from "@/components/auction/CallPlayerModal";
import { PlayerCard } from "@/components/players/PlayerCard";
import { useLeague } from "@/hooks/useLeague";
import { usePlayers, usePlayerSearch } from "@/hooks/usePlayer";
import type { Player } from "@/types/schemas";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Text, TextInput, View } from "react-native";

export default function LeaguePlayersTab() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const { data: league } = useLeague(leagueId ?? "");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const isSearching = searchTerm.length >= 2;

  // Use search query when searching, otherwise use all players
  const searchQuery = usePlayerSearch(searchTerm);
  const playersQuery = usePlayers();

  // Handle player press - open modal for auction
  const handlePlayerPress = (player: Player) => {
    if (!leagueId) return;

    // Check if league is in auction mode
    if (league?.status !== "draft_active" && league?.status !== "repair_active") {
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
  const canStartAuction = league?.status === "draft_active" || league?.status === "repair_active";

  return (
    <View className="flex-1 bg-dark-bg">
      {/* Search Input */}
      <View className="p-4">
        <TextInput
          className="h-12 rounded-xl border border-dark-border bg-dark-card px-4 text-base text-white"
          placeholder="Cerca giocatore..."
          placeholderTextColor="#6b7280"
          value={searchTerm}
          onChangeText={setSearchTerm}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Status Banner */}
        {!canStartAuction && (
          <View className="mt-2 rounded-lg bg-amber-600/20 px-3 py-2">
            <Text className="text-center text-sm text-amber-400">
              ⏳ L'asta non è attiva. Attiva lo stato Draft o Riparazione nelle impostazioni.
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
              : "Aggiungi giocatori al database"}
          </Text>
        </View>
      )}

      {/* Players List */}
      {!isLoading && !error && players.length > 0 && (
        <FlashList
          data={players}
          renderItem={({ item }) => (
            <PlayerCard player={item} onPress={canStartAuction ? handlePlayerPress : undefined} />
          )}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}

      {/* Call Player Modal */}
      <CallPlayerModal
        visible={isModalVisible}
        player={selectedPlayer}
        leagueId={leagueId}
        onClose={() => {
          setIsModalVisible(false);
          setSelectedPlayer(null);
        }}
      />
    </View>
  );
}
