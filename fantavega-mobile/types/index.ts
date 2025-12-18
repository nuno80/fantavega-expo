// types/index.ts
// Re-export all types and schemas

export * from "./schemas";

// Utility types
export type PlayerRole = "P" | "D" | "C" | "A";

export type LeagueStatus =
  | "participants_joining"
  | "draft_active"
  | "repair_active"
  | "market_closed"
  | "completed";

export type AuctionStatus =
  | "active"
  | "closing"
  | "sold"
  | "not_sold"
  | "cancelled";

export type BidType = "manual" | "auto" | "quick";

export type UserRole = "admin" | "manager";

// Role color mapping
export const ROLE_COLORS: Record<PlayerRole, string> = {
  P: "#fbbf24", // Yellow
  D: "#22c55e", // Green
  C: "#3b82f6", // Blue
  A: "#ef4444", // Red
};

// Role labels
export const ROLE_LABELS: Record<PlayerRole, string> = {
  P: "Portiere",
  D: "Difensore",
  C: "Centrocampista",
  A: "Attaccante",
};
