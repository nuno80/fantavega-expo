// stores/leagueStore.ts
// Store per gestire la lega attualmente selezionata

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { League } from '../types/schemas';

interface LeagueState {
  // Lega attualmente selezionata (per context globale)
  currentLeagueId: string | null;
  currentLeague: League | null;

  // Lista leghe a cui l'utente partecipa (cache locale)
  userLeagues: League[];

  // Actions
  setCurrentLeague: (league: League | null) => void;
  setUserLeagues: (leagues: League[]) => void;
  clearLeagueContext: () => void;
}

export const useLeagueStore = create<LeagueState>()(
  persist(
    (set) => ({
      currentLeagueId: null,
      currentLeague: null,
      userLeagues: [],

      setCurrentLeague: (league) =>
        set({
          currentLeagueId: league?.id ?? null,
          currentLeague: league,
        }),

      setUserLeagues: (leagues) => set({ userLeagues: leagues }),

      clearLeagueContext: () =>
        set({
          currentLeagueId: null,
          currentLeague: null,
          userLeagues: [],
        }),
    }),
    {
      name: 'fantavega-league-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Solo persistiamo l'ID, non l'intero oggetto (si ricarica da Firebase)
      partialize: (state) => ({
        currentLeagueId: state.currentLeagueId,
      }),
    }
  )
);
