// services/roster-import.service.ts
// Servizio per importazione rose da CSV
// Formato atteso: NomeSquadra,IDGiocatore,Prezzo

import { firestore, realtimeDb } from "@/lib/firebase";
import { PlayerRole } from "@/types";
import { ref, remove, set } from "firebase/database";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { getPlayerById } from "./player.service";

// ============================================
// TYPES
// ============================================

export interface ParsedRosterEntry {
  teamName: string;
  playerId: number;
  purchasePrice: number;
  lineNumber: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validEntries: ParsedRosterEntry[];
  summary: {
    totalEntries: number;
    validEntries: number;
    skippedEntries: number;
    teams: string[];
  };
}

export interface ImportResult {
  success: boolean;
  teamsImported: number;
  playersImported: number;
  errors: string[];
  warnings: string[];
}

// ============================================
// PARSING
// ============================================

/**
 * Analizza il contenuto CSV e restituisce le entry parsate.
 * Supporta sia TAB che virgola come delimitatori.
 */
export function parseCsvContent(content: string): ParsedRosterEntry[] {
  const entries: ParsedRosterEntry[] = [];
  const lines = content.trim().split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineNumber = i + 1;

    // Salta righe vuote
    if (!line) continue;

    // Salta separatori di squadra ($ $ $ o $,$,$ o $)
    if (/^\$[\s,\t]*\$[\s,\t]*\$/.test(line) || line === "$") continue;

    // Determina il delimitatore (tab o virgola)
    const delimiter = line.includes("\t") ? "\t" : ",";
    const parts = line.split(delimiter).map((p) => p.trim());

    if (parts.length < 3) {
      console.warn(
        `[ROSTER-IMPORT] Riga ${lineNumber}: formato non valido (${parts.length} colonne), skipping`
      );
      continue;
    }

    const [teamName, playerIdStr, priceStr] = parts;
    const playerId = parseInt(playerIdStr, 10);
    const purchasePrice = parseInt(priceStr, 10);

    if (!teamName || isNaN(playerId) || isNaN(purchasePrice)) {
      console.warn(
        `[ROSTER-IMPORT] Riga ${lineNumber}: dati non validi, skipping`
      );
      continue;
    }

    entries.push({
      teamName,
      playerId,
      purchasePrice,
      lineNumber,
    });
  }

  console.log(
    `[ROSTER-IMPORT] Parsing completato: ${entries.length} entry valide trovate`
  );
  return entries;
}

// ============================================
// VALIDATION
// ============================================

/**
 * Valida i dati di import contro Firebase.
 * Verifica che i team esistano come partecipanti e che i giocatori esistano.
 */
export async function validateImportData(
  leagueId: string,
  entries: ParsedRosterEntry[]
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validEntries: ParsedRosterEntry[] = [];

  console.log(
    `[ROSTER-IMPORT] Validazione ${entries.length} entry per lega ${leagueId}`
  );

  // 1. Recupera i partecipanti della lega
  const participantsRef = collection(
    firestore,
    "leagues",
    leagueId,
    "participants"
  );
  const participantsSnap = await getDocs(participantsRef);

  if (participantsSnap.empty) {
    errors.push("Nessun partecipante trovato nella lega");
    return {
      isValid: false,
      errors,
      warnings,
      validEntries: [],
      summary: { totalEntries: 0, validEntries: 0, skippedEntries: 0, teams: [] },
    };
  }

  // Crea mappa case-insensitive dei team name -> userId
  const teamNameToUserId = new Map<string, string>();
  for (const doc of participantsSnap.docs) {
    const data = doc.data();
    const teamName = (data.managerTeamName || doc.id).toLowerCase();
    teamNameToUserId.set(teamName, doc.id);
  }

  // 2. Valida ogni entry
  const teamsFound = new Set<string>();
  const playerCache = new Map<number, boolean>();

  for (const entry of entries) {
    const teamNameLower = entry.teamName.toLowerCase();
    const userId = teamNameToUserId.get(teamNameLower);

    // Verifica che il team esista
    if (!userId) {
      errors.push(
        `Riga ${entry.lineNumber}: Team "${entry.teamName}" non trovato tra i partecipanti`
      );
      continue;
    }

    // Verifica che il giocatore esista (con cache)
    if (!playerCache.has(entry.playerId)) {
      const player = await getPlayerById(entry.playerId);
      playerCache.set(entry.playerId, player !== null);
    }

    if (!playerCache.get(entry.playerId)) {
      warnings.push(
        `Riga ${entry.lineNumber}: Giocatore ID ${entry.playerId} non trovato, sarà saltato`
      );
      continue;
    }

    // Entry valida
    validEntries.push(entry);
    teamsFound.add(entry.teamName);
  }

  return {
    isValid: errors.length === 0 && validEntries.length > 0,
    errors,
    warnings,
    validEntries,
    summary: {
      totalEntries: entries.length,
      validEntries: validEntries.length,
      skippedEntries: entries.length - validEntries.length,
      teams: Array.from(teamsFound),
    },
  };
}

