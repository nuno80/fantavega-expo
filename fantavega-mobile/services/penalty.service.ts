// services/penalty.service.ts
// Servizio per sistema penalità con lazy evaluation
// Best Practice: Zod validation, Firebase Realtime DB per compliance status

import { firestore, realtimeDb } from "@/lib/firebase";
import { sendPushToUser } from "@/services/notification.service";
import { getUserRoster } from "@/services/roster.service";
import { League, LeagueSchema } from "@/types/schemas";
import { get, ref, set } from "firebase/database";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { z } from "zod";

// ============================================
// CONSTANTS
// ============================================

const PENALTY_AMOUNT = 5;
const MAX_PENALTIES_PER_CYCLE = 5;
const GRACE_PERIOD_MS = 60 * 60 * 1000; // 1 ora

// ============================================
// SCHEMAS
// ============================================

export const ComplianceStatusSchema = z.object({
  phaseIdentifier: z.string(),
  complianceTimerStartAt: z.number().nullish(), // Firebase omette campi null, usa nullish
  lastPenaltyAppliedAt: z.number().nullish(),   // Accetta null E undefined
  penaltiesAppliedThisCycle: z.number().default(0),
});
export type ComplianceStatus = z.infer<typeof ComplianceStatusSchema>;


export interface SlotRequirements {
  P: number;
  D: number;
  C: number;
  A: number;
}

export interface ComplianceCheckResult {
  isCompliant: boolean;
  coveredSlots: SlotRequirements;
  requiredSlots: SlotRequirements;
  missingByRole: Partial<SlotRequirements>;
}

export interface PenaltyProcessResult {
  appliedPenaltyAmount: number;
  isNowCompliant: boolean;
  message: string;
  gracePeriodEndTime?: number;
  totalPenaltiesThisCycle: number;
}

// ============================================
// REFERENCE HELPERS
// ============================================

const getComplianceRef = (leagueId: string, userId: string) =>
  ref(realtimeDb, `compliance/${leagueId}/${userId}`);

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Genera identificatore fase per tracciamento compliance
 */
function getPhaseIdentifier(leagueStatus: string, activeRoles: string | null): string {
  return `${leagueStatus}_${activeRoles ?? "NONE"}`;
}

/**
 * Calcola slot richiesti (N-1 per ruolo attivo)
 * Se activeAuctionRoles è null/undefined durante fase attiva, default a tutti i ruoli
 */
export function calculateRequiredSlots(league: League): SlotRequirements {
  const req: SlotRequirements = { P: 0, D: 0, C: 0, A: 0 };

  let activeRoles = league.activeAuctionRoles;

  // Se non specificato ma siamo in fase attiva, considera tutti i ruoli
  // Questo evita che tutti risultino compliant per errore di configurazione
  if (!activeRoles || activeRoles.trim() === "") {
    // Durante le fasi di asta attiva, se non specificato considera tutti i ruoli
    if (league.status === "draft_active" || league.status === "repair_active") {
      activeRoles = "ALL";
      console.log("[PENALTY] activeAuctionRoles non impostato, default a ALL per fase attiva");
    } else {
      return req; // In fasi non attive, nessun requisito
    }
  }

  if (activeRoles.toUpperCase() === "NONE") {
    return req;
  }

  const roles = activeRoles.toUpperCase() === "ALL"
    ? ["P", "D", "C", "A"]
    : activeRoles.split(",").map(r => r.trim().toUpperCase());

  if (roles.includes("P")) req.P = Math.max(0, league.slotsP - 1);
  if (roles.includes("D")) req.D = Math.max(0, league.slotsD - 1);
  if (roles.includes("C")) req.C = Math.max(0, league.slotsC - 1);
  if (roles.includes("A")) req.A = Math.max(0, league.slotsA - 1);

  console.log("[PENALTY] Required slots:", req, "for roles:", roles);

  return req;
}


/**
 * Verifica se utente è compliant (ha almeno N-1 per ruolo attivo)
 */
function checkCompliance(
  requiredSlots: SlotRequirements,
  coveredSlots: SlotRequirements,
  activeRoles: string | null
): boolean {
  if (!activeRoles || activeRoles.toUpperCase() === "NONE") {
    return true;
  }

  const roles = activeRoles.toUpperCase() === "ALL"
    ? ["P", "D", "C", "A"]
    : activeRoles.split(",").map(r => r.trim().toUpperCase());

  for (const role of roles) {
    const key = role as keyof SlotRequirements;
    if (coveredSlots[key] < requiredSlots[key]) {
      return false;
    }
  }
  return true;
}

