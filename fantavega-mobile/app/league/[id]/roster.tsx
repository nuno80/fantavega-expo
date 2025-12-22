// app/league/[id]/roster.tsx
// Tab Rosa: mostra la rosa dell'utente corrente nella lega
// Include giocatori assegnati + aste in corso dove stai vincendo

import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { useCurrentUser } from "@/contexts/AuthContext";
import { useComplianceCheck } from "@/hooks/useCompliance";
import { useLeague } from "@/hooks/useLeague";
import { useLeagueAuctions } from "@/hooks/useLeagueAuctions";
import { useUserRoster } from "@/hooks/useUserRoster";


import { RosterPlayer } from "@/services/roster.service";
import { PlayerRole, ROLE_COLORS } from "@/types";
import { LiveAuction } from "@/types/schemas";
import { FlashList } from "@shopify/flash-list";
import { useLocalSearchParams } from "expo-router";
import { Clock } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, RefreshControl, Text, View } from "react-native";

// Tipo per slot (giocatore assegnato, in asta, o vuoto)
interface RosterSlot {
  id: string;
  role: PlayerRole;
  slotType: "assigned" | "auction" | "empty";
  player?: RosterPlayer;
  auction?: { id: string; data: LiveAuction };
}

// Tipo per header sezione
interface RoleHeader {
  itemType: "header";
  title: string;
  role: PlayerRole;
}

// Tipo per slot nella lista
interface SlotItem extends RosterSlot {
  itemType: "slot";
}

type ListItem = RoleHeader | SlotItem;

