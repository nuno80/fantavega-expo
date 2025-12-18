// hooks/usePlayer.ts
// TanStack Query hooks for player data fetching
// Best practice: Server state with cache, refetch, and mutations

import {
  getAllPlayers,
  getPlayerById,
  getPlayersByRole,
  searchPlayers,
} from "@/services/player.service";
import type { PlayerRole } from "@/types";
import { useQuery } from "@tanstack/react-query";

// Query keys for cache management
export const playerKeys = {
  all: ["players"] as const,
  lists: () => [...playerKeys.all, "list"] as const,
  details: () => [...playerKeys.all, "detail"] as const,
  detail: (id: number) => [...playerKeys.details(), id] as const,
  search: (term: string, role?: PlayerRole) =>
    [...playerKeys.all, "search", { term, role }] as const,
  byRole: (role: PlayerRole) => [...playerKeys.all, "role", role] as const,
};

// Hook: Get all players (simple query for now)
export function usePlayers() {
  return useQuery({
    queryKey: playerKeys.lists(),
    queryFn: getAllPlayers,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Hook: Get single player by ID
export function usePlayer(id: number) {
  return useQuery({
    queryKey: playerKeys.detail(id),
    queryFn: () => getPlayerById(id),
    enabled: id > 0,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

// Hook: Search players
export function usePlayerSearch(searchTerm: string, roleFilter?: PlayerRole) {
  return useQuery({
    queryKey: playerKeys.search(searchTerm, roleFilter),
    queryFn: () => searchPlayers(searchTerm, roleFilter),
    enabled: searchTerm.length >= 2, // Only search with 2+ chars
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

// Hook: Get players by role
export function usePlayersByRole(role: PlayerRole) {
  return useQuery({
    queryKey: playerKeys.byRole(role),
    queryFn: () => getPlayersByRole(role),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}
