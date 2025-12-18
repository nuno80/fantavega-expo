// types/schemas.ts
// Zod schemas for validating ALL external data (Firebase, API)
// Best Practice: "Se non passa Zod, non esiste"

import { z } from "zod";

// User schema
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().nullable(),
  fullName: z.string().nullable(),
  avatarUrl: z.string().url().nullable(),
  role: z.enum(["admin", "manager"]),
  status: z.enum(["pending_approval", "active", "suspended"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type User = z.infer<typeof UserSchema>;

// Player schema
export const PlayerSchema = z.object({
  id: z.number(),
  role: z.enum(["P", "D", "C", "A"]),
  roleMantra: z.string().nullable(),
  name: z.string(),
  team: z.string(),
  currentQuotation: z.number(),
  initialQuotation: z.number(),
  fvm: z.number().nullable(),
  photoUrl: z.string().nullable(),
  isStarter: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  integrityValue: z.number().default(0),
  hasFmv: z.boolean().default(false),
});
export type Player = z.infer<typeof PlayerSchema>;

// League schema
export const LeagueSchema = z.object({
  id: z.string(),
  name: z.string(),
  leagueType: z.enum(["classic", "mantra"]),
  initialBudgetPerManager: z.number().min(1),
  status: z.enum([
    "participants_joining",
    "draft_active",
    "repair_active",
    "market_closed",
    "completed",
  ]),
  activeAuctionRoles: z.string().nullable(),
  slotsP: z.number().min(0),
  slotsD: z.number().min(0),
  slotsC: z.number().min(0),
  slotsA: z.number().min(0),
  minBid: z.number().min(1).default(1),
  timerDurationMinutes: z.number().min(1).default(1440),
  adminCreatorId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type League = z.infer<typeof LeagueSchema>;

// League Participant schema
export const LeagueParticipantSchema = z.object({
  userId: z.string(),
  currentBudget: z.number(),
  lockedCredits: z.number().default(0),
  managerTeamName: z.string().nullable(),
  playersP: z.number().default(0),
  playersD: z.number().default(0),
  playersC: z.number().default(0),
  playersA: z.number().default(0),
  joinedAt: z.date(),
});
export type LeagueParticipant = z.infer<typeof LeagueParticipantSchema>;

// Live Auction schema (Realtime DB)
// Nota: usiamo .nullish() per accettare sia null che undefined (campo mancante)
export const LiveAuctionSchema = z.object({
  playerId: z.number(),
  playerName: z.string(),
  playerRole: z.enum(["P", "D", "C", "A"]),
  playerTeam: z.string(),
  playerPhotoUrl: z.string().nullish(), // può essere null, undefined, o stringa
  startTime: z.number(),
  scheduledEndTime: z.number(),
  currentBid: z.number(),
  currentBidderId: z.string().nullish(), // può essere null se nessuna offerta
  currentBidderName: z.string().nullish(),
  status: z.enum(["active", "closing", "sold", "not_sold", "cancelled"]),
  userStates: z.record(z.string(), z.enum(["active", "abandoned"])).optional(),
});
export type LiveAuction = z.infer<typeof LiveAuctionSchema>;

// Bid schema (Realtime DB)
export const BidSchema = z.object({
  userId: z.string(),
  username: z.string(),
  amount: z.number().min(1),
  bidTime: z.number(),
  bidType: z.enum(["manual", "auto", "quick"]),
});
export type Bid = z.infer<typeof BidSchema>;

// Auto-bid schema
export const AutoBidSchema = z.object({
  maxAmount: z.number().min(1),
  isActive: z.boolean(),
  createdAt: z.number(),
});
export type AutoBid = z.infer<typeof AutoBidSchema>;

// Form schemas for react-hook-form
export const CreateLeagueFormSchema = z.object({
  name: z.string().min(3, "Nome deve avere almeno 3 caratteri"),
  leagueType: z.enum(["classic", "mantra"]),
  initialBudgetPerManager: z.number().min(100, "Budget minimo 100 crediti"),
  slotsP: z.number().min(1).max(5),
  slotsD: z.number().min(3).max(10),
  slotsC: z.number().min(3).max(10),
  slotsA: z.number().min(3).max(8),
});
export type CreateLeagueForm = z.infer<typeof CreateLeagueFormSchema>;

export const PlaceBidFormSchema = z.object({
  amount: z.number().min(1, "Offerta minima 1 credito"),
  autoBidMax: z.number().optional(),
});
export type PlaceBidForm = z.infer<typeof PlaceBidFormSchema>;
