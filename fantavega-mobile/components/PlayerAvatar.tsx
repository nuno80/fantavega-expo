// components/PlayerAvatar.tsx
// Reusable component for player photos with role-based fallback
// Uses Firebase Storage for photos with fallback to role badge

import PLAYER_IMAGE_MAP from "@/lib/playerImageMap.json";
import { PlayerRole, ROLE_COLORS } from "@/types";
import { Image } from "expo-image";
import { useState } from "react";
import { Text, View } from "react-native";

// ============================================
// CONFIGURATION
// ============================================

// Vercel webapp base URL for player photos
const PHOTO_BASE_URL = "https://fantavega.vercel.app/seria_A";

// Build URL for a photo on Vercel
function getPhotoUrl(teamSlug: string, filename: string): string {
  return `${PHOTO_BASE_URL}/${teamSlug}/${filename}`;
}

// Slugify helper - same logic as webapp
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ============================================
// TYPES
// ============================================

type AvatarSize = "small" | "medium" | "large" | "xlarge";

interface PlayerAvatarProps {
  /** Player name for lookup in image map */
  playerName: string;
  /** Player team for lookup */
  playerTeam: string;
  /** Player role for fallback badge */
  role: PlayerRole;
  /** Avatar size */
  size?: AvatarSize;
  /** Optional direct photo URL override */
  photoUrl?: string | null;
}

// Size configuration
const SIZE_CONFIG: Record<AvatarSize, { container: number; fontSize: number }> = {
  small: { container: 40, fontSize: 14 },
  medium: { container: 56, fontSize: 18 },
  large: { container: 90, fontSize: 24 },
  xlarge: { container: 140, fontSize: 32 },
};

// ============================================
// COMPONENT
// ============================================

export function PlayerAvatar({
  playerName,
  playerTeam,
  role,
  size = "medium",
  photoUrl,
}: PlayerAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const config = SIZE_CONFIG[size];
  const roleColor = ROLE_COLORS[role];

  // Try to get photo URL
  let imageUrl: string | null = null;

  if (photoUrl) {
    // Direct URL provided
    imageUrl = photoUrl;
  } else if (!hasError) {
    // Lookup in map
    const teamSlug = slugify(playerTeam);
    const playerSlug = slugify(playerName);
    const key = `${teamSlug}/${playerSlug}` as keyof typeof PLAYER_IMAGE_MAP;
    const filename = PLAYER_IMAGE_MAP[key];

    if (filename) {
      imageUrl = getPhotoUrl(teamSlug, filename);
    }
  }

  // Render role badge fallback
  if (!imageUrl || hasError) {
    return (
      <View
        className="items-center justify-center rounded-full"
        style={{
          width: config.container,
          height: config.container,
          backgroundColor: roleColor,
        }}
      >
        <Text
          className="font-bold text-white"
          style={{ fontSize: config.fontSize }}
        >
          {role}
        </Text>
      </View>
    );
  }

  // Render image with fallback on error
  return (
    <View
      className="overflow-hidden rounded-full"
      style={{
        width: config.container,
        height: config.container,
        backgroundColor: roleColor,
      }}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: config.container, height: config.container }}
        contentFit="cover"
        transition={200}
        onError={() => setHasError(true)}
        placeholder={{ blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4" }}
      />
    </View>
  );
}
