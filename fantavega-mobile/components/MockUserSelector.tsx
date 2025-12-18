// components/MockUserSelector.tsx
// Selettore utente mock per testing senza Firebase Auth
// Verrà rimosso in Fase 7 quando si implementa Auth reale

import { MOCK_USERS, useUserStore } from '@/stores/userStore';
import { Pressable, Text, View } from 'react-native';

export function MockUserSelector() {
  const { currentUserId, setCurrentUser } = useUserStore();

  return (
    <View className="bg-dark-card rounded-xl p-4">
      <Text className="text-white text-lg font-bold mb-3">
        👤 Utente di Test
      </Text>
      <Text className="text-gray-400 text-sm mb-4">
        Seleziona un utente per simulare diverse prospettive
      </Text>

      <View className="gap-2">
        {MOCK_USERS.map((user) => {
          const isSelected = currentUserId === user.id;
          return (
            <Pressable
              key={user.id}
              onPress={() => setCurrentUser(user.id)}
              className={`p-3 rounded-lg border ${isSelected
                  ? 'bg-primary/20 border-primary'
                  : 'bg-dark-bg border-gray-700'
                }`}
            >
              <Text className={`font-semibold ${isSelected ? 'text-primary' : 'text-white'
                }`}>
                {user.username}
              </Text>
              <Text className="text-gray-400 text-sm">
                {user.email}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