// ============================================
// IMPORT
// ============================================

/**
 * Esegue l'import delle rose nella lega.
 * ATTENZIONE: Sovrascrive le rose esistenti!
 */
export async function importRostersToLeague(
  leagueId: string,
  entries: ParsedRosterEntry[]
): Promise<ImportResult> {
  console.log(
    `[ROSTER-IMPORT] Inizio import ${entries.length} entry per lega ${leagueId}`
  );

  // 1. Valida i dati
  const validation = await validateImportData(leagueId, entries);

  if (!validation.isValid) {
    return {
      success: false,
      teamsImported: 0,
      playersImported: 0,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  }

  // 2. Recupera mapping team -> userId
  const participantsRef = collection(
    firestore,
    "leagues",
    leagueId,
    "participants"
  );
  const participantsSnap = await getDocs(participantsRef);

  const teamNameToUserId = new Map<string, string>();
  for (const docSnap of participantsSnap.docs) {
    const data = docSnap.data();
    const teamName = (data.managerTeamName || docSnap.id).toLowerCase();
    teamNameToUserId.set(teamName, docSnap.id);
  }

  // 3. Raggruppa entry per team/userId
  const entriesByUser = new Map<string, ParsedRosterEntry[]>();
  for (const entry of validation.validEntries) {
    const userId = teamNameToUserId.get(entry.teamName.toLowerCase())!;
    if (!entriesByUser.has(userId)) {
      entriesByUser.set(userId, []);
    }
    entriesByUser.get(userId)!.push(entry);
  }

  // 4. Per ogni utente: cancella rosa esistente e inserisci nuova
  let totalPlayersImported = 0;
  const teamsImported = new Set<string>();

  try {
    for (const [userId, userEntries] of entriesByUser) {
      // Cancella rosa esistente
      const rosterRef = ref(realtimeDb, `rosters/${leagueId}/${userId}/players`);
      await remove(rosterRef);

      // Contatori per ruolo
      const roleCounters = { P: 0, D: 0, C: 0, A: 0 };
      let totalSpent = 0;

      // Inserisci nuovi giocatori
      for (const entry of userEntries) {
        const player = await getPlayerById(entry.playerId);
        if (!player) continue;

        const playerRef = ref(
          realtimeDb,
          `rosters/${leagueId}/${userId}/players/${entry.playerId}`
        );

        await set(playerRef, {
          playerId: entry.playerId,
          playerName: player.name,
          playerRole: player.role,
          playerTeam: player.team,
          playerPhotoUrl: player.photoUrl ?? null,
          purchasePrice: entry.purchasePrice,
          purchasedAt: Date.now(),
        });

        roleCounters[player.role as PlayerRole]++;
        totalSpent += entry.purchasePrice;
        totalPlayersImported++;
      }

      // Aggiorna contatori partecipante in Firestore
      const participantRef = doc(
        firestore,
        "leagues",
        leagueId,
        "participants",
        userId
      );

      // Recupera budget iniziale dalla lega
      const leagueRef = doc(firestore, "leagues", leagueId);
      // Per semplicità, assumiamo budget iniziale 500 (andrebbe recuperato dalla lega)
      const initialBudget = 500;

      await updateDoc(participantRef, {
        playersP: roleCounters.P,
        playersD: roleCounters.D,
        playersC: roleCounters.C,
        playersA: roleCounters.A,
        currentBudget: initialBudget - totalSpent,
      });

      teamsImported.add(userId);
    }

    console.log(
      `[ROSTER-IMPORT] Import completato: ${teamsImported.size} team, ${totalPlayersImported} giocatori`
    );

    return {
      success: true,
      teamsImported: teamsImported.size,
      playersImported: totalPlayersImported,
      errors: [],
      warnings: validation.warnings,
    };
  } catch (error) {
    console.error("[ROSTER-IMPORT] Errore durante import:", error);
    return {
      success: false,
      teamsImported: 0,
      playersImported: 0,
      errors: [
        `Errore durante l'import: ${error instanceof Error ? error.message : "Errore sconosciuto"
        }`,
      ],
      warnings: validation.warnings,
    };
  }
}
