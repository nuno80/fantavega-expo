import { Tabs } from "expo-router";
import { useColorScheme } from "react-native";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#6b7280",
        tabBarStyle: {
          backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
          borderTopColor: isDark ? "#2d2d44" : "#e5e7eb",
        },
        headerStyle: {
          backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
        },
        headerTintColor: isDark ? "#ffffff" : "#1a1a2e",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarLabel: "Home",
        }}
      />
      <Tabs.Screen
        name="auctions"
        options={{
          title: "Aste",
          tabBarLabel: "Aste",
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Giocatori",
          tabBarLabel: "Giocatori",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profilo",
          tabBarLabel: "Profilo",
        }}
      />
    </Tabs>
  );
}
