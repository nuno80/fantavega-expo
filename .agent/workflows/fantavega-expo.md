---
description: Riprende il lavoro sulla migrazione Fantavega Expo seguendo le best practices
---

# Workflow: Ripresa Lavori Fantavega Expo

Questo workflow permette di riprendere rapidamente il lavoro sulla migrazione Fantavega da Next.js a Expo.

## Step 1: Leggi le Best Practices
// turbo
```bash
cat /home/nuno/programmazione/fantavega-expo/expo-best.practices.md
```

Ricorda i punti chiave:
- ❌ NO `useMemo`/`useCallback` (React Compiler attivo)
- ❌ NO `AsyncStorage` → usa `expo-sqlite/kv-store`
- ❌ NO `FlatList` → usa `FlashList`
- ❌ NO `<Image/>` RN → usa `expo-image`
- ✅ Zod per validazione dati esterni
- ✅ TanStack Query per server state
- ✅ react-hook-form per form
- ✅ Expo Router con `typedRoutes: true`
- ✅ Usa sempre **pnpm** come package manager

## Step 2: Verifica lo Stato Attuale
// turbo
```bash
cat /home/nuno/programmazione/fantavega-expo/TASK.md
```

## Step 3: Rivedi l'Implementation Plan
// turbo
```bash
cat /home/nuno/programmazione/fantavega-expo/IMPLEMENTATION_PLAN.md
```

## Step 4: Identifica il Prossimo Task

Basandoti su TASK.md e IMPLEMENTATION_PLAN.md:
1. Trova il primo item `[ ]` non completato
2. Aggiorna TASK.md marcandolo come `[/]` in progress
3. Procedi con l'implementazione

## Step 5: Al Termine di Ogni Sub-Task

Dopo aver completato un sub-task:
1. Aggiorna `TASK.md`: marca il task come `[x]` completato
2. Aggiorna `IMPLEMENTATION_PLAN.md` se necessario (nuove decisioni, modifiche)
3. Verifica TypeScript:
// turbo
```bash
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && pnpm exec tsc --noEmit
```

## Percorsi Chiave

| File | Percorso |
|------|----------|
| Best Practices | `/home/nuno/programmazione/fantavega-expo/expo-best.practices.md` |
| Task Checklist | `/home/nuno/programmazione/fantavega-expo/TASK.md` |
| Implementation Plan | `/home/nuno/programmazione/fantavega-expo/IMPLEMENTATION_PLAN.md` |
| Progetto Expo | `/home/nuno/programmazione/fantavega-expo/fantavega-mobile/` |
| Progetto Next.js (riferimento) | `/home/nuno/programmazione/fantavega-expo/fantavega/` |

## Comandi pnpm Utili

```bash
# Verifica TypeScript
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && pnpm exec tsc --noEmit

# Avvia dev server
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && pnpm exec expo start

# Installa dipendenza Expo-compatibile
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && pnpm exec expo install <package>

# Installa dipendenza normale
cd /home/nuno/programmazione/fantavega-expo/fantavega-mobile && pnpm add <package>
```

## Note Importanti

- **Package Manager**: Usa SEMPRE `pnpm`, MAI npm o yarn
- **Dipendenze Expo**: Usa `pnpm exec expo install` per pacchetti nativi
- **Dipendenze JS-only**: Usa `pnpm add` per pacchetti JavaScript puri
