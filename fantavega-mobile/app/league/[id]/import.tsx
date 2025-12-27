// app/league/[id]/import.tsx
// Schermata per importazione rose da CSV
// Compatibile con formato esportato da altre app fantacalcio

import { useLeague } from "@/hooks/useLeague";
import {
  importRostersToLeague,
  parseCsvContent,
  validateImportData,
} from "@/services/roster-import.service";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import { router, useLocalSearchParams } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  FileUp,
  Trash2,
  Upload,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function ImportScreen() {
  const { id: leagueId } = useLocalSearchParams<{ id: string }>();
  const { data: league } = useLeague(leagueId ?? "");

  const [csvContent, setCsvContent] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    summary: {
      totalEntries: number;
      validEntries: number;
      teams: string[];
    } | null;
  } | null>(null);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["text/csv", "text/plain", "text/comma-separated-values"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const pickedFile = result.assets[0];
      const file = new File(pickedFile.uri);
      const content = await file.text();

      setCsvContent(content);
      setValidationResult(null);
    } catch (error) {
      console.error("[IMPORT] Error picking file:", error);
      Alert.alert("Errore", "Impossibile leggere il file");
    }
  };

  const handleValidate = async () => {
    if (!leagueId || !csvContent.trim()) return;

    setIsValidating(true);
    setValidationResult(null);

    try {
      const entries = parseCsvContent(csvContent);

      if (entries.length === 0) {
        setValidationResult({
          isValid: false,
          errors: ["Nessuna riga valida trovata nel CSV"],
          warnings: [],
          summary: null,
        });
        return;
      }

      const result = await validateImportData(leagueId, entries);
      setValidationResult({
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        summary: result.summary,
      });
    } catch (error) {
      console.error("[IMPORT] Validation error:", error);
      setValidationResult({
        isValid: false,
        errors: ["Errore durante la validazione"],
        warnings: [],
        summary: null,
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!leagueId || !csvContent.trim() || !validationResult?.isValid) return;

    Alert.alert(
      "Conferma Import",
      "⚠️ ATTENZIONE: Questa operazione SOVRASCRIVERÀ le rose esistenti.\n\nVuoi continuare?",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Importa",
          style: "destructive",
          onPress: async () => {
            setIsImporting(true);

            try {
              const entries = parseCsvContent(csvContent);
              const result = await importRostersToLeague(leagueId, entries);

              if (result.success) {
                Alert.alert(
                  "✅ Import Completato",
                  `Importati ${result.playersImported} giocatori per ${result.teamsImported} squadre`,
                  [
                    {
                      text: "OK",
                      onPress: () => router.back(),
                    },
                  ]
                );
              } else {
                Alert.alert(
                  "Errore Import",
                  result.errors.join("\n") || "Errore sconosciuto"
                );
              }
            } catch (error) {
              console.error("[IMPORT] Error:", error);
              Alert.alert("Errore", "Errore durante l'importazione");
            } finally {
              setIsImporting(false);
            }
          },
        },
      ]
    );
  };

  const handleClear = () => {
    setCsvContent("");
    setValidationResult(null);
  };

  return (
    <ScrollView className="flex-1 bg-dark-bg">
      <View className="p-4">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white">📥 Importa Rose</Text>
          <Text className="mt-1 text-gray-400">
            Importa da file CSV o incolla il contenuto
          </Text>
        </View>

        {/* Warning Banner */}
        <View className="mb-4 flex-row items-center gap-3 rounded-xl bg-amber-900/30 border border-amber-700/50 p-4">
          <AlertCircle size={24} color="#fbbf24" />
          <View className="flex-1">
            <Text className="font-semibold text-amber-300">Attenzione</Text>
            <Text className="text-xs text-amber-400/80">
              L'import sovrascriverà le rose esistenti per i team nel file
            </Text>
          </View>
        </View>

        {/* File Picker */}
        <Pressable
          onPress={handlePickFile}
          className="mb-4 flex-row items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-600 bg-dark-card p-6"
        >
          <FileUp size={24} color="#9ca3af" />
          <Text className="font-medium text-gray-400">
            Seleziona file CSV/TXT
          </Text>
        </Pressable>

        {/* Or Divider */}
        <View className="mb-4 flex-row items-center">
          <View className="h-px flex-1 bg-gray-700" />
          <Text className="mx-4 text-gray-500">oppure incolla qui</Text>
          <View className="h-px flex-1 bg-gray-700" />
        </View>

        {/* Text Input */}
        <View className="mb-4">
          <TextInput
            value={csvContent}
            onChangeText={(text) => {
              setCsvContent(text);
              setValidationResult(null);
            }}
            placeholder="NomeSquadra,IDGiocatore,Prezzo"
            placeholderTextColor="#6b7280"
            multiline
            numberOfLines={8}
            className="rounded-xl bg-dark-card p-4 text-white font-mono text-sm"
            style={{ minHeight: 150, textAlignVertical: "top" }}
          />
          {csvContent && (
            <Pressable
              onPress={handleClear}
              className="absolute right-2 top-2 rounded-lg bg-dark-bg p-2"
            >
              <Trash2 size={16} color="#ef4444" />
            </Pressable>
          )}
        </View>

        {/* Line Count */}
        {csvContent && (
          <Text className="mb-4 text-center text-xs text-gray-500">
            {csvContent.split("\n").filter((l) => l.trim()).length} righe
          </Text>
        )}

        {/* Validate Button */}
        <Pressable
          onPress={handleValidate}
          disabled={!csvContent.trim() || isValidating}
          className={`mb-4 flex-row items-center justify-center gap-2 rounded-xl p-4 ${!csvContent.trim()
            ? "bg-gray-800"
            : isValidating
              ? "bg-gray-700"
              : "bg-blue-600"
            }`}
        >
          {isValidating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <CheckCircle size={20} color="#fff" />
          )}
          <Text className="font-bold text-white">
            {isValidating ? "Validazione..." : "Valida Dati"}
          </Text>
        </Pressable>

        {/* Validation Result */}
        {validationResult && (
          <View
            className={`mb-4 rounded-xl p-4 ${validationResult.isValid
              ? "bg-green-900/30 border border-green-700/50"
              : "bg-red-900/30 border border-red-700/50"
              }`}
          >
            <Text
              className={`font-semibold ${validationResult.isValid ? "text-green-300" : "text-red-300"
                }`}
            >
              {validationResult.isValid ? "✅ Validazione OK" : "❌ Errori trovati"}
            </Text>

            {validationResult.summary && (
              <View className="mt-2">
                <Text className="text-sm text-gray-300">
                  • {validationResult.summary.validEntries} giocatori validi
                </Text>
                <Text className="text-sm text-gray-300">
                  • {validationResult.summary.teams.length} squadre:{" "}
                  {validationResult.summary.teams.join(", ")}
                </Text>
              </View>
            )}

            {validationResult.errors.length > 0 && (
              <View className="mt-2">
                {validationResult.errors.slice(0, 5).map((err, i) => (
                  <Text key={i} className="text-xs text-red-400">
                    • {err}
                  </Text>
                ))}
                {validationResult.errors.length > 5 && (
                  <Text className="text-xs text-red-400">
                    ... e altri {validationResult.errors.length - 5} errori
                  </Text>
                )}
              </View>
            )}

            {validationResult.warnings.length > 0 && (
              <View className="mt-2">
                {validationResult.warnings.slice(0, 3).map((warn, i) => (
                  <Text key={i} className="text-xs text-amber-400">
                    ⚠️ {warn}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Import Button */}
        {validationResult?.isValid && (
          <Pressable
            onPress={handleImport}
            disabled={isImporting}
            className={`flex-row items-center justify-center gap-2 rounded-xl p-4 ${isImporting ? "bg-gray-700" : "bg-green-600"
              }`}
          >
            {isImporting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Upload size={20} color="#fff" />
            )}
            <Text className="font-bold text-white">
              {isImporting ? "Importazione..." : "Importa Rose"}
            </Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  );
}