export default function RosterTab() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const { currentUserId } = useCurrentUser();
  const { data: league, isLoading: isLeagueLoading } = useLeague(leagueId ?? "");
  const { roster, isLoading: isRosterLoading } = useUserRoster(leagueId, currentUserId);
  const { auctionsList } = useLeagueAuctions(leagueId ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🔴 TRIGGER COMPLIANCE CHECK all'accesso della pagina rosa
  useComplianceCheck(leagueId ?? null, currentUserId, league?.status);

  const isLoading = isLeagueLoading || isRosterLoading;


  // Filtra le aste dove l'utente corrente è il miglior offerente
  const myWinningAuctions = auctionsList.filter(
    (a) => a.auction.currentBidderId === currentUserId && a.auction.status === "active"
  );

  // Genera gli slot della rosa basati sulla configurazione della lega
  const generateRosterSlots = (): RosterSlot[] => {
    if (!league) return [];

    const slots: RosterSlot[] = [];
    const roleConfig: Record<PlayerRole, number> = {
      P: league.slotsP ?? 3,
      D: league.slotsD ?? 8,
      C: league.slotsC ?? 8,
      A: league.slotsA ?? 6,
    };

    const roles: PlayerRole[] = ["P", "D", "C", "A"];

    // Per ogni ruolo, crea gli slot
    for (const role of roles) {
      const count = roleConfig[role];
      const playersInRole = roster?.playersByRole[role] || [];

      // Aste dove sto vincendo per questo ruolo
      const auctionsInRole = myWinningAuctions.filter(
        (a) => a.auction.playerRole === role
      );

      let playerIndex = 0;
      let auctionIndex = 0;

      for (let i = 0; i < count; i++) {
        // Prima mostra i giocatori assegnati
        if (playerIndex < playersInRole.length) {
          slots.push({
            id: `${role}-${i}`,
            role,
            slotType: "assigned",
            player: playersInRole[playerIndex],
          });
          playerIndex++;
        }
        // Poi mostra le aste in corso
        else if (auctionIndex < auctionsInRole.length) {
          const auctionItem = auctionsInRole[auctionIndex];
          slots.push({
            id: `${role}-${i}`,
            role,
            slotType: "auction",
            auction: { id: auctionItem.id, data: auctionItem.auction },
          });
          auctionIndex++;
        }
        // Infine slot vuoti
        else {
          slots.push({
            id: `${role}-${i}`,
            role,
            slotType: "empty",
          });
        }
      }
    }

    return slots;
  };

  const rosterSlots = generateRosterSlots();

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-dark-bg">
        <ActivityIndicator size="large" color="#4f46e5" />
        <Text className="mt-4 text-gray-400">Caricamento rosa...</Text>
      </View>
    );
  }

  // Raggruppa per ruolo per visualizzazione con header
  const groupedData: ListItem[] = [
    { itemType: "header", title: "PORTIERI", role: "P" },
    ...rosterSlots.filter(s => s.role === "P").map(s => ({ itemType: "slot" as const, ...s })),
    { itemType: "header", title: "DIFENSORI", role: "D" },
    ...rosterSlots.filter(s => s.role === "D").map(s => ({ itemType: "slot" as const, ...s })),
    { itemType: "header", title: "CENTROCAMPISTI", role: "C" },
    ...rosterSlots.filter(s => s.role === "C").map(s => ({ itemType: "slot" as const, ...s })),
    { itemType: "header", title: "ATTACCANTI", role: "A" },
    ...rosterSlots.filter(s => s.role === "A").map(s => ({ itemType: "slot" as const, ...s })),
  ];

  const renderItem = ({ item }: { item: ListItem }) => {
    if (item.itemType === "header") {
      return (
        <View className="bg-dark-bg px-4 py-2 mt-4">
          <Text className="text-sm font-bold text-gray-400 tracking-wider">
            {item.title}
          </Text>
        </View>
      );
    }

    const slot = item;
    const roleColor = ROLE_COLORS[slot.role];

    // Giocatore assegnato
    if (slot.slotType === "assigned" && slot.player) {
      return (
        <View className="mx-4 mb-2 flex-row items-center rounded-xl bg-dark-card p-3">
          <View className="mr-3">
            <PlayerAvatar
              playerName={slot.player.playerName}
              playerTeam={slot.player.playerTeam}
              role={slot.role}
              size="small"
              photoUrl={slot.player.playerPhotoUrl}
            />
          </View>
          <View className="flex-1">
            <Text className="font-semibold text-white">{slot.player.playerName}</Text>
            <Text className="text-xs text-gray-400">{slot.player.playerTeam}</Text>
          </View>
          <View className="items-end">
            <Text className="font-bold text-primary-400">{slot.player.purchasePrice}</Text>
            <Text className="text-xs text-gray-500">💰</Text>
          </View>
        </View>
      );
    }

    // Giocatore in asta (stai vincendo)
    if (slot.slotType === "auction" && slot.auction) {
      return (
        <View className="mx-4 mb-2 flex-row items-center rounded-xl bg-amber-900/30 border border-amber-700/50 p-3">
          <View className="mr-3">
            <PlayerAvatar
              playerName={slot.auction.data.playerName}
              playerTeam={slot.auction.data.playerTeam}
              role={slot.role}
              size="small"
              photoUrl={slot.auction.data.playerPhotoUrl}
            />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-1">
              <Clock size={12} color="#fbbf24" />
              <Text className="font-semibold text-amber-300">{slot.auction.data.playerName}</Text>
            </View>
            <Text className="text-xs text-amber-400/70">{slot.auction.data.playerTeam}</Text>
          </View>
          <View className="items-end">
            <Text className="font-bold text-amber-400">{slot.auction.data.currentBid}</Text>
            <AuctionTimer scheduledEndTime={slot.auction.data.scheduledEndTime} size="small" />
          </View>
        </View>
      );
    }

    // Slot vuoto
    return (
      <View className="mx-4 mb-2 flex-row items-center rounded-xl border border-dashed border-gray-700 bg-dark-bg p-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-full mr-3 opacity-50"
          style={{ backgroundColor: roleColor }}
        >
          <Text className="font-bold text-white">{slot.role}</Text>
        </View>
        <Text className="text-gray-500 italic">Slot Vuoto</Text>
      </View>
    );
  };

  // Conteggi per il riepilogo
  const assignedCount = roster?.players.length ?? 0;
  const auctionCount = myWinningAuctions.length;

  return (
    <View className="flex-1 bg-dark-bg">
      {/* Riepilogo Budget */}
      <View className="mx-4 mt-4 mb-2 flex-row justify-between rounded-xl bg-dark-card p-4">
        <View className="items-center flex-1">
          <Text className="text-2xl font-bold text-primary-400">
            {assignedCount}
          </Text>
          <Text className="text-xs text-gray-400">Assegnati</Text>
        </View>
        {auctionCount > 0 && (
          <>
            <View className="w-px bg-gray-700" />
            <View className="items-center flex-1">
              <Text className="text-2xl font-bold text-amber-400">
                {auctionCount}
              </Text>
              <Text className="text-xs text-amber-400/70">In Asta</Text>
            </View>
          </>
        )}
        <View className="w-px bg-gray-700" />
        <View className="items-center flex-1">
          <Text className="text-2xl font-bold text-white">
            {roster?.totalSpent ?? 0}
          </Text>
          <Text className="text-xs text-gray-400">Spesi</Text>
        </View>
      </View>

      {/* Lista Rosa */}
      <FlashList
        data={groupedData}
        keyExtractor={(item) =>
          item.itemType === "header" ? `header-${item.role}` : item.id
        }
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#818cf8"
          />
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}
