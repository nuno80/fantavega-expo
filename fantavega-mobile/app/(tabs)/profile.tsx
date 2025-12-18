// app/(tabs)/profile.tsx
// Profile tab with Mock User Selector for testing

import { MockUserSelector } from "@/components/MockUserSelector";
import { useUserStore } from "@/stores/userStore";
import { ScrollView, Text, View } from "react-native";

export default function ProfileScreen() {
  const { currentUser } = useUserStore();

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      {/* User Info Card */}
      <View className="mx-4 mt-6 mb-4 items-center rounded-2xl bg-dark-card p-6">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-600">
          <Text className="text-4xl">👤</Text>
        </View>
        <Text className="mb-1 text-xl font-semibold text-white">
          {currentUser.username}
        </Text>
        <Text className="text-sm text-gray-400">{currentUser.email}</Text>
        <View className="mt-3 rounded-full bg-yellow-600/20 px-3 py-1">
          <Text className="text-xs text-yellow-400">🧪 Modalità Test</Text>
        </View>
      </View>

      {/* Mock User Selector */}
      <View className="mx-4 mb-6">
        <MockUserSelector />
      </View>

      {/* Info Box */}
      <View className="mx-4 mb-8 rounded-xl bg-blue-900/30 p-4">
        <Text className="text-blue-300 text-sm">
          ℹ️ Questa è la modalità di test. L'autenticazione reale con Firebase Auth
          verrà implementata in seguito. Seleziona un utente qui sopra per simulare
          diverse prospettive.
        </Text>
      </View>
    </ScrollView>
  );
}
