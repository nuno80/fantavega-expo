import { Pressable, Text, View } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-dark-bg p-6">
      <View className="mb-6 w-full items-center rounded-2xl bg-dark-card p-8">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-600">
          <Text className="text-4xl">👤</Text>
        </View>
        <Text className="mb-1 text-xl font-semibold text-white">
          Non autenticato
        </Text>
        <Text className="text-sm text-gray-400">Accedi per iniziare</Text>
      </View>

      <Pressable className="mb-3 w-full items-center rounded-xl bg-primary-600 py-4 active:opacity-80">
        <Text className="text-base font-semibold text-white">Accedi</Text>
      </Pressable>

      <Pressable className="w-full items-center rounded-xl border-2 border-primary-600 py-4 active:opacity-80">
        <Text className="text-base font-semibold text-primary-500">
          Registrati
        </Text>
      </Pressable>
    </View>
  );
}
