// services/roster-export.service.ts
// Servizio per esportazione rose in formato CSV compatibile con altre app fantacalcio
// Formato: NomeSquadra,IDGiocatore,Prezzo

import { firestore } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getUserRoster, type RosterPlayer } from "./roster.service";

// ============================================
// TYPES
// ============================================

export interface ExportResult {
  success: boolean;
  csvContent: string;
  teamsExported: number;
  playersExported: number;
  error?: string;
}

export interface TeamExportData {
  teamName: string;
  userId: string;
  players: RosterPlayer[];
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

/**
 * Esporta la rosa di un singolo utente in formato CSV
 */
export async function exportUserRosterToCsv(
  leagueId: string,
  userId: string,
  teamName: string
): Promise<ExportResult> {
  try {
    const roster = await getUserRoster(leagueId, userId);

    if (roster.players.length === 0) {
      return {
        success: false,
        csvContent: "",
        teamsExported: 0,
        playersExported: 0,
        error: "Nessun giocatore nella rosa",
      };
    }

    // Ordina per ruolo: P, D, C, A
    const sortedPlayers = [...roster.players].sort((a, b) => {
      const roleOrder = { P: 1, D: 2, C: 3, A: 4 };
      return roleOrder[a.playerRole] - roleOrder[b.playerRole];
    });

    // Genera righe CSV
    const csvRows = sortedPlayers.map(
      (player) => `${teamName},${player.playerId},${player.purchasePrice}`
    );

    return {
      success: true,
      csvContent: csvRows.join("\n"),
      teamsExported: 1,
      playersExported: roster.players.length,
    };
  } catch (error) {
    console.error("[EXPORT] Error exporting roster:", error);
    return {
      success: false,
      csvContent: "",
      teamsExported: 0,
      playersExported: 0,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
}

/**
 * Esporta tutte le rose della lega in formato CSV
 * Separatore tra squadre: $,$,$
 */
export async function exportLeagueRostersToCsv(
  leagueId: string
): Promise<ExportResult> {
  try {
    // Recupera tutti i partecipanti della lega
    const participantsRef = collection(
      firestore,
      "leagues",
      leagueId,
      "participants"
    );
    const participantsSnap = await getDocs(participantsRef);

    if (participantsSnap.empty) {
      return {
        success: false,
        csvContent: "",
        teamsExported: 0,
        playersExported: 0,
        error: "Nessun partecipante nella lega",
      };
    }

    const allCsvRows: string[] = [];
    let totalPlayers = 0;
    let teamsWithPlayers = 0;

    for (const participantDoc of participantsSnap.docs) {
      const userId = participantDoc.id;
      const data = participantDoc.data();
      const teamName = data.managerTeamName || userId;

      // Recupera rosa dell'utente
      const roster = await getUserRoster(leagueId, userId);

      if (roster.players.length > 0) {
        // Aggiungi separatore tra squadre (tranne per la prima)
        if (allCsvRows.length > 0) {
          allCsvRows.push("$,$,$");
        }

        // Ordina per ruolo
        const sortedPlayers = [...roster.players].sort((a, b) => {
          const roleOrder = { P: 1, D: 2, C: 3, A: 4 };
          return roleOrder[a.playerRole] - roleOrder[b.playerRole];
        });

        // Aggiungi righe CSV
        for (const player of sortedPlayers) {
          allCsvRows.push(
            `${teamName},${player.playerId},${player.purchasePrice}`
          );
        }

        totalPlayers += roster.players.length;
        teamsWithPlayers++;
      }
    }

    if (allCsvRows.length === 0) {
      return {
        success: false,
        csvContent: "",
        teamsExported: 0,
        playersExported: 0,
        error: "Nessuna rosa con giocatori trovata",
      };
    }

    return {
      success: true,
      csvContent: allCsvRows.join("\n"),
      teamsExported: teamsWithPlayers,
      playersExported: totalPlayers,
    };
  } catch (error) {
    console.error("[EXPORT] Error exporting league rosters:", error);
    return {
      success: false,
      csvContent: "",
      teamsExported: 0,
      playersExported: 0,
      error: error instanceof Error ? error.message : "Errore sconosciuto",
    };
  }
}

/**
 * Converte il CSV in formato "custom" (compatto senza virgole)
 * Formato: NomeSquadraIDGiocatorePrezzo
 */
export function convertToCustomFormat(csvContent: string): string {
  return csvContent
    .split("\n")
    .map((row) => {
      if (row === "$,$,$") return "$";
      const [teamName, playerId, price] = row.split(",");
      return `${teamName.replace(/\s/g, "")}${playerId}${price}`;
    })
    .join("\n");
}
