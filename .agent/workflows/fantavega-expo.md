---
description: Riprende il lavoro sulla migrazione Fantavega Expo seguendo le best practices
---

# Workflow: Ripresa Lavori Fantavega Expo

Riprende rapidamente il lavoro sulla migrazione Fantavega da Next.js a Expo.

> ℹ️ `GEMINI.md` viene letto automaticamente all'avvio. Questo workflow legge i file operativi.

## Step 1: Leggi Best Practices Tecniche
// turbo
```bash
cat /home/nuno/programmazione/fantavega-expo/expo-best.practices.md
```

**Regole chiave:**
- ❌ NO `useMemo`/`useCallback` (React Compiler attivo)
- ❌ NO `AsyncStorage` → `expo-sqlite/kv-store`
- ❌ NO `FlatList` → `FlashList`
- ❌ NO `<Image/>` RN → `expo-image`
- ❌ NO librerie web (Shadcn, Radix, MUI)
- ✅ Zod per dati esterni
- ✅ `Modal` nativo RN (Fabric-safe)
- ✅ **pnpm** sempre

## Step 2: Leggi Regole di Gioco
// turbo
```bash
cat /home/nuno/programmazione/fantavega-expo/GAME_RULES.md
```

## Step 3: Verifica Stato Attuale
// turbo
```bash
cat /home/nuno/programmazione/fantavega-expo/TASK.md
```

## Step 4: Identifica il Prossimo Task

1. Trova il primo `[ ]` non completato in TASK.md
2. Marcalo come `[/]` in progress
3. Procedi con l'implementazione

## Step 5: Al Termine di Ogni Sub-Task

1. Aggiorna `TASK.md`: marca `[x]` completato
2. Verifica TypeScript:
// turbo
```bash
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && pnpm exec tsc --noEmit
```

---

## Comandi Essenziali

```bash
# Dev server (WSL con tunnel)
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && EXPO_TUNNEL_SUBDOMAIN=fantavega pnpm exec expo start --tunnel

# Type check
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && pnpm exec tsc --noEmit

# Installa dipendenza Expo (nativa)
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && pnpm exec expo install <package>

# Nuovo build (dopo librerie native)
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && eas build --profile development --platform android
```
