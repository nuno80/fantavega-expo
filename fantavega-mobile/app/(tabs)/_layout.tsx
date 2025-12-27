import { Tabs } from "expo-router";
import { Gavel, Home, User, Users } from "lucide-react-native";
import { Platform, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: isDark ? "#9ca3af" : "#6b7280",
        tabBarStyle: {
          backgroundColor: isDark ? "#1a1a2e" : "#ffffff",
          borderTopColor: isDark ? "#2d2d44" : "#e5e7eb",
          // Fix Safe Area Overlap:
          height: 60 + (Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10),
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : insets.bottom + 10,
          paddingTop: 8,
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
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="auctions"
        options={{
          title: "Aste",
          tabBarLabel: "Aste",
          tabBarIcon: ({ color, size }) => <Gavel color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: "Giocatori",
          tabBarLabel: "Giocatori",
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profilo",
          tabBarLabel: "Profilo",
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
