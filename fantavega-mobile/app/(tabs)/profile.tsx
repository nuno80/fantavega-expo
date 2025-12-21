// app/(tabs)/profile.tsx
// Profile tab with Auth info and DEV mode controls

import { DEV_MOCK_USERS, DevMockUser, useAuth } from "@/contexts/AuthContext";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

export default function ProfileScreen() {
  const {
    user,
    isDevMode,
    setDevMockUser,
    toggleDevMode,
    signOut,
    isAuthenticated,
  } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    if (!isDevMode) {
      router.replace("/login");
    }
  };

  const handleDevMockUser = (mockUser: DevMockUser) => {
    setDevMockUser(mockUser);
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      {/* User Info Card */}
      <View className="mx-4 mt-6 mb-4 items-center rounded-2xl bg-dark-card p-6">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-600">
          <Text className="text-4xl">👤</Text>
        </View>
        <Text className="mb-1 text-xl font-semibold text-white">
          {user?.displayName ?? "Utente"}
        </Text>
        <Text className="text-sm text-gray-400">{user?.email ?? ""}</Text>

        {/* Mode Badge */}
        {isDevMode ? (
          <View className="mt-3 rounded-full bg-yellow-600/20 px-3 py-1">
            <Text className="text-xs text-yellow-400">🧪 DEV MODE</Text>
          </View>
        ) : (
          <View className="mt-3 rounded-full bg-green-600/20 px-3 py-1">
            <Text className="text-xs text-green-400">
              ✅ {isAuthenticated ? "Autenticato" : "Non autenticato"}
            </Text>
          </View>
        )}
      </View>

      {/* DEV Mode User Selector */}
      {isDevMode && (
        <View className="mx-4 mb-4 rounded-xl bg-dark-card p-4">
          <Text className="text-white text-lg font-bold mb-3">
            👤 Utente di Test
          </Text>
          <Text className="text-gray-400 text-sm mb-4">
            Seleziona un utente per simulare diverse prospettive
          </Text>

          <View className="gap-2">
            {DEV_MOCK_USERS.map((mockUser) => {
              const isSelected = user?.uid === mockUser.uid;
              return (
                <Pressable
                  key={mockUser.uid}
                  onPress={() => handleDevMockUser(mockUser)}
                  className={`p-3 rounded-lg border ${isSelected
                      ? "bg-primary/20 border-primary"
                      : "bg-dark-bg border-gray-700"
                    }`}
                >
                  <Text
                    className={`font-semibold ${isSelected ? "text-primary" : "text-white"
                      }`}
                  >
                    {mockUser.displayName}
                  </Text>
                  <Text className="text-gray-400 text-sm">{mockUser.email}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* Actions */}
      <View className="mx-4 mb-6 gap-3">
        {/* Sign Out */}
        <Pressable
          onPress={handleSignOut}
          className="rounded-xl bg-red-600/20 border border-red-600 p-4"
        >
          <Text className="text-center text-red-400 font-semibold">
            🚪 Esci
          </Text>
        </Pressable>

        {/* Toggle Dev Mode (only in __DEV__) */}
        {__DEV__ && (
          <Pressable
            onPress={toggleDevMode}
            className="rounded-xl bg-gray-700/50 border border-gray-600 p-4"
          >
            <Text className="text-center text-gray-400 font-semibold">
              {isDevMode ? "🔓 Passa ad Auth Reale" : "🔧 Attiva DEV MODE"}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Info Box */}
      <View className="mx-4 mb-8 rounded-xl bg-blue-900/30 p-4">
        <Text className="text-blue-300 text-sm">
          {isDevMode
            ? "ℹ️ DEV MODE attivo. Puoi selezionare diversi utenti di test per simulare diverse prospettive."
            : "ℹ️ Sei autenticato con Firebase Auth. I tuoi dati sono sincronizzati."}
        </Text>
      </View>
    </ScrollView>
  );
}