// ============================================
// MAIN FUNCTIONS
// ============================================

/**
 * Controlla compliance di un utente in una lega
 */
export async function checkUserCompliance(
  leagueId: string,
  userId: string
): Promise<ComplianceCheckResult> {
  // 1. Recupera lega
  const leagueDoc = await getDoc(doc(firestore, "leagues", leagueId));
  if (!leagueDoc.exists()) {
    throw new Error("League not found");
  }

  const leagueData = leagueDoc.data();
  const league = LeagueSchema.parse({
    ...leagueData,
    id: leagueDoc.id,
    createdAt: leagueData.createdAt?.toDate?.() || new Date(),
    updatedAt: leagueData.updatedAt?.toDate?.() || new Date(),
  });

  // 2. Calcola slot richiesti
  const requiredSlots = calculateRequiredSlots(league);

  // 3. Ottieni rosa utente
  const roster = await getUserRoster(leagueId, userId);
  const coveredSlots: SlotRequirements = {
    P: roster.playersByRole.P.length,
    D: roster.playersByRole.D.length,
    C: roster.playersByRole.C.length,
    A: roster.playersByRole.A.length,
  };

  console.log("[PENALTY] Covered slots from roster:", coveredSlots);
  console.log("[PENALTY] activeAuctionRoles used:", league.activeAuctionRoles ?? "ALL (defaulted)");

  // 4. Verifica compliance
  // NOTA: Se activeAuctionRoles è null, la funzione checkCompliance lo tratta come "nessun requisito"
  // Dobbiamo passare "ALL" esplicitamente se siamo in fase attiva
  const rolesForCheck = league.activeAuctionRoles ??
    ((league.status === "draft_active" || league.status === "repair_active") ? "ALL" : null);

  const isCompliant = checkCompliance(requiredSlots, coveredSlots, rolesForCheck);


  // 5. Calcola mancanti
  const missingByRole: Partial<SlotRequirements> = {};
  for (const role of ["P", "D", "C", "A"] as const) {
    const diff = requiredSlots[role] - coveredSlots[role];
    if (diff > 0) {
      missingByRole[role] = diff;
    }
  }

  return {
    isCompliant,
    coveredSlots,
    requiredSlots,
    missingByRole,
  };
}

/**
 * Processa compliance e applica penalità se dovute
 * Chiamato su: login, accesso asta, superamento offerta
 */
