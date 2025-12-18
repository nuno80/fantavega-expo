// stores/userStore.ts
// Mock User Store per testing senza Firebase Auth
// Verrà sostituito da AuthContext in Fase 7

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// Mock users per testing
export const MOCK_USERS = [
  {
    id: 'user_mock_1',
    username: 'Mario Rossi',
    email: 'mario@test.com',
    avatarUrl: null,
  },
  {
    id: 'user_mock_2',
    username: 'Luigi Verdi',
    email: 'luigi@test.com',
    avatarUrl: null,
  },
  {
    id: 'user_mock_3',
    username: 'Anna Bianchi',
    email: 'anna@test.com',
    avatarUrl: null,
  },
  {
    id: 'user_mock_admin',
    username: 'Admin Test',
    email: 'admin@test.com',
    avatarUrl: null,
  },
] as const;

export type MockUser = (typeof MOCK_USERS)[number];

interface UserState {
  currentUserId: string;
  currentUser: MockUser;
  setCurrentUser: (userId: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUserId: MOCK_USERS[0].id,
      currentUser: MOCK_USERS[0],
      setCurrentUser: (userId: string) => {
        const user = MOCK_USERS.find((u) => u.id === userId);
        if (user) {
          set({ currentUserId: userId, currentUser: user });
        }
      },
    }),
    {
      name: 'fantavega-user-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
