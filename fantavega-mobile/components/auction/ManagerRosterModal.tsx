// components/auction/ManagerRosterModal.tsx
// Modal per visualizzare la rosa di un altro manager
// Privacy: mostra solo DISP e SPESI, NO auto-bid
// Replica la logica di roster.tsx con slot vuoti e aste in corso

import { AuctionTimer } from "@/components/auction/AuctionTimer";
import { PlayerAvatar } from "@/components/PlayerAvatar";
import { getUserRoster, RosterPlayer } from "@/services/roster.service";
import { PlayerRole, ROLE_COLORS } from "@/types";
import { LiveAuction } from "@/types/schemas";
import { FlashList } from "@shopify/flash-list";
import { Clock, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";

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

interface ManagerRosterModalProps {
  visible: boolean;
  onClose: () => void;
  leagueId: string;
  managerId: string;
  managerName: string;
  /** Crediti disponibili (current_budget) */
  availableCredits: number;
  /** Budget totale iniziale */
  totalBudget: number;
  /** Config slots per ruolo */
  slotsConfig: { P: number; D: number; C: number; A: number };
  /** Aste attive dove il manager sta vincendo */
  winningAuctions: Array<{ id: string; auction: LiveAuction }>;
}

export function ManagerRosterModal({
  visible,
  onClose,
  leagueId,
  managerId,
  managerName,
  availableCredits,
  totalBudget,
  slotsConfig,
  winningAuctions,
}: ManagerRosterModalProps) {
  const [roster, setRoster] = useState<{
    players: RosterPlayer[];
    playersByRole: { P: RosterPlayer[]; D: RosterPlayer[]; C: RosterPlayer[]; A: RosterPlayer[] };
    totalSpent: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible && leagueId && managerId) {
      loadRoster();
    }
  }, [visible, leagueId, managerId]);

  const loadRoster = async () => {
    setIsLoading(true);
    try {
      const data = await getUserRoster(leagueId, managerId);
      setRoster({
        players: data.players,
        playersByRole: data.playersByRole,
        totalSpent: data.totalSpent,
      });
    } catch (error) {
      console.error("[ROSTER MODAL] Error loading roster:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calcola SPESI = totalBudget - availableCredits
  const spentCredits = totalBudget - availableCredits;

  // Genera gli slot della rosa basati sulla configurazione della lega
  const generateRosterSlots = (): RosterSlot[] => {
    if (!roster) return [];

    const slots: RosterSlot[] = [];
    const roles: PlayerRole[] = ["P", "D", "C", "A"];

    // Filtra le aste dove questo manager sta vincendo
    const managerWinningAuctions = winningAuctions.filter(
      (a) => a.auction.currentBidderId === managerId && a.auction.status === "active"
    );

    for (const role of roles) {
      const count = slotsConfig[role];
      const playersInRole = roster.playersByRole[role] || [];
      const auctionsInRole = managerWinningAuctions.filter(
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

  // Raggruppa per ruolo per visualizzazione con header
  const groupedData: ListItem[] = roster ? [
    { itemType: "header", title: "PORTIERI", role: "P" },
    ...rosterSlots.filter(s => s.role === "P").map(s => ({ itemType: "slot" as const, ...s })),
    { itemType: "header", title: "DIFENSORI", role: "D" },
    ...rosterSlots.filter(s => s.role === "D").map(s => ({ itemType: "slot" as const, ...s })),
    { itemType: "header", title: "CENTROCAMPISTI", role: "C" },
    ...rosterSlots.filter(s => s.role === "C").map(s => ({ itemType: "slot" as const, ...s })),
    { itemType: "header", title: "ATTACCANTI", role: "A" },
    ...rosterSlots.filter(s => s.role === "A").map(s => ({ itemType: "slot" as const, ...s })),
  ] : [];

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

    // Giocatore in asta (sta vincendo)
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
  const auctionCount = winningAuctions.filter(
    (a) => a.auction.currentBidderId === managerId && a.auction.status === "active"
  ).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-dark-bg">
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-gray-800">
          <View className="flex-1">
            <Text className="text-xl font-bold text-white">{managerName}</Text>
            <Text className="text-sm text-gray-400">Rosa</Text>
          </View>
          <Pressable
            onPress={onClose}
            className="p-2 rounded-full bg-gray-800"
          >
            <X size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Budget Stats - Solo DISP e SPESI (privacy - no auto-bid) */}
        <View className="flex-row mx-4 mt-4 rounded-xl bg-dark-card overflow-hidden">
          <View className="flex-1 items-center py-3 border-r border-gray-800">
            <Text className="text-[10px] text-gray-500 uppercase tracking-wider">
              DISPONIBILI
            </Text>
            <Text className="text-lg font-bold text-green-400">
              {availableCredits}
            </Text>
          </View>
          <View className="flex-1 items-center py-3">
            <Text className="text-[10px] text-gray-500 uppercase tracking-wider">
              SPESI
            </Text>
            <Text className="text-lg font-bold text-white">
              {spentCredits}
            </Text>
          </View>
        </View>

        {/* Riepilogo Rosa */}
        <View className="mx-4 mt-2 mb-2 flex-row justify-center gap-4">
          <Text className="text-gray-400 text-sm">
            {assignedCount} assegnati
          </Text>
          {auctionCount > 0 && (
            <Text className="text-amber-400 text-sm">
              {auctionCount} in asta
            </Text>
          )}
        </View>

        {/* Lista Giocatori */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <FlashList
            data={groupedData}
            keyExtractor={(item) =>
              item.itemType === "header" ? `header-${item.role}` : item.id
            }
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>
    </Modal>
  );
}