export async function processComplianceAndPenalties(
  leagueId: string,
  userId: string
): Promise<PenaltyProcessResult> {
  // 1. Verifica compliance
  const complianceCheck = await checkUserCompliance(leagueId, userId);

  // 2. Recupera lega per activeAuctionRoles
  const leagueDoc = await getDoc(doc(firestore, "leagues", leagueId));
  const leagueData = leagueDoc.data();
  const phaseIdentifier = getPhaseIdentifier(
    leagueData?.status ?? "unknown",
    leagueData?.activeAuctionRoles ?? null
  );

  // 3. Recupera stato compliance esistente
  const complianceRef = getComplianceRef(leagueId, userId);
  const complianceSnap = await get(complianceRef);

  let complianceStatus: ComplianceStatus = {
    phaseIdentifier,
    complianceTimerStartAt: null,
    lastPenaltyAppliedAt: null,
    penaltiesAppliedThisCycle: 0,
  };

  if (complianceSnap.exists()) {
    const parsed = ComplianceStatusSchema.safeParse(complianceSnap.val());
    if (parsed.success) {
      complianceStatus = parsed.data;
    }
  }

  const now = Date.now();

  // 4. Se fase è cambiata, reset ciclo
  if (complianceStatus.phaseIdentifier !== phaseIdentifier) {
    complianceStatus = {
      phaseIdentifier,
      complianceTimerStartAt: null,
      lastPenaltyAppliedAt: null,
      penaltiesAppliedThisCycle: 0,
    };
  }

  // 5. Se compliant → reset timer e ciclo
  if (complianceCheck.isCompliant) {
    if (complianceStatus.complianceTimerStartAt != null) {
      // Era non-compliant, ora è compliant → reset (== cattura null E undefined da Firebase)
      complianceStatus.complianceTimerStartAt = null;
      complianceStatus.penaltiesAppliedThisCycle = 0;
      await set(complianceRef, complianceStatus);
    }

    return {
      appliedPenaltyAmount: 0,
      isNowCompliant: true,
      message: "Sei in regola con i requisiti di rosa.",
      totalPenaltiesThisCycle: 0,
    };
  }

  // 6. Non compliant → gestisci timer e penalità

  // Se timer non attivo, avvialo (== cattura null E undefined da Firebase)
  if (complianceStatus.complianceTimerStartAt == null) {
    complianceStatus.complianceTimerStartAt = now;
    await set(complianceRef, complianceStatus);
    console.log("[PENALTY] Timer compliance AVVIATO a:", now, "salvato in:", `compliance/${leagueId}/${userId}`);

    return {
      appliedPenaltyAmount: 0,
      isNowCompliant: false,
      message: "Hai 1 ora per completare la rosa, altrimenti inizieranno le penalità.",
      gracePeriodEndTime: now + GRACE_PERIOD_MS,
      totalPenaltiesThisCycle: complianceStatus.penaltiesAppliedThisCycle,
    };
  }

  // Timer attivo - calcola ore trascorse
  const timerStart = complianceStatus.complianceTimerStartAt!; // Non-null assert: arriva qui solo se timer attivo
  const elapsedMs = now - timerStart;
  const elapsedHours = Math.floor(elapsedMs / GRACE_PERIOD_MS);

  // Ancora in periodo di grazia?
  if (elapsedHours < 1) {
    const gracePeriodEndTime = timerStart + GRACE_PERIOD_MS;
    const remainingMs = gracePeriodEndTime - now;
    const remainingMin = Math.ceil(remainingMs / 60000);

    return {
      appliedPenaltyAmount: 0,
      isNowCompliant: false,
      message: `Hai ${remainingMin} minuti per completare la rosa.`,
      gracePeriodEndTime,
      totalPenaltiesThisCycle: complianceStatus.penaltiesAppliedThisCycle,
    };
  }

  // Calcola penalità dovute
  const penaltiesDue = Math.min(elapsedHours, MAX_PENALTIES_PER_CYCLE);
  const penaltiesToApply = penaltiesDue - complianceStatus.penaltiesAppliedThisCycle;

  if (penaltiesToApply <= 0) {
    // Max penalità raggiunto
    return {
      appliedPenaltyAmount: 0,
      isNowCompliant: false,
      message: `Hai raggiunto il massimo delle penalità (${MAX_PENALTIES_PER_CYCLE * PENALTY_AMOUNT} crediti). Completa la rosa!`,
      totalPenaltiesThisCycle: complianceStatus.penaltiesAppliedThisCycle,
    };
  }

  // 7. Applica penalità
  const penaltyAmount = penaltiesToApply * PENALTY_AMOUNT;

  // Aggiorna budget in Firestore
  const participantRef = doc(firestore, "leagues", leagueId, "participants", userId);
  const participantSnap = await getDoc(participantRef);

  if (participantSnap.exists()) {
    const currentBudget = participantSnap.data().currentBudget ?? 0;
    const currentSpent = participantSnap.data().spentCredits ?? 0;
    const newBudget = Math.max(0, currentBudget - penaltyAmount);

    await updateDoc(participantRef, {
      currentBudget: newBudget,
      spentCredits: currentSpent + penaltyAmount, // Penalità conta come crediti spesi
    });
  }

  // Aggiorna stato compliance
  complianceStatus.penaltiesAppliedThisCycle += penaltiesToApply;
  complianceStatus.lastPenaltyAppliedAt = now;
  await set(complianceRef, complianceStatus);

  // Invia push notification
  sendPushToUser(userId, {
    title: "⚠️ Penalità applicata!",
    body: `Hai perso ${penaltyAmount} crediti per rosa incompleta.`,
    data: { type: "penalty_applied", leagueId },
  }).catch(err => console.warn("Push notification failed:", err));

  return {
    appliedPenaltyAmount: penaltyAmount,
    isNowCompliant: false,
    message: `Penalità di ${penaltyAmount} crediti applicata per rosa incompleta.`,
    totalPenaltiesThisCycle: complianceStatus.penaltiesAppliedThisCycle,
  };
}

/**
 * Recupera stato compliance utente (per UI)
 */
export async function getComplianceStatus(
  leagueId: string,
  userId: string
): Promise<ComplianceStatus | null> {
  const complianceRef = getComplianceRef(leagueId, userId);
  const snapshot = await get(complianceRef);

  if (!snapshot.exists()) return null;

  const parsed = ComplianceStatusSchema.safeParse(snapshot.val());
  return parsed.success ? parsed.data : null;
}
