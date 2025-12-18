// hooks/useLeague.ts
// TanStack Query hooks for league data

import {
  createLeague,
  getAllLeagues,
  getLeagueById,
  getLeagueParticipants,
  getUserLeagues,
  updateLeagueStatus,
} from "@/services/league.service";
import type { League } from "@/types/schemas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// Query keys
export const leagueKeys = {
  all: ["leagues"] as const,
  lists: () => [...leagueKeys.all, "list"] as const,
  userLeagues: (userId: string) => [...leagueKeys.all, "user", userId] as const,
  detail: (id: string) => [...leagueKeys.all, "detail", id] as const,
  participants: (id: string) => [...leagueKeys.all, "participants", id] as const,
};

// Hook: Get all leagues
export function useLeagues() {
  return useQuery({
    queryKey: leagueKeys.lists(),
    queryFn: getAllLeagues,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook: Get user's leagues
export function useUserLeagues(userId: string) {
  return useQuery({
    queryKey: leagueKeys.userLeagues(userId),
    queryFn: () => getUserLeagues(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook: Get single league
export function useLeague(leagueId: string) {
  return useQuery({
    queryKey: leagueKeys.detail(leagueId),
    queryFn: () => getLeagueById(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook: Get league participants
export function useLeagueParticipants(leagueId: string) {
  return useQuery({
    queryKey: leagueKeys.participants(leagueId),
    queryFn: () => getLeagueParticipants(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 2,
  });
}

// Hook: Create league mutation
export function useCreateLeague() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createLeague,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
    },
  });
}

// Hook: Update league status mutation
export function useUpdateLeagueStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ leagueId, status }: { leagueId: string; status: League["status"] }) =>
      updateLeagueStatus(leagueId, status),
    onSuccess: (_, { leagueId }) => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.detail(leagueId) });
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() });
    },
  });
}
