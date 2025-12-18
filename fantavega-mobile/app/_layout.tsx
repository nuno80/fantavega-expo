import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Suspense } from "react";
import { ActivityIndicator, View, useColorScheme } from "react-native";
import "../global.css";

// TanStack Query client - persist across app lifecycle
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
    },
  },
});

function LoadingFallback() {
  return (
    <View className="flex-1 items-center justify-center bg-dark-bg">
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<LoadingFallback />}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
            },
            headerTintColor: isDark ? "#ffffff" : "#1a1a2e",
            headerTitleStyle: {
              fontWeight: "bold",
            },
            contentStyle: {
              backgroundColor: isDark ? "#0f0f1a" : "#f5f5f5",
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen
            name="auction/[id]"
            options={{
              title: "Asta",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="league/[id]"
            options={{
              title: "Lega",
            }}
          />
          <Stack.Screen
            name="league/create"
            options={{
              title: "Crea Lega",
              presentation: "modal",
            }}
          />
          <Stack.Screen
            name="league/[id]/settings"
            options={{
              title: "Impostazioni",
            }}
          />
          <Stack.Screen
            name="league/join"
            options={{
              title: "Unisciti",
              presentation: "modal",
            }}
          />
        </Stack>
      </Suspense>
    </QueryClientProvider>
  );
}
