// components/auction/AuctionTimer.tsx
// Componente timer con countdown e stati visivi
// Best Practice: Animazioni per urgenza, colori accessibili

import { useAuctionTimer } from "@/hooks/useAuctionTimer";
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";

interface AuctionTimerProps {
  scheduledEndTime: number;
  size?: "small" | "medium" | "large";
}

export const AuctionTimer = ({
  scheduledEndTime,
  size = "medium",
}: AuctionTimerProps) => {
  const { formattedTime, isExpired, isUrgent, isCritical } =
    useAuctionTimer(scheduledEndTime);

  // Animazione pulsante per stato critico
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isCritical) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isCritical, pulseAnim]);

  // Stili basati su size
  const sizeStyles = {
    small: { container: "px-2 py-1 rounded-lg", text: "text-sm font-medium" },
    medium: { container: "px-3 py-2 rounded-xl", text: "text-lg font-bold" },
    large: { container: "px-4 py-3 rounded-2xl", text: "text-2xl font-bold" },
  };

  // Colori basati su stato
  const getBackgroundColor = () => {
    if (isExpired) return "bg-gray-600";
    if (isCritical) return "bg-red-600";
    if (isUrgent) return "bg-yellow-600";
    return "bg-green-600";
  };

  const getTextColor = () => {
    if (isExpired) return "text-gray-300";
    return "text-white";
  };

  return (
    <Animated.View
      style={{ transform: [{ scale: pulseAnim }] }}
      className={`${sizeStyles[size].container} ${getBackgroundColor()}`}
    >
      <View className="flex-row items-center">
        <Text className="mr-1">⏱️</Text>
        <Text className={`${sizeStyles[size].text} ${getTextColor()}`}>
          {isExpired ? "Scaduta" : formattedTime}
        </Text>
      </View>
    </Animated.View>
  );
};
