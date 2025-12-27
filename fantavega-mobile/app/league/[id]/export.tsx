// app/league/[id]/export.tsx
// Schermata per esportazione rosa in formato CSV
// Compatibile con altre app fantacalcio

import { useCurrentUser } from "@/contexts/AuthContext";
import { useLeague } from "@/hooks/useLeague";
import { getLeagueParticipants } from "@/services/league.service";
import {
  convertToCustomFormat,
  exportLeagueRostersToCsv,
  exportUserRosterToCsv,
} from "@/services/roster-export.service";
import * as Clipboard from "expo-clipboard";
import { useLocalSearchParams } from "expo-router";
import { Check, Copy, Download, FileText, Share2, Users } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

type ExportFormat = "csv" | "custom";
type ExportScope = "my" | "all";

export default function ExportScreen() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const { currentUserId } = useCurrentUser();
  const { data: league } = useLeague(leagueId ?? "");

  const [format, setFormat] = useState<ExportFormat>("csv");
  const [scope, setScope] = useState<ExportScope>("my");
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [teamName, setTeamName] = useState<string | null>(null);

  // Carica il nome del team dell'utente
  useState(() => {
    if (leagueId && currentUserId) {
      getLeagueParticipants(leagueId).then((participants) => {
        const me = participants.find((p) => p.userId === currentUserId);
        if (me) {
          setTeamName(me.managerTeamName);
        }
      });
    }
  });

  const handleExport = async () => {
    if (!leagueId || !currentUserId) return;

    setIsExporting(true);
    setExportResult(null);

    try {
      let result;

      if (scope === "my") {
        const name = teamName || currentUserId;
        result = await exportUserRosterToCsv(leagueId, currentUserId, name);
      } else {
        result = await exportLeagueRostersToCsv(leagueId);
      }

      if (!result.success) {
        Alert.alert("Errore", result.error || "Errore durante l'esportazione");
        return;
      }

      let content = result.csvContent;
      if (format === "custom") {
        content = convertToCustomFormat(content);
      }

      setExportResult(content);
    } catch (error) {
      console.error("[EXPORT] Error:", error);
      Alert.alert("Errore", "Errore durante l'esportazione");
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    if (!exportResult) return;
    await Clipboard.setStringAsync(exportResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!exportResult) return;

    try {
      // Dynamic import per evitare crash su Expo Go
      const { File, Paths } = await import("expo-file-system");
      const Sharing = await import("expo-sharing");

      const fileName = `fantavega-export-${leagueId}-${Date.now()}.${format === "csv" ? "csv" : "txt"}`;
      const file = new File(Paths.cache, fileName);
      await file.write(exportResult);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri, {
          mimeType: format === "csv" ? "text/csv" : "text/plain",
          dialogTitle: "Esporta Rosa",
        });
      } else {
        // Fallback: copia negli appunti
        await Clipboard.setStringAsync(exportResult);
        Alert.alert("Copiato!", "Contenuto copiato negli appunti (condivisione non disponibile)");
      }
    } catch (error) {
      // Fallback per Expo Go: solo copia
      console.warn("[EXPORT] Native sharing not available, falling back to copy:", error);
      await Clipboard.setStringAsync(exportResult);
      Alert.alert(
        "Copiato!",
        "Contenuto copiato negli appunti.\n\n(Per condividere file, usa un development build)"
      );
    }
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white">📤 Esporta Rosa</Text>
          <Text className="mt-1 text-gray-400">
            Esporta in formato compatibile con altre app
          </Text>
        </View>

        {/* Scope Selection */}
        <View className="mb-4">
          <Text className="mb-2 text-sm font-medium text-gray-300">
            Cosa esportare
          </Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setScope("my")}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl p-4 ${scope === "my" ? "bg-primary-600" : "bg-dark-card"
                }`}
            >
              <FileText size={20} color={scope === "my" ? "#fff" : "#9ca3af"} />
              <Text
                className={`font-medium ${scope === "my" ? "text-white" : "text-gray-400"
                  }`}
              >
                La mia rosa
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setScope("all")}
              className={`flex-1 flex-row items-center justify-center gap-2 rounded-xl p-4 ${scope === "all" ? "bg-primary-600" : "bg-dark-card"
                }`}
            >
              <Users size={20} color={scope === "all" ? "#fff" : "#9ca3af"} />
              <Text
                className={`font-medium ${scope === "all" ? "text-white" : "text-gray-400"
                  }`}
              >
                Tutta la lega
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Format Selection */}
        <View className="mb-6">
          <Text className="mb-2 text-sm font-medium text-gray-300">Formato</Text>
          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setFormat("csv")}
              className={`flex-1 rounded-xl p-4 ${format === "csv" ? "bg-primary-600" : "bg-dark-card"
                }`}
            >
              <Text
                className={`text-center font-medium ${format === "csv" ? "text-white" : "text-gray-400"
                  }`}
              >
                CSV Standard
              </Text>
              <Text
                className={`mt-1 text-center text-xs ${format === "csv" ? "text-primary-200" : "text-gray-500"
                  }`}
              >
                Team,ID,Prezzo
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setFormat("custom")}
              className={`flex-1 rounded-xl p-4 ${format === "custom" ? "bg-primary-600" : "bg-dark-card"
                }`}
            >
              <Text
                className={`text-center font-medium ${format === "custom" ? "text-white" : "text-gray-400"
                  }`}
              >
                Compatto
              </Text>
              <Text
                className={`mt-1 text-center text-xs ${format === "custom" ? "text-primary-200" : "text-gray-500"
                  }`}
              >
                TeamIDPrezzo
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Export Button */}
        <Pressable
          onPress={handleExport}
          disabled={isExporting}
          className={`mb-6 flex-row items-center justify-center gap-2 rounded-xl p-4 ${isExporting ? "bg-gray-700" : "bg-green-600"
            }`}
        >
          {isExporting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Download size={20} color="#fff" />
          )}
          <Text className="font-bold text-white">
            {isExporting ? "Esportazione..." : "Genera Export"}
          </Text>
        </Pressable>

        {/* Result Preview */}
        {exportResult && (
          <View className="rounded-xl bg-dark-card p-4">
            <View className="mb-3 flex-row items-center justify-between">
              <Text className="font-semibold text-white">Anteprima</Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={handleCopy}
                  className="flex-row items-center gap-1 rounded-lg bg-dark-bg px-3 py-2"
                >
                  {copied ? (
                    <Check size={16} color="#22c55e" />
                  ) : (
                    <Copy size={16} color="#9ca3af" />
                  )}
                  <Text className="text-sm text-gray-400">
                    {copied ? "Copiato!" : "Copia"}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={handleShare}
                  className="flex-row items-center gap-1 rounded-lg bg-primary-600 px-3 py-2"
                >
                  <Share2 size={16} color="#fff" />
                  <Text className="text-sm font-medium text-white">Condividi</Text>
                </Pressable>
              </View>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="max-h-64 rounded-lg bg-dark-bg p-3"
            >
              <Text className="font-mono text-xs text-gray-300">
                {exportResult.split("\n").slice(0, 30).join("\n")}
                {exportResult.split("\n").length > 30 && "\n..."}
              </Text>
            </ScrollView>
            <Text className="mt-2 text-center text-xs text-gray-500">
              {exportResult.split("\n").filter((l) => l && l !== "$,$,$" && l !== "$").length} giocatori
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
